-- ============================================================
-- HABITAD 2.0 — Reforzar captura del usuario en auditoría
-- ============================================================
-- Problema detectado: la columna "usuario_id" en v2.auditoria aparece
-- como NULL para los registros creados durante las pruebas.
--
-- Causas posibles:
--   1. Los seeds iniciales se hicieron vía service_role (sin JWT) →
--      auth.uid() retorna NULL. Normal.
--   2. El intento de leer auth.uid() dentro de SECURITY DEFINER puede
--      comportarse distinto que en contexto de consulta normal.
--
-- Fix: leer primero current_setting('request.jwt.claim.sub') que
-- PostgREST siempre setea al procesar el request, y caer a auth.uid()
-- como fallback. Dejamos NULL solo si el write viene de service_role
-- sin auth (legítimo para scripts de mantenimiento).
-- ============================================================

CREATE OR REPLACE FUNCTION v2.log_audit()
RETURNS trigger AS $$
DECLARE
  v_user uuid;
  v_claim text;
  v_row_id text;
  v_changes jsonb;
BEGIN
  -- Intento 1: leer el claim sub del JWT (PostgREST lo setea por request)
  BEGIN
    v_claim := current_setting('request.jwt.claim.sub', true);
    IF v_claim IS NOT NULL AND v_claim <> '' THEN
      v_user := v_claim::uuid;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_user := NULL;
  END;

  -- Intento 2: auth.uid() por si el anterior no lo devolvió
  IF v_user IS NULL THEN
    BEGIN
      v_user := auth.uid();
    EXCEPTION WHEN OTHERS THEN
      v_user := NULL;
    END;
  END IF;

  IF TG_OP = 'DELETE' THEN
    v_row_id := OLD.id::text;
    v_changes := jsonb_build_object('old', to_jsonb(OLD));
  ELSIF TG_OP = 'UPDATE' THEN
    v_row_id := NEW.id::text;
    v_changes := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  ELSE
    v_row_id := NEW.id::text;
    v_changes := jsonb_build_object('new', to_jsonb(NEW));
  END IF;

  INSERT INTO v2.auditoria (tabla, fila_id, operacion, usuario_id, cambios)
  VALUES (TG_TABLE_NAME, v_row_id, TG_OP::v2.operacion_audit, v_user, v_changes);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

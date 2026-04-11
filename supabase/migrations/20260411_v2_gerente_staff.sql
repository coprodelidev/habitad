-- ============================================================
-- HABITAD 2.0 — Gerente pasa a ser staff operativo (no admin)
-- ============================================================
-- Decisión: según el spec original solo existe "Administrador" con
-- CRUD total. Gerente queda como rol de supervisión operativa sin
-- acceso al módulo de Administración ni a la gestión de usuarios.
--
-- Cambios:
--   1. v2.is_admin() ahora devuelve true SOLO para 'administrador'.
--      Gerente sigue siendo staff (v2.is_staff() lo incluye) y sigue
--      viendo todo vía los listados hardcodeados en las policies
--      (ventas_select, pagos_select, cuotas_select, etc.).
--   2. Notificaciones de vencimiento (liberar_separaciones_vencidas
--      y cancelar_iniciales_vencidas) notifican solo a 'administrador'
--      (antes incluían gerente — no era lo que pedía el spec).
-- ============================================================

CREATE OR REPLACE FUNCTION v2.is_admin()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT v2.user_role() = 'administrador';
$$;

CREATE OR REPLACE FUNCTION v2.liberar_separaciones_vencidas()
RETURNS int AS $$
DECLARE
  v_count int := 0;
  v_venta v2.ventas%ROWTYPE;
  v_admin uuid;
BEGIN
  FOR v_venta IN
    SELECT * FROM v2.ventas
    WHERE estado = 'separacion'
      AND fecha_pago_separacion IS NULL
      AND fecha_vencimiento_separacion < now()
  LOOP
    UPDATE v2.ventas
      SET estado = 'cancelada',
          fecha_cancelacion = now(),
          motivo_cancelacion = 'Separación vencida sin pago (24h)'
      WHERE id = v_venta.id;
    v_count := v_count + 1;

    IF v_venta.promotor_id IS NOT NULL THEN
      INSERT INTO v2.notificaciones (usuario_id, tipo, titulo, mensaje, venta_id)
      VALUES (v_venta.promotor_id, 'separacion_vencida', 'Separación liberada',
              'La separación de la unidad fue liberada por vencimiento 24h.', v_venta.id);
    END IF;

    FOR v_admin IN
      SELECT p.id FROM public.profiles p
      JOIN public.roles r ON r.id = p.role_id
      WHERE r.code = 'administrador'
    LOOP
      INSERT INTO v2.notificaciones (usuario_id, tipo, titulo, mensaje, venta_id)
      VALUES (v_admin, 'separacion_vencida', 'Separación liberada',
              'Se liberó una separación por vencimiento 24h.', v_venta.id);
    END LOOP;
  END LOOP;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION v2.cancelar_iniciales_vencidas()
RETURNS int AS $$
DECLARE
  v_count int := 0;
  v_venta v2.ventas%ROWTYPE;
  v_total_inicial numeric(12,2);
  v_admin uuid;
BEGIN
  FOR v_venta IN
    SELECT * FROM v2.ventas
    WHERE estado = 'inicial'
      AND fecha_limite_inicial IS NOT NULL
      AND fecha_limite_inicial < now()
  LOOP
    SELECT COALESCE(SUM(monto), 0) INTO v_total_inicial
      FROM v2.pagos
      WHERE venta_id = v_venta.id AND tipo = 'inicial' AND estado <> 'anulado';

    IF v_venta.monto_inicial_objetivo IS NOT NULL AND v_total_inicial >= v_venta.monto_inicial_objetivo THEN
      UPDATE v2.ventas SET fecha_inicial_completa = COALESCE(fecha_inicial_completa, now()) WHERE id = v_venta.id;
    ELSE
      UPDATE v2.ventas
        SET estado = 'cancelada',
            fecha_cancelacion = now(),
            motivo_cancelacion = 'Inicial no completada en 3 meses'
        WHERE id = v_venta.id;
      v_count := v_count + 1;

      IF v_venta.promotor_id IS NOT NULL THEN
        INSERT INTO v2.notificaciones (usuario_id, tipo, titulo, mensaje, venta_id)
        VALUES (v_venta.promotor_id, 'inicial_vencida', 'Venta cancelada',
                'Inicial no completada en 3 meses; unidad liberada.', v_venta.id);
      END IF;

      FOR v_admin IN
        SELECT p.id FROM public.profiles p
        JOIN public.roles r ON r.id = p.role_id
        WHERE r.code = 'administrador'
      LOOP
        INSERT INTO v2.notificaciones (usuario_id, tipo, titulo, mensaje, venta_id)
        VALUES (v_admin, 'inicial_vencida', 'Venta cancelada por inicial vencida',
                'Una venta fue cancelada automáticamente por inicial no completada.', v_venta.id);
      END LOOP;
    END IF;
  END LOOP;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

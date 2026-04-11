-- ============================================================
-- HABITAD 2.0 — Storage buckets y funciones de negocio
-- ============================================================

-- ------------------------------------------------------------
-- Buckets de Storage
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('v2-vouchers',        'v2-vouchers',        false, 10485760, ARRAY['image/png','image/jpeg','image/webp','application/pdf']),
  ('v2-documentos',      'v2-documentos',      false, 15728640, ARRAY['application/pdf','image/png','image/jpeg']),
  ('v2-planos',          'v2-planos',          true,  10485760, ARRAY['image/png','image/jpeg','image/webp','image/svg+xml']),
  ('v2-reportes-banco',  'v2-reportes-banco',  false, 20971520, ARRAY['application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/csv','application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Policies de Storage para v2
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname LIKE 'v2_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

-- Vouchers: staff escribe, staff/auditor lee
CREATE POLICY v2_vouchers_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'v2-vouchers' AND (v2.is_staff() OR v2.is_auditor()));
CREATE POLICY v2_vouchers_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'v2-vouchers' AND v2.is_staff());
CREATE POLICY v2_vouchers_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'v2-vouchers' AND v2.is_admin());
CREATE POLICY v2_vouchers_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'v2-vouchers' AND v2.is_admin());

-- Documentos: staff gestiona; clientes ven los de sus ventas
CREATE POLICY v2_docs_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'v2-documentos' AND (v2.is_staff() OR v2.is_auditor() OR v2.is_cliente()));
CREATE POLICY v2_docs_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'v2-documentos' AND v2.is_staff());
CREATE POLICY v2_docs_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'v2-documentos' AND v2.is_staff());
CREATE POLICY v2_docs_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'v2-documentos' AND v2.is_admin());

-- Planos: público en lectura, admin escribe
CREATE POLICY v2_planos_select ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'v2-planos');
CREATE POLICY v2_planos_write ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'v2-planos' AND v2.is_admin());
CREATE POLICY v2_planos_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'v2-planos' AND v2.is_admin());
CREATE POLICY v2_planos_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'v2-planos' AND v2.is_admin());

-- Reportes banco: solo admin
CREATE POLICY v2_rbank_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'v2-reportes-banco' AND (v2.is_admin() OR v2.is_auditor()));
CREATE POLICY v2_rbank_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'v2-reportes-banco' AND v2.is_admin());
CREATE POLICY v2_rbank_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'v2-reportes-banco' AND v2.is_admin());

-- ============================================================
-- Función: sincronizar estado físico de propiedad con la venta
-- ============================================================
CREATE OR REPLACE FUNCTION v2.sync_propiedad_estado()
RETURNS trigger AS $$
DECLARE
  v_fisico v2.estado_fisico;
  v_comercial v2.estado_comercial;
BEGIN
  -- Derivar estado desde la venta
  IF NEW.estado = 'separacion' THEN
    v_fisico := 'separado';
    v_comercial := 'separacion';
  ELSIF NEW.estado = 'inicial' THEN
    v_fisico := 'ocupado';
    v_comercial := 'inicial';
  ELSIF NEW.estado = 'cuotas' THEN
    v_fisico := 'ocupado';
    v_comercial := 'cuotas';
  ELSIF NEW.estado = 'cancelada' THEN
    v_fisico := 'libre';
    v_comercial := 'sin_venta';
  ELSIF NEW.estado = 'entregada' THEN
    v_fisico := 'ocupado';
    v_comercial := 'entregada';
  ELSE
    RETURN NEW;
  END IF;

  UPDATE v2.propiedades
  SET estado_fisico = v_fisico,
      estado_comercial = v_comercial
  WHERE id = NEW.propiedad_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_propiedad_estado ON v2.ventas;
CREATE TRIGGER trg_sync_propiedad_estado
  AFTER INSERT OR UPDATE OF estado ON v2.ventas
  FOR EACH ROW
  EXECUTE FUNCTION v2.sync_propiedad_estado();

-- ============================================================
-- Función: aplicar pago a cuotas y calcular saldo a favor
-- Regla clave: sobrepago NUNCA va a cuotas finales automáticamente,
-- queda como saldo_favor y se consume contra la siguiente cuota vencida.
-- ============================================================
CREATE OR REPLACE FUNCTION v2.aplicar_pago_cuota(p_pago_id uuid)
RETURNS void AS $$
DECLARE
  v_pago v2.pagos%ROWTYPE;
  v_cuota v2.cuotas%ROWTYPE;
  v_disponible numeric(12,2);
  v_aplicar numeric(12,2);
  v_faltante numeric(12,2);
BEGIN
  SELECT * INTO v_pago FROM v2.pagos WHERE id = p_pago_id;
  IF v_pago IS NULL OR v_pago.tipo <> 'cuota' OR v_pago.estado = 'anulado' THEN
    RETURN;
  END IF;

  v_disponible := v_pago.monto;

  -- Si se indicó cuota_numero, aplicar primero a esa cuota
  IF v_pago.cuota_numero IS NOT NULL THEN
    SELECT * INTO v_cuota FROM v2.cuotas
      WHERE venta_id = v_pago.venta_id AND numero = v_pago.cuota_numero;
    IF v_cuota IS NOT NULL AND v_cuota.estado <> 'pagada' THEN
      v_faltante := v_cuota.monto - v_cuota.monto_pagado;
      v_aplicar := LEAST(v_disponible, v_faltante);
      UPDATE v2.cuotas
        SET monto_pagado = monto_pagado + v_aplicar,
            estado = CASE
              WHEN monto_pagado + v_aplicar >= monto THEN 'pagada'::v2.estado_cuota
              WHEN monto_pagado + v_aplicar > 0 THEN 'parcial'::v2.estado_cuota
              ELSE estado
            END
      WHERE id = v_cuota.id;
      v_disponible := v_disponible - v_aplicar;
    END IF;
  END IF;

  -- Si queda excedente, intentar consumirlo contra la siguiente cuota pendiente/parcial (más antigua)
  WHILE v_disponible > 0 LOOP
    SELECT * INTO v_cuota FROM v2.cuotas
      WHERE venta_id = v_pago.venta_id AND estado IN ('pendiente','parcial','vencida')
      ORDER BY numero ASC
      LIMIT 1;
    IF v_cuota IS NULL THEN EXIT; END IF;
    v_faltante := v_cuota.monto - v_cuota.monto_pagado;
    IF v_faltante <= 0 THEN EXIT; END IF;
    v_aplicar := LEAST(v_disponible, v_faltante);
    UPDATE v2.cuotas
      SET monto_pagado = monto_pagado + v_aplicar,
          estado = CASE
            WHEN monto_pagado + v_aplicar >= monto THEN 'pagada'::v2.estado_cuota
            ELSE 'parcial'::v2.estado_cuota
          END
    WHERE id = v_cuota.id;
    v_disponible := v_disponible - v_aplicar;
  END LOOP;

  -- Si aún queda, registrar saldo a favor (NUNCA mover a cuotas finales automáticas)
  IF v_disponible > 0 THEN
    INSERT INTO v2.saldos_favor (venta_id, monto, moneda, origen_pago_id)
    VALUES (v_pago.venta_id, v_disponible, v_pago.moneda, v_pago.id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Función: liberar separaciones vencidas (job 24h)
-- Se ejecuta desde un cron job (o manualmente desde admin)
-- ============================================================
CREATE OR REPLACE FUNCTION v2.liberar_separaciones_vencidas()
RETURNS int AS $$
DECLARE
  v_count int := 0;
  v_venta v2.ventas%ROWTYPE;
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

    INSERT INTO v2.notificaciones (usuario_id, tipo, titulo, mensaje, venta_id)
    VALUES (v_venta.promotor_id, 'separacion_vencida',
            'Separación liberada', 'La separación de la unidad ' || v_venta.propiedad_id || ' fue liberada por vencimiento.',
            v_venta.id)
    ON CONFLICT DO NOTHING;
  END LOOP;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Función: cancelar ventas con inicial incompleta (job 3m)
-- ============================================================
CREATE OR REPLACE FUNCTION v2.cancelar_iniciales_vencidas()
RETURNS int AS $$
DECLARE
  v_count int := 0;
  v_venta v2.ventas%ROWTYPE;
  v_total_inicial numeric(12,2);
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
      -- La inicial sí se completó, solo no se marcó. Corregir.
      UPDATE v2.ventas SET fecha_inicial_completa = COALESCE(fecha_inicial_completa, now()) WHERE id = v_venta.id;
    ELSE
      UPDATE v2.ventas
        SET estado = 'cancelada',
            fecha_cancelacion = now(),
            motivo_cancelacion = 'Inicial no completada en 3 meses'
        WHERE id = v_venta.id;
      v_count := v_count + 1;

      INSERT INTO v2.notificaciones (usuario_id, tipo, titulo, mensaje, venta_id)
      VALUES (v_venta.promotor_id, 'inicial_vencida',
              'Venta cancelada', 'Inicial no completada en el plazo; unidad liberada.',
              v_venta.id)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION v2.aplicar_pago_cuota(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION v2.liberar_separaciones_vencidas() TO authenticated;
GRANT EXECUTE ON FUNCTION v2.cancelar_iniciales_vencidas() TO authenticated;

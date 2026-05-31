-- ============================================================
-- HABITAD 2.0 — Notificación de cuota próxima a vencer
-- Fecha: 2026-05-31
-- ============================================================
-- Cierra gap del spec docs/habitad-v2.md:
-- "Eventos que notifican: Cuota próxima a vencer (3 días antes)".
-- El parámetro notif_recordatorio_cuota_dias existía pero no había
-- código que lo leyera.
--
-- Crea fn_notificar_cuotas_proximas() invocada desde fn_cron_run().
-- Evita duplicados: skip si ya existe notificación 'cuota_proxima'
-- para esa cuota en las últimas 24h.
-- ============================================================

CREATE OR REPLACE FUNCTION v2.fn_notificar_cuotas_proximas()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_dias int;
  v_count int := 0;
  v_cuota v2.cuotas%ROWTYPE;
  v_promotor uuid;
  v_admin uuid;
BEGIN
  -- Días configurables desde v2.parametros (default 3)
  SELECT COALESCE((valor #>> '{}')::int, 3) INTO v_dias
    FROM v2.parametros WHERE clave = 'notif_recordatorio_cuota_dias';
  IF v_dias IS NULL THEN v_dias := 3; END IF;

  FOR v_cuota IN
    SELECT c.*
      FROM v2.cuotas c
      JOIN v2.ventas v ON v.id = c.venta_id
      WHERE c.estado = 'pendiente'::v2.estado_cuota
        AND c.fecha_vencimiento BETWEEN current_date AND (current_date + (v_dias || ' days')::interval)::date
        AND v.estado IN ('cuotas'::v2.estado_venta, 'inicial'::v2.estado_venta)
        AND NOT EXISTS (
          SELECT 1 FROM v2.notificaciones n
          WHERE n.venta_id = c.venta_id
            AND n.tipo = 'cuota_proxima'
            AND n.created_at > now() - interval '1 day'
            AND (n.mensaje LIKE '%cuota ' || c.numero || ' %' OR n.mensaje LIKE '%cuota ' || c.numero)
        )
  LOOP
    SELECT promotor_id INTO v_promotor FROM v2.ventas WHERE id = v_cuota.venta_id;
    IF v_promotor IS NOT NULL THEN
      INSERT INTO v2.notificaciones (usuario_id, tipo, titulo, mensaje, venta_id)
      VALUES (v_promotor, 'cuota_proxima', 'Cuota próxima a vencer',
              'La cuota ' || v_cuota.numero || ' vence el ' || to_char(v_cuota.fecha_vencimiento, 'DD/MM/YYYY') || '.',
              v_cuota.venta_id);
      v_count := v_count + 1;
    END IF;

    FOR v_admin IN
      SELECT p.id FROM public.profiles p
      JOIN public.roles r ON r.id = p.role_id
      WHERE r.code = 'administrador'
    LOOP
      INSERT INTO v2.notificaciones (usuario_id, tipo, titulo, mensaje, venta_id)
      VALUES (v_admin, 'cuota_proxima', 'Cuota próxima a vencer',
              'Cuota ' || v_cuota.numero || ' vence el ' || to_char(v_cuota.fecha_vencimiento, 'DD/MM/YYYY') || '.',
              v_cuota.venta_id);
    END LOOP;
  END LOOP;

  RETURN v_count;
END $$;

GRANT EXECUTE ON FUNCTION v2.fn_notificar_cuotas_proximas() TO authenticated;

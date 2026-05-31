-- ============================================================
-- HABITAD 2.0 — Cron sin SUPABASE_SERVICE_ROLE_KEY
-- Fecha: 2026-05-30
-- ============================================================
-- Bug crítico: el endpoint /api/v2/cron usaba SUPABASE_SERVICE_ROLE_KEY
-- pero esa env var nunca se configuró en Vercel (el token de
-- coprodelidev no tiene scope al team pies-projects-14d4cbfe que
-- posee el proyecto). El cron devolvía HTTP 500 "supabase env missing"
-- en TODAS sus ejecuciones desde abril 2026.
--
-- Fix: wrapper SECURITY DEFINER que el endpoint llama vía anon key.
-- ============================================================

-- 1) Función para marcar cuotas vencidas (lo que antes hacía .update())
CREATE OR REPLACE FUNCTION v2.fn_marcar_cuotas_vencidas()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count int;
BEGIN
  UPDATE v2.cuotas
    SET estado = 'vencida'::v2.estado_cuota
    WHERE estado = 'pendiente'::v2.estado_cuota
      AND fecha_vencimiento < current_date;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END $$;

GRANT EXECUTE ON FUNCTION v2.fn_marcar_cuotas_vencidas() TO authenticated;
GRANT EXECUTE ON FUNCTION v2.liberar_separaciones_vencidas() TO authenticated;
GRANT EXECUTE ON FUNCTION v2.cancelar_iniciales_vencidas() TO authenticated;

-- 2) Wrapper que el endpoint cron invoca con anon key
CREATE OR REPLACE FUNCTION v2.fn_cron_run()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_lib int; v_can int; v_ven int; v_not int;
BEGIN
  SELECT v2.liberar_separaciones_vencidas() INTO v_lib;
  SELECT v2.cancelar_iniciales_vencidas() INTO v_can;
  SELECT v2.fn_marcar_cuotas_vencidas() INTO v_ven;
  SELECT v2.fn_notificar_cuotas_proximas() INTO v_not;
  RETURN jsonb_build_object(
    'separaciones_liberadas', v_lib,
    'iniciales_canceladas', v_can,
    'cuotas_marcadas_vencidas', v_ven,
    'notificaciones_cuota_proxima', v_not
  );
END $$;

GRANT EXECUTE ON FUNCTION v2.fn_cron_run() TO authenticated;

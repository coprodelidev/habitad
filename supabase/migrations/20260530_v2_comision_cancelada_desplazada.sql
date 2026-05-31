-- ============================================================
-- HABITAD 2.0 — fn_calcular_comision con cancelada_desplazada
-- Fecha: 2026-05-30
-- ============================================================
-- Fix de auditoría 4ª ronda: la función no manejaba el valor
-- 'cancelada_desplazada' del enum estado_venta (agregado en
-- 20260529_v2_fase1_modelo.sql). Caía al ELSE 'separacion' (20%)
-- en vez de 'separacion_desplazado' (40%).
-- También agrega precedencia para 'entregada' → 'beneficiario'
-- y redondeo a 2 decimales + guard para precio <= 0.
-- ============================================================

CREATE OR REPLACE FUNCTION v2.fn_calcular_comision(p_venta_id uuid)
RETURNS numeric
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_base numeric;
  v_hito text;
  v_pct numeric;
  v_estado v2.estado_venta;
  v_concepto text;
BEGIN
  SELECT v.precio_acordado + COALESCE(v.valor_adicional_cv, 0),
         v.estado, v.concepto_cliente
    INTO v_base, v_estado, v_concepto
    FROM v2.ventas v WHERE v.id = p_venta_id;
  IF v_base IS NULL OR v_base <= 0 THEN RETURN 0; END IF;

  v_hito := CASE
    WHEN v_estado = 'entregada' THEN 'beneficiario'
    WHEN v_estado = 'cuotas' AND upper(coalesce(v_concepto, '')) LIKE 'TERRENO%' THEN 'terreno_contrato'
    WHEN v_estado = 'cuotas' THEN 'contrato'
    WHEN v_estado = 'cancelada_desplazada' THEN 'separacion_desplazado'
    WHEN v_estado = 'cancelada' AND upper(coalesce(v_concepto, '')) LIKE '%DESPLAZADO%' THEN 'separacion_desplazado'
    WHEN v_estado = 'cancelada' THEN 'cancelacion_regular'
    WHEN upper(coalesce(v_concepto, '')) LIKE '%DESPLAZADO%' THEN 'separacion_desplazado'
    ELSE 'separacion'
  END;

  SELECT porcentaje INTO v_pct FROM v2.comision_escala WHERE hito = v_hito;
  IF v_pct IS NULL THEN RETURN 0; END IF;
  RETURN ROUND(v_base * 0.02 * (v_pct / 100.0), 2);
END $$;

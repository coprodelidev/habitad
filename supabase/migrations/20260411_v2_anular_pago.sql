-- ============================================================
-- HABITAD 2.0 — anular_pago_cuota: revierte aplicación a cuotas
-- ============================================================
-- Problema: al marcar un pago como 'anulado' solo cambiábamos el estado
-- pero no revertíamos el efecto sobre cuotas.monto_pagado ni sobre
-- v2.saldos_favor. Eso dejaba la cuota falsamente marcada como
-- "parcial" o "pagada" y dejaba saldo a favor huérfano.
--
-- Esta función:
-- 1. Marca el pago como anulado
-- 2. Si era de tipo cuota: resta su monto de cuotas (aplicado en orden)
-- 3. Si generó saldo_favor asociado, lo borra
-- 4. Re-evalúa el estado de las cuotas afectadas
-- ============================================================

CREATE OR REPLACE FUNCTION v2.anular_pago(p_pago_id uuid)
RETURNS void AS $$
DECLARE
  v_pago v2.pagos%ROWTYPE;
  v_cuota v2.cuotas%ROWTYPE;
  v_saldo numeric(12,2);
  v_a_revertir numeric(12,2);
  v_revertir numeric(12,2);
BEGIN
  SELECT * INTO v_pago FROM v2.pagos WHERE id = p_pago_id;
  IF v_pago IS NULL THEN
    RAISE EXCEPTION 'Pago no encontrado';
  END IF;
  IF v_pago.estado = 'anulado' THEN
    RETURN;
  END IF;

  -- 1. Borrar saldos a favor generados por este pago
  DELETE FROM v2.saldos_favor WHERE origen_pago_id = p_pago_id AND consumido = false;

  -- Calcular cuánto de este pago quedó como saldo a favor (no aplicado a cuotas)
  SELECT COALESCE(SUM(monto), 0) INTO v_saldo
    FROM v2.saldos_favor WHERE origen_pago_id = p_pago_id;

  -- El monto efectivamente aplicado a cuotas = monto_pago - saldo_favor_generado
  v_a_revertir := v_pago.monto - v_saldo;

  -- 2. Revertir aplicación en cuotas (de última a primera — orden inverso a la aplicación)
  IF v_pago.tipo = 'cuota' AND v_a_revertir > 0 THEN
    FOR v_cuota IN
      SELECT * FROM v2.cuotas
      WHERE venta_id = v_pago.venta_id
        AND monto_pagado > 0
      ORDER BY numero DESC
    LOOP
      IF v_a_revertir <= 0 THEN EXIT; END IF;
      v_revertir := LEAST(v_a_revertir, v_cuota.monto_pagado);
      UPDATE v2.cuotas
        SET monto_pagado = monto_pagado - v_revertir,
            estado = CASE
              WHEN monto_pagado - v_revertir <= 0 THEN 'pendiente'::v2.estado_cuota
              WHEN monto_pagado - v_revertir < monto THEN 'parcial'::v2.estado_cuota
              ELSE estado
            END
      WHERE id = v_cuota.id;
      v_a_revertir := v_a_revertir - v_revertir;
    END LOOP;
  END IF;

  -- 3. Marcar pago como anulado
  UPDATE v2.pagos SET estado = 'anulado', updated_at = now() WHERE id = p_pago_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION v2.anular_pago(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION v2.anular_pago(uuid) TO authenticated, service_role;

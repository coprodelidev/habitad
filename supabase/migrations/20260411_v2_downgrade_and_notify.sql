-- ============================================================
-- HABITAD 2.0 — Downgrade protection + notificación a admins
-- ============================================================
-- Según la doc (regla 8): "ningún estado comercial puede retroceder
-- automáticamente" y "el promotor y el admin reciben notificación"
-- cuando una separación/inicial vence.
-- ============================================================

-- -----------------------------------------------------------
-- Downgrade protection en el trigger sync_propiedad_estado
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION v2.sync_propiedad_estado()
RETURNS trigger AS $$
DECLARE
  v_fisico v2.estado_fisico;
  v_comercial v2.estado_comercial;
  v_actual_comercial v2.estado_comercial;
  v_rank_new int;
  v_rank_cur int;
BEGIN
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

  SELECT estado_comercial INTO v_actual_comercial FROM v2.propiedades WHERE id = NEW.propiedad_id;

  -- Downgrade protection: calcular ranking del estado comercial
  v_rank_new := CASE v_comercial
    WHEN 'sin_venta' THEN 0
    WHEN 'separacion' THEN 1
    WHEN 'inicial' THEN 2
    WHEN 'cuotas' THEN 3
    WHEN 'entregada' THEN 4
    ELSE -1 END;
  v_rank_cur := CASE v_actual_comercial
    WHEN 'sin_venta' THEN 0
    WHEN 'separacion' THEN 1
    WHEN 'inicial' THEN 2
    WHEN 'cuotas' THEN 3
    WHEN 'entregada' THEN 4
    ELSE -1 END;

  -- Excepciones: cancelación SIEMPRE libera, incluso desde cuotas
  -- (eso es el flujo legítimo). Para cualquier otro downgrade:
  IF NEW.estado <> 'cancelada' AND v_rank_new < v_rank_cur THEN
    -- Bloqueamos el downgrade automático. El registro en auditoría ya existe.
    RAISE NOTICE 'Downgrade bloqueado: propiedad % no baja de % a %', NEW.propiedad_id, v_actual_comercial, v_comercial;
    RETURN NEW;
  END IF;

  UPDATE v2.propiedades
  SET estado_fisico = v_fisico,
      estado_comercial = v_comercial
  WHERE id = NEW.propiedad_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------
-- Notificar también al admin cuando expira separación/inicial
-- -----------------------------------------------------------
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

    -- Promotor
    IF v_venta.promotor_id IS NOT NULL THEN
      INSERT INTO v2.notificaciones (usuario_id, tipo, titulo, mensaje, venta_id)
      VALUES (v_venta.promotor_id, 'separacion_vencida', 'Separación liberada',
              'La separación de la unidad fue liberada por vencimiento 24h.', v_venta.id);
    END IF;

    -- Todos los admins
    FOR v_admin IN
      SELECT p.id FROM public.profiles p
      JOIN public.roles r ON r.id = p.role_id
      WHERE r.code IN ('administrador','gerente')
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
        WHERE r.code IN ('administrador','gerente')
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

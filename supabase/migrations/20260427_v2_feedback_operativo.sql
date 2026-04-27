-- ============================================================
-- HABITAD 2.0 — feedback operativo separacion / inicial / contrato
-- Fecha: 2026-04-27
-- ============================================================

ALTER TABLE v2.clientes
  ADD COLUMN IF NOT EXISTS tipo_zona text;

ALTER TABLE v2.ventas
  ADD COLUMN IF NOT EXISTS tipo_separacion text,
  ADD COLUMN IF NOT EXISTS descuento_tipo text,
  ADD COLUMN IF NOT EXISTS descuento_monto numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS descuento_descripcion text,
  ADD COLUMN IF NOT EXISTS corte_cancelacion_fecha timestamptz,
  ADD COLUMN IF NOT EXISTS corte_cancelacion_forma text,
  ADD COLUMN IF NOT EXISTS corte_cancelacion_monto numeric(12,2),
  ADD COLUMN IF NOT EXISTS corte_cancelacion_notas text;

-- Bancos confirmados por cliente.
INSERT INTO v2.parametros (clave, valor, descripcion)
VALUES ('bancos_permitidos', '["BANBIF","BCP"]', 'Bancos válidos para registro de vouchers')
ON CONFLICT (clave) DO UPDATE
SET valor = EXCLUDED.valor,
    descripcion = EXCLUDED.descripcion,
    updated_at = now();

-- Vista helper actualizada: direccion separada para SAP y concatenada para contrato.
DROP VIEW IF EXISTS v2.vw_clientes_full;
CREATE VIEW v2.vw_clientes_full AS
SELECT
  c.*,
  u.distrito,
  u.provincia,
  u.departamento,
  trim(trailing ' - ' from
    concat_ws(' - ',
      NULLIF(trim(concat_ws(' ',
        NULLIF(c.tipo_via, ''),
        NULLIF(c.zona_nombre, '')
      )), ''),
      CASE WHEN c.direccion_mz IS NOT NULL THEN 'Mz ' || c.direccion_mz ELSE NULL END,
      CASE WHEN c.direccion_lt IS NOT NULL THEN 'Lt ' || c.direccion_lt ELSE NULL END,
      CASE WHEN c.numero_puerta IS NOT NULL THEN 'Nº ' || c.numero_puerta ELSE NULL END,
      CASE WHEN c.interior IS NOT NULL THEN 'Int ' || c.interior ELSE NULL END
    )
  ) AS direccion_sap_street,
  trim(trailing ', ' from
    concat_ws(', ',
      NULLIF(trim(concat_ws(' ',
        NULLIF(c.tipo_via, ''),
        NULLIF(c.zona_nombre, '')
      )), ''),
      CASE WHEN c.direccion_mz IS NOT NULL THEN 'Mz ' || c.direccion_mz ELSE NULL END,
      CASE WHEN c.direccion_lt IS NOT NULL THEN 'Lt ' || c.direccion_lt ELSE NULL END,
      CASE WHEN c.numero_puerta IS NOT NULL THEN 'Nº ' || c.numero_puerta ELSE NULL END,
      CASE WHEN c.interior IS NOT NULL THEN 'Int ' || c.interior ELSE NULL END,
      NULLIF(c.referencia, ''),
      CASE WHEN u.codigo IS NOT NULL THEN u.distrito || ' - ' || u.provincia || ' - ' || u.departamento ELSE NULL END
    )
  ) AS direccion_contrato
FROM v2.clientes c
LEFT JOIN v2.ubigeos u ON u.codigo = c.ubigeo_cod;

GRANT SELECT ON v2.vw_clientes_full TO authenticated;

CREATE OR REPLACE VIEW v2.vw_saldos_venta AS
SELECT
  v.id AS venta_id,
  v.propiedad_id,
  v.cliente_id,
  v.estado AS estado_venta,
  v.precio_acordado,
  v.moneda,
  COALESCE(SUM(CASE WHEN p.tipo = 'separacion' AND p.estado <> 'anulado' AND p.moneda = v.moneda THEN p.monto ELSE 0 END), 0) AS total_separacion,
  COALESCE(SUM(CASE WHEN p.tipo = 'inicial' AND p.estado <> 'anulado' AND p.moneda = v.moneda THEN p.monto ELSE 0 END), 0) AS total_inicial,
  COALESCE(SUM(CASE WHEN p.tipo = 'cuota' AND p.estado <> 'anulado' AND p.moneda = v.moneda THEN p.monto ELSE 0 END), 0) AS total_cuotas,
  COALESCE(SUM(CASE WHEN p.estado <> 'anulado' AND p.moneda = v.moneda THEN p.monto ELSE 0 END), 0) AS total_pagado,
  GREATEST(
    0,
    v.precio_acordado
      - COALESCE(v.descuento_monto, 0)
      - COALESCE(SUM(CASE WHEN p.estado <> 'anulado' AND p.moneda = v.moneda THEN p.monto ELSE 0 END), 0)
  ) AS saldo_pendiente,
  COALESCE((SELECT SUM(sf.monto) FROM v2.saldos_favor sf WHERE sf.venta_id = v.id AND sf.consumido = false), 0) AS saldo_favor
FROM v2.ventas v
LEFT JOIN v2.pagos p ON p.venta_id = v.id
GROUP BY v.id;

GRANT SELECT ON v2.vw_saldos_venta TO authenticated;

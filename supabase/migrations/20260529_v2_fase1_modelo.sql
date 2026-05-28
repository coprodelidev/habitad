-- ============================================================
-- HABITAD 2.0 — Fase 1: cierre de gaps de modelo
-- Fecha: 2026-05-29
-- ============================================================
-- Agrega columnas/tablas que el CSV CMR 26-05-2026 exige y que
-- el schema actual no tenía:
--   1. concepto_cliente (catálogo soft, valores auto-creados)
--   2. valor_adicional_cv + moneda_adicional + pagos.aplica_a
--   3. Bloque FMV completo (precio, bono real, abono cliente,
--      donación, gastos, saldo, origen, fecha desemb, estado expediente)
--   4. v2.sap_catalogos + v2.sap_item_mapping
--   5. v2.comision_escala + v2.fn_calcular_comision
--   6. profiles.sufijos_cartera (text[]) + promotor_base_id
--   7. cancelacion granular: cancelacion_regular vs cancelacion_desplazada
-- ============================================================

-- ------------------------------------------------------------
-- 1) concepto_cliente
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS v2.conceptos_cliente (
  codigo text PRIMARY KEY,
  descripcion text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE v2.conceptos_cliente ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS conceptos_cliente_read_all ON v2.conceptos_cliente;
DROP POLICY IF EXISTS conceptos_cliente_admin_write ON v2.conceptos_cliente;
CREATE POLICY conceptos_cliente_read_all ON v2.conceptos_cliente FOR SELECT TO authenticated USING (true);
CREATE POLICY conceptos_cliente_admin_write ON v2.conceptos_cliente FOR ALL TO authenticated USING (v2.is_admin()) WITH CHECK (v2.is_admin());

INSERT INTO v2.conceptos_cliente (codigo, descripcion) VALUES
  ('BENEFICIARIO', 'Cliente con bono FMV aprobado'),
  ('MEDIO', 'Caso intermedio'),
  ('DESPLAZADO', 'Cartera heredada de otro promotor'),
  ('NUEVO', 'Venta nueva sin año'),
  ('NUEVO-2021', 'Venta nueva año 2021'),
  ('NUEVO-2022', 'Venta nueva año 2022'),
  ('NUEVO-2023', 'Venta nueva año 2023'),
  ('NUEVO-2024', 'Venta nueva año 2024'),
  ('NUEVO-2024A', 'Venta nueva año 2024 lote A'),
  ('NUEVO-2024B', 'Venta nueva año 2024 lote B'),
  ('NUEVO-2025', 'Venta nueva año 2025'),
  ('NUEVO-2026', 'Venta nueva año 2026'),
  ('ANTIGUO', 'Cliente antiguo de cartera histórica'),
  ('TERRENO 2025 - LIBRE', 'Terreno disponible 2025'),
  ('TERRENO - 2022', 'Terreno año 2022'),
  ('TERRENO - 2023A', 'Terreno año 2023 lote A'),
  ('TERRENO - 2024NS', 'Terreno año 2024 sin separación'),
  ('TERRENO - 2025NS', 'Terreno año 2025 sin separación'),
  ('TERRENO 2025-2', 'Terreno año 2025-2'),
  ('TERRENO - 2025', 'Terreno año 2025'),
  ('TERRENO SB-$', 'Terreno SB en dólares'),
  ('TERRENO SF', 'Terreno SF'),
  ('CASA LIBRE', 'Casa disponible para venta'),
  ('BLOQUEADO', 'Unidad bloqueada por admin'),
  ('COPRODELI', 'Cartera retenida por COPRODELI')
ON CONFLICT (codigo) DO NOTHING;

ALTER TABLE v2.ventas
  ADD COLUMN IF NOT EXISTS concepto_cliente text REFERENCES v2.conceptos_cliente(codigo);

-- ------------------------------------------------------------
-- 2) Valor adicional CV (cobro Coprovidig paralelo)
-- ------------------------------------------------------------
ALTER TABLE v2.ventas
  ADD COLUMN IF NOT EXISTS valor_adicional_cv numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS abonos_cv numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS moneda_adicional v2.moneda DEFAULT 'PEN';

ALTER TABLE v2.pagos
  ADD COLUMN IF NOT EXISTS aplica_a text CHECK (aplica_a IN ('precio','adicional')) DEFAULT 'precio';

-- ------------------------------------------------------------
-- 3) Bloque FMV completo
-- ------------------------------------------------------------
ALTER TABLE v2.ventas
  ADD COLUMN IF NOT EXISTS fmv_precio numeric(12,2),
  ADD COLUMN IF NOT EXISTS fmv_bono_real numeric(12,2),
  ADD COLUMN IF NOT EXISTS fmv_abono_cliente numeric(12,2),
  ADD COLUMN IF NOT EXISTS fmv_donacion_coprodeli numeric(12,2),
  ADD COLUMN IF NOT EXISTS fmv_gastos_administrativos numeric(12,2),
  ADD COLUMN IF NOT EXISTS fmv_saldo numeric(12,2),
  ADD COLUMN IF NOT EXISTS fmv_origen_bono text CHECK (fmv_origen_bono IN ('cf','recursos_propios')),
  ADD COLUMN IF NOT EXISTS fmv_fecha_desembolso date,
  ADD COLUMN IF NOT EXISTS fmv_estado_expediente text
    CHECK (fmv_estado_expediente IN ('pendiente','pedir_cf','cf_desembolsado','beneficiario','caducado','rechazado'));

CREATE OR REPLACE VIEW v2.vw_fmv_resumen AS
SELECT
  v.id AS venta_id,
  v.concepto_cliente,
  v.fmv_precio,
  v.fmv_bono_real,
  v.fmv_abono_cliente,
  v.fmv_donacion_coprodeli,
  v.fmv_gastos_administrativos,
  v.fmv_saldo,
  v.fmv_origen_bono,
  v.fmv_fecha_desembolso,
  v.fmv_estado_expediente,
  COALESCE(v.fmv_bono_real,0) + COALESCE(v.fmv_abono_cliente,0)
    + COALESCE(v.fmv_donacion_coprodeli,0) + COALESCE(v.fmv_saldo,0) AS suma_componentes,
  COALESCE(v.fmv_precio,0) - (
    COALESCE(v.fmv_bono_real,0) + COALESCE(v.fmv_abono_cliente,0)
    + COALESCE(v.fmv_donacion_coprodeli,0) + COALESCE(v.fmv_saldo,0)
  ) AS diferencia_cuadratura
FROM v2.ventas v
WHERE v.modalidad_pago = 'bono_mivivienda' OR v.fmv_precio IS NOT NULL;

GRANT SELECT ON v2.vw_fmv_resumen TO authenticated;

-- ------------------------------------------------------------
-- 4) Catálogos SAP
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS v2.sap_catalogos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL,
  clave text NOT NULL,
  valor text NOT NULL,
  etapa_codigo text,
  descripcion text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tipo, clave, etapa_codigo)
);

ALTER TABLE v2.sap_catalogos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sap_catalogos_read ON v2.sap_catalogos;
DROP POLICY IF EXISTS sap_catalogos_admin_write ON v2.sap_catalogos;
CREATE POLICY sap_catalogos_read ON v2.sap_catalogos FOR SELECT TO authenticated USING (true);
CREATE POLICY sap_catalogos_admin_write ON v2.sap_catalogos FOR ALL TO authenticated USING (v2.is_admin()) WITH CHECK (v2.is_admin());

INSERT INTO v2.sap_catalogos (tipo, clave, valor, descripcion) VALUES
  ('almacen', 'SFERN', 'SFERN', 'URB SAN FERNANDO'),
  ('programa', '6', 'HABITAT', 'Programa Habitat'),
  ('centro_costo', '604', 'URB SAN FERNANDO', 'Centro 604'),
  ('grupo_bif', '0013', 'URB SAN FERN CASAS S', 'Grupo BIF Casas Soles'),
  ('grupo_bif', '0014', 'URB SAN FERN CASAS D', 'Grupo BIF Casas Dólares'),
  ('grupo_bif', '0031', 'SAN FERNANDO TERR', 'Grupo BIF Terrenos')
ON CONFLICT (tipo, clave, etapa_codigo) DO NOTHING;

-- Partidas por etapa (1-21).
INSERT INTO v2.sap_catalogos (tipo, clave, valor, etapa_codigo, descripcion)
SELECT 'partida', e.codigo, e.codigo || ' ETAPA', e.codigo, 'Partida etapa ' || e.codigo
FROM v2.etapas e WHERE e.codigo ~ '^[0-9]+$' AND e.codigo::int BETWEEN 1 AND 21
ON CONFLICT (tipo, clave, etapa_codigo) DO NOTHING;

CREATE TABLE IF NOT EXISTS v2.sap_item_mapping (
  propiedad_id uuid PRIMARY KEY REFERENCES v2.propiedades(id) ON DELETE CASCADE,
  item_code text NOT NULL,
  warehouse_code text NOT NULL DEFAULT 'SFERN',
  ubicacion_sap text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE v2.sap_item_mapping ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sap_item_mapping_read ON v2.sap_item_mapping;
DROP POLICY IF EXISTS sap_item_mapping_admin_write ON v2.sap_item_mapping;
CREATE POLICY sap_item_mapping_read ON v2.sap_item_mapping FOR SELECT TO authenticated USING (true);
CREATE POLICY sap_item_mapping_admin_write ON v2.sap_item_mapping FOR ALL TO authenticated USING (v2.is_admin()) WITH CHECK (v2.is_admin());

-- Backfill: derivar item_code = 'PT' + lpad(etapa_codigo, 4, '0') + cuh_num
-- y ubicacion_sap = propiedades.ubicacion (que ya trae SF-Mz_Lt).
INSERT INTO v2.sap_item_mapping (propiedad_id, item_code, warehouse_code, ubicacion_sap)
SELECT p.id,
       'PT' || lpad(coalesce(e.codigo,'00'), 4, '0') || regexp_replace(coalesce(p.cuh,''), '^C', ''),
       'SFERN',
       p.ubicacion
FROM v2.propiedades p
LEFT JOIN v2.etapas e ON e.id = p.etapa_id
ON CONFLICT (propiedad_id) DO NOTHING;

-- ------------------------------------------------------------
-- 5) Comisión por avance (hitos discretos del CSV)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS v2.comision_escala (
  hito text PRIMARY KEY,
  porcentaje numeric(5,2) NOT NULL,
  descripcion text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE v2.comision_escala ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS comision_escala_read ON v2.comision_escala;
DROP POLICY IF EXISTS comision_escala_admin_write ON v2.comision_escala;
CREATE POLICY comision_escala_read ON v2.comision_escala FOR SELECT TO authenticated USING (true);
CREATE POLICY comision_escala_admin_write ON v2.comision_escala FOR ALL TO authenticated USING (v2.is_admin()) WITH CHECK (v2.is_admin());

INSERT INTO v2.comision_escala (hito, porcentaje, descripcion) VALUES
  ('separacion', 20, 'Hoja de separación normal'),
  ('separacion_desplazado', 40, 'Separación cartera desplazada'),
  ('contrato', 70, 'Contrato firmado'),
  ('cancelacion_regular', 80, 'Cancelación regular'),
  ('beneficiario', 100, 'Bono FMV beneficiario'),
  ('terreno_contrato', 100, 'Terreno con contrato cancelado')
ON CONFLICT (hito) DO UPDATE SET porcentaje=EXCLUDED.porcentaje, descripcion=EXCLUDED.descripcion, updated_at=now();

CREATE OR REPLACE FUNCTION v2.fn_calcular_comision(p_venta_id uuid)
RETURNS numeric LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_base numeric;
  v_hito text;
  v_pct numeric;
  v_estado v2.estado_venta;
  v_concepto text;
BEGIN
  SELECT v.precio_acordado + COALESCE(v.valor_adicional_cv,0),
         v.estado, v.concepto_cliente
    INTO v_base, v_estado, v_concepto
    FROM v2.ventas v WHERE v.id = p_venta_id;
  IF v_base IS NULL THEN RETURN 0; END IF;

  v_hito := CASE
    WHEN v_estado = 'cuotas' AND upper(coalesce(v_concepto,'')) LIKE 'TERRENO%' THEN 'terreno_contrato'
    WHEN v_estado = 'cuotas' THEN 'contrato'
    WHEN v_estado = 'cancelada' AND upper(coalesce(v_concepto,'')) LIKE '%DESPLAZADO%' THEN 'separacion_desplazado'
    WHEN v_estado = 'cancelada' THEN 'cancelacion_regular'
    WHEN v_estado = 'entregada' THEN 'beneficiario'
    WHEN upper(coalesce(v_concepto,'')) = 'DESPLAZADO' THEN 'separacion_desplazado'
    ELSE 'separacion'
  END;

  SELECT porcentaje INTO v_pct FROM v2.comision_escala WHERE hito = v_hito;
  IF v_pct IS NULL THEN RETURN 0; END IF;
  RETURN v_base * 0.02 * (v_pct / 100.0);
END $$;

GRANT EXECUTE ON FUNCTION v2.fn_calcular_comision(uuid) TO authenticated;

CREATE OR REPLACE VIEW v2.vw_comisiones_promotor AS
SELECT
  v.id AS venta_id,
  v.promotor_id,
  pr.first_name || ' ' || pr.last_name AS promotor_nombre,
  v.propiedad_id,
  p.cuh,
  v.cliente_id,
  v.estado,
  v.concepto_cliente,
  v.precio_acordado,
  v.valor_adicional_cv,
  v2.fn_calcular_comision(v.id) AS comision_calculada
FROM v2.ventas v
LEFT JOIN v2.propiedades p ON p.id = v.propiedad_id
LEFT JOIN public.profiles pr ON pr.id = v.promotor_id;

GRANT SELECT ON v2.vw_comisiones_promotor TO authenticated;

-- ------------------------------------------------------------
-- 6) Promotor con variantes (sufijos múltiples) + seed 13 reales
-- ------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sufijos_cartera text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS promotor_base_id uuid REFERENCES public.profiles(id);

-- Marcamos los SAP codes de los 13 promotores reales en los profiles existentes
-- por matching de nombre (case insensitive). Si el profile no existe todavía,
-- queda como tarea de admin crearlo desde /v2/admin/usuarios.
WITH catalogo(nombre, code) AS (VALUES
  ('GISELA ROJAS MARCATINCO', 92),
  ('HUGO RODRIGUEZ QUESQUEN', 94),
  ('CRISS PANITZ VASQUEZ', 95),
  ('RONY YATACO', 97),
  ('JUDITH SANTIAGO', 98),
  ('JOSE BRICEÑO', 99),
  ('ZUNILDA PUMA', 100),
  ('ERICK DAVILA', 101),
  ('NATHALY ZAMBRANO', 102),
  ('KAREN CUETO', 103),
  ('JORGE HUERTAS', 104),
  ('ARIANA GONZALES', 113)
)
UPDATE public.profiles p SET
  sap_sales_person_code = c.code,
  sap_employee_name = c.nombre
FROM catalogo c
WHERE p.sap_sales_person_code IS NULL
  AND upper(trim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,''))) LIKE '%' || split_part(c.nombre,' ',1) || '%';

-- ------------------------------------------------------------
-- 7) Estado de cancelación granular
-- ------------------------------------------------------------
-- estado_venta es un enum (separacion, inicial, cuotas, cancelada, entregada).
-- Agregamos cancelada_desplazada como nuevo valor del enum.
DO $$ BEGIN
  ALTER TYPE v2.estado_venta ADD VALUE IF NOT EXISTS 'cancelada_desplazada';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------
-- Indices útiles
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_ventas_concepto_cliente ON v2.ventas(concepto_cliente);
CREATE INDEX IF NOT EXISTS idx_ventas_promotor_id ON v2.ventas(promotor_id);
CREATE INDEX IF NOT EXISTS idx_ventas_propiedad_cliente ON v2.ventas(propiedad_id, cliente_id);

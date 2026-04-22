-- ============================================================
-- HABITAD 2.0 — Fase A: clientes estructurados + ubigeos INEI
-- ============================================================

-- 1) Catálogo de ubigeos (Perú completo, ~1,853 distritos)
CREATE TABLE IF NOT EXISTS v2.ubigeos (
  codigo text PRIMARY KEY,
  distrito text NOT NULL,
  provincia text NOT NULL,
  departamento text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ubigeos_distrito ON v2.ubigeos (lower(distrito));
CREATE INDEX IF NOT EXISTS idx_ubigeos_provincia ON v2.ubigeos (lower(provincia));
CREATE INDEX IF NOT EXISTS idx_ubigeos_departamento ON v2.ubigeos (lower(departamento));

GRANT SELECT ON v2.ubigeos TO authenticated, anon;
ALTER TABLE v2.ubigeos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ubigeos_select ON v2.ubigeos;
CREATE POLICY ubigeos_select ON v2.ubigeos FOR SELECT TO authenticated, anon USING (true);

-- 2) Extender v2.clientes con campos estructurados
ALTER TABLE v2.clientes
  ADD COLUMN IF NOT EXISTS segundo_nombre text,
  ADD COLUMN IF NOT EXISTS apellido_paterno text,
  ADD COLUMN IF NOT EXISTS apellido_materno text,
  ADD COLUMN IF NOT EXISTS tipo_via text,
  ADD COLUMN IF NOT EXISTS zona_nombre text,
  ADD COLUMN IF NOT EXISTS direccion_mz text,
  ADD COLUMN IF NOT EXISTS direccion_lt text,
  ADD COLUMN IF NOT EXISTS numero_puerta text,
  ADD COLUMN IF NOT EXISTS interior text,
  ADD COLUMN IF NOT EXISTS referencia text,
  ADD COLUMN IF NOT EXISTS ubigeo_cod text REFERENCES v2.ubigeos(codigo),
  ADD COLUMN IF NOT EXISTS urbanizacion text;

CREATE INDEX IF NOT EXISTS idx_clientes_ubigeo ON v2.clientes(ubigeo_cod) WHERE ubigeo_cod IS NOT NULL;

-- 3) Vista helper: cliente con ubigeo expandido
CREATE OR REPLACE VIEW v2.vw_clientes_full AS
SELECT
  c.*,
  u.distrito,
  u.provincia,
  u.departamento,
  -- Dirección SAP Street concatenada
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
  ) AS direccion_sap_street
FROM v2.clientes c
LEFT JOIN v2.ubigeos u ON u.codigo = c.ubigeo_cod;

GRANT SELECT ON v2.vw_clientes_full TO authenticated;

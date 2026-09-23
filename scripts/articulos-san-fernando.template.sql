BEGIN;

-- Catálogo oficial del Excel. No contiene precios, clientes ni disponibilidad.
CREATE TABLE IF NOT EXISTS v2.catalogo_articulos_sf (
  codigo text PRIMARY KEY CHECK (codigo ~ '^SF-[0-9]+_[0-9]+$'),
  etapa integer NOT NULL CHECK (etapa BETWEEN 1 AND 21),
  modelo text NOT NULL,
  tipo_original text NOT NULL CHECK (tipo_original IN ('CASA','TERRENO','EMAPICA-ACACIA')),
  fuente text NOT NULL,
  fuente_sha256 text NOT NULL
);
ALTER TABLE v2.catalogo_articulos_sf ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS catalogo_articulos_sf_lectura ON v2.catalogo_articulos_sf;
CREATE POLICY catalogo_articulos_sf_lectura ON v2.catalogo_articulos_sf FOR SELECT TO authenticated
  USING (v2.is_staff() OR v2.is_auditor());
REVOKE ALL ON v2.catalogo_articulos_sf FROM anon, authenticated;
GRANT SELECT ON v2.catalogo_articulos_sf TO authenticated;

-- Valores generados y validados contra la hoja 3804 ARTICULOS, B3:E3806.
__CATALOGO__

CREATE OR REPLACE FUNCTION v2.codigo_ubicacion_sf(p_ubicacion text, p_cuh text, p_manzana text, p_lote text)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path = pg_catalog AS $$
DECLARE value text; parts text[];
BEGIN
  FOREACH value IN ARRAY ARRAY[p_ubicacion,p_cuh] LOOP
    parts := regexp_match(upper(btrim(value)), '^SF-([0-9]+)_([0-9]+)$');
    IF parts IS NOT NULL THEN RETURN 'SF-' || parts[1]::numeric::text || '_' || parts[2]::numeric::text; END IF;
  END LOOP;
  IF upper(btrim(p_ubicacion)) ~ '^[A-Z]+[-_][0-9]' THEN RETURN NULL; END IF;
  IF btrim(p_manzana) ~ '^[0-9]+$' AND btrim(p_lote) ~ '^[0-9]+$' THEN
    RETURN 'SF-' || btrim(p_manzana)::numeric::text || '_' || btrim(p_lote)::numeric::text;
  END IF;
  RETURN NULL;
END;
$$;

INSERT INTO v2.etapas(codigo,nombre,orden,activa)
SELECT DISTINCT etapa::text,'Etapa ' || etapa,etapa,true FROM v2.catalogo_articulos_sf
ON CONFLICT (codigo) DO NOTHING;

-- Solo correspondencias únicas. Las fichas duplicadas quedan intactas para revisión.
CREATE TEMP TABLE sf_correspondencias ON COMMIT DROP AS
SELECT p.id,c.codigo,c.etapa,c.modelo,c.tipo_original,
  count(*) OVER (PARTITION BY c.codigo) AS coincidencias
FROM v2.propiedades p JOIN v2.catalogo_articulos_sf c
  ON c.codigo = v2.codigo_ubicacion_sf(p.ubicacion,p.cuh,p.manzana,p.lote);

UPDATE v2.propiedades p SET
  etapa_id = e.id,
  modelo = CASE WHEN c.modelo = 'EMAPICA-ACACIA' THEN 'ACACIA' ELSE c.modelo END,
  tipo = CASE c.tipo_original WHEN 'TERRENO' THEN 'terreno'::v2.tipo_propiedad
    ELSE 'casa'::v2.tipo_propiedad END,
  manzana = split_part(substring(c.codigo FROM 4),'_',1),
  lote = split_part(c.codigo,'_',2),
  adicionales = coalesce(p.adicionales,'{}'::jsonb) || jsonb_build_object(
    'tipo_articulo_sf',c.tipo_original,'catalogo_sf_fuente','DATOS DE ARTICULOS SAN FERNANDO.xlsx')
FROM sf_correspondencias c JOIN v2.etapas e ON e.codigo = c.etapa::text
WHERE p.id = c.id AND c.coincidencias = 1;

-- No se crean propiedades sin precio ni se modifican ventas, pagos o estados.
DO $$
DECLARE actualizadas integer; duplicadas integer; sin_ficha integer;
BEGIN
  SELECT count(*) INTO actualizadas FROM sf_correspondencias WHERE coincidencias=1;
  SELECT count(DISTINCT codigo) INTO duplicadas FROM sf_correspondencias WHERE coincidencias>1;
  SELECT count(*) INTO sin_ficha FROM v2.catalogo_articulos_sf c
    WHERE NOT EXISTS (SELECT 1 FROM sf_correspondencias m WHERE m.codigo=c.codigo);
  RAISE NOTICE 'San Fernando: % fichas actualizadas; % ubicaciones con fichas duplicadas; % ubicaciones sin ficha.',actualizadas,duplicadas,sin_ficha;
END $$;
NOTIFY pgrst, 'reload schema';
COMMIT;

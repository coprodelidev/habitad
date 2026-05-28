-- ============================================================
-- HABITAD 2.0 — Fix fn_split_promotor para reconocer sufijos sin
-- espacios alrededor ("HUGO-DESP", "JUDITH-N", "COPRODELI-NR")
-- y formato " - DESP" / "-DESP" / "-DESP (JS)" indistintamente.
-- Fecha: 2026-05-28
-- ============================================================

CREATE OR REPLACE FUNCTION v2.fn_split_promotor(s text, OUT base text, OUT sufijos text[])
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  norm text;
  m text[];
BEGIN
  base := NULL;
  sufijos := ARRAY[]::text[];
  IF s IS NULL OR btrim(s) = '' THEN RETURN; END IF;

  norm := upper(regexp_replace(btrim(s), '\s+', ' ', 'g'));

  -- Marcadores reservados que NO son promotor real.
  IF norm IN ('CASA LIBRE', 'BLOQUEADO', 'TERRENO LIBRE') OR norm LIKE 'CASA LIBRE%' OR norm LIKE 'TERRENO%LIBRE%' THEN
    RETURN;
  END IF;

  -- 1) Sufijos entre paréntesis ("(JS)", "(PAMO)", "(ERICK PAMO)")
  FOR m IN SELECT regexp_matches(norm, '\(([^)]+)\)', 'g') LOOP
    sufijos := array_append(sufijos, btrim(m[1]));
  END LOOP;
  norm := btrim(regexp_replace(norm, '\([^)]*\)', '', 'g'));

  -- 2) Sufijos tipo "-DESP", "- DESP", " DESP", "-NZ", "-N", "-NR" al final o repetidos.
  --    Iteramos extrayendo el último token mientras sea uno de los reservados.
  LOOP
    IF norm ~ '\-\s*(DESP|NZ|NR|N)\s*$' THEN
      sufijos := array_append(sufijos, substring(norm from '\-\s*(DESP|NZ|NR|N)\s*$'));
      norm := btrim(regexp_replace(norm, '\-\s*(DESP|NZ|NR|N)\s*$', ''));
    ELSIF norm ~ '\s(DESP|NZ|NR)\s*$' THEN
      sufijos := array_append(sufijos, substring(norm from '\s(DESP|NZ|NR)\s*$'));
      norm := btrim(regexp_replace(norm, '\s(DESP|NZ|NR)\s*$', ''));
    ELSE
      EXIT;
    END IF;
  END LOOP;

  base := btrim(norm);
  IF base = '' THEN base := NULL; END IF;
END $$;

-- Re-promove staging para que se llenen los promotor_id ahora resolubles.
SELECT * FROM v2.fn_promote_staging(
  (SELECT DISTINCT import_batch_id FROM v2.import_cuh_staging LIMIT 1)
);

-- ============================================================
-- HABITAD 2.0 — Columna tipo_inmueble en staging
-- Fecha: 2026-05-30
-- ============================================================
-- Auditoría profunda detectó que la col 1 del XLSX (VIVIENDA / TERRENO
-- literal) no estaba mapeada al staging. Es la fuente más confiable
-- del tipo. Se agrega para que futuros imports tengan dato más limpio.
-- El backfill ya existente (tipo derivado de modelo+concepto) sigue
-- siendo válido para los registros ya promovidos.
-- ============================================================

ALTER TABLE v2.import_cuh_staging
  ADD COLUMN IF NOT EXISTS tipo_inmueble text;

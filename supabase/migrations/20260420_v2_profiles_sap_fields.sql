-- ============================================================
-- HABITAD 2.0 - Campos SAP en perfiles de promotores
-- Fecha: 2026-04-20
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sap_sales_person_code integer,
  ADD COLUMN IF NOT EXISTS sap_employee_name text;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_sap_sales_person_code_positive;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_sap_sales_person_code_positive
  CHECK (sap_sales_person_code IS NULL OR sap_sales_person_code > 0);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_sap_sales_person_code_unique
  ON public.profiles (sap_sales_person_code)
  WHERE sap_sales_person_code IS NOT NULL;

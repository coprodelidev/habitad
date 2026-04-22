-- ============================================================
-- HABITAD 2.0 — Fase C+D: modalidad precontrato + MiVivienda
-- ============================================================

-- Enum de modalidad de pago
DO $$ BEGIN
  CREATE TYPE v2.modalidad_pago AS ENUM (
    'contado',
    'cuotas_sin_interes',
    'cuotas_con_interes',
    'bono_mivivienda'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE v2.cuenta_recaudadora AS ENUM (
    'sin_data',
    'con_data_terreno',
    'con_data_casas'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE v2.ventas
  ADD COLUMN IF NOT EXISTS modalidad_pago v2.modalidad_pago DEFAULT 'cuotas_sin_interes',
  ADD COLUMN IF NOT EXISTS tasa_interes_anual numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS penalidad_retiro numeric(10,2),
  ADD COLUMN IF NOT EXISTS cuenta_recaudadora v2.cuenta_recaudadora,
  ADD COLUMN IF NOT EXISTS mora_diaria numeric(8,2),
  -- Fase D: MiVivienda
  ADD COLUMN IF NOT EXISTS mivivienda_expediente text,
  ADD COLUMN IF NOT EXISTS mivivienda_fecha_ingreso date,
  ADD COLUMN IF NOT EXISTS mivivienda_fecha_beneficiario date,
  ADD COLUMN IF NOT EXISTS mivivienda_fecha_caducidad date,
  ADD COLUMN IF NOT EXISTS mivivienda_bono_monto numeric(12,2),
  ADD COLUMN IF NOT EXISTS mivivienda_ahorro numeric(12,2),
  ADD COLUMN IF NOT EXISTS credito_hipotecario_banco text,
  ADD COLUMN IF NOT EXISTS credito_hipotecario_monto numeric(12,2),
  ADD COLUMN IF NOT EXISTS credito_hipotecario_fecha_inicio date,
  ADD COLUMN IF NOT EXISTS credito_hipotecario_fecha_fin date;

-- Parámetros legales del precontrato (base para las 4 plantillas)
INSERT INTO v2.parametros (clave, valor, descripcion) VALUES
  ('empresa_nombre', '"ASOCIACIÓN COMUNIÓN PROMOCIÓN DESARROLLO Y LIBERACIÓN – COPRODELI"', 'Razón social que aparece en el precontrato'),
  ('empresa_ruc', '"20138693326"', 'RUC de la empresa'),
  ('empresa_representante_nombre', '"Yessenia Obdulia Obregón Callan"', 'Apoderado(a) que firma los precontratos'),
  ('empresa_representante_dni', '"25765681"', 'DNI del apoderado'),
  ('empresa_representante_partida', '"70000278"', 'Partida electrónica de los poderes'),
  ('empresa_domicilio_fiscal', '"Av. Guardia Chalaca N°1371, Distrito y provincia del Callao, Departamento de Lima"', 'Domicilio fiscal de la empresa'),
  ('proyecto_nombre', '"Urbanización Las Palmeras de San Fernando"', 'Nombre comercial del proyecto'),
  ('proyecto_partida_registral', '"11103106"', 'Partida registral del terreno matriz'),
  ('proyecto_ubicacion', '"Sector Comatrana, Lote 1, Las Lomas, Distrito, Provincia y Departamento de Ica"', 'Ubicación del proyecto'),
  ('proyecto_terreno_area', '"70 Has"', 'Área total del terreno matriz'),
  ('cuenta_banbif_sin_data', '"COPRODELI SIN DATA SAN FERNANDO"', 'Cuenta BANBIF para separación/inicial'),
  ('cuenta_banbif_con_data_terreno', '"COPRODELI CON DATA SAN FERNANDO TERRENO"', 'Cuenta BANBIF para cuotas de terreno'),
  ('cuenta_banbif_con_data_casas', '"COPRODELI CON DATA SAN FERNANDO CASAS"', 'Cuenta BANBIF para cuotas de casas'),
  ('mora_diaria_terreno', '2.50', 'Mora diaria terreno (S/)'),
  ('mora_diaria_casa', '2.00', 'Mora diaria casa (S/)'),
  ('penalidad_retiro_terreno', '3500', 'Penalidad por retiro en terreno (S/)'),
  ('penalidad_retiro_casa', '3000', 'Penalidad por retiro en casa (S/)'),
  ('penalidad_mivivienda_no_elegible', '5000', 'Penalidad si el expediente no es elegible (S/)'),
  ('penalidad_retiro_post_bono', '5000', 'Penalidad si se retira tras bono desembolsado (S/)'),
  ('whatsapp_cobranza', '"989 172 061"', 'WhatsApp de recepción/cobranza'),
  ('email_cobranza', '"cobranza@coprodeli.org"', 'Email de cobranza'),
  ('tasa_interes_con_data_default', '8', 'Tasa de interés anual por defecto en cuotas CON DATA (%)'),
  ('tasa_mora_anual', '12', 'Tasa de interés moratorio anual (%)')
ON CONFLICT (clave) DO NOTHING;

-- Derivar cuenta_recaudadora automáticamente según propiedad/modalidad al crear venta
CREATE OR REPLACE FUNCTION v2.derive_cuenta_recaudadora()
RETURNS trigger AS $$
DECLARE
  v_tipo v2.tipo_propiedad;
BEGIN
  IF NEW.cuenta_recaudadora IS NOT NULL THEN RETURN NEW; END IF;
  SELECT tipo INTO v_tipo FROM v2.propiedades WHERE id = NEW.propiedad_id;
  IF NEW.modalidad_pago = 'contado' THEN
    NEW.cuenta_recaudadora := 'sin_data';
  ELSIF v_tipo = 'casa' THEN
    NEW.cuenta_recaudadora := 'con_data_casas';
  ELSE
    NEW.cuenta_recaudadora := 'con_data_terreno';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_derive_cuenta ON v2.ventas;
CREATE TRIGGER trg_derive_cuenta
  BEFORE INSERT OR UPDATE OF modalidad_pago, propiedad_id ON v2.ventas
  FOR EACH ROW EXECUTE FUNCTION v2.derive_cuenta_recaudadora();

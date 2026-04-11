-- ============================================================
-- HABITAD 2.0 — Migración inicial del schema v2
-- Fecha: 2026-04-11
-- ============================================================
-- Convenciones:
--   * Todas las tablas de negocio viven en schema `v2`.
--   * Auth reutiliza public.profiles y public.roles (v1).
--   * public.profiles.use_v2 controla el redirect del login.
--   * Timestamps en UTC (timestamptz).
--   * Montos en numeric(12,2), tc en numeric(8,4).
-- ============================================================

CREATE SCHEMA IF NOT EXISTS v2;

-- ------------------------------------------------------------
-- Integración con v1 (public): flag y rol auditor
-- ------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS use_v2 boolean NOT NULL DEFAULT false;

INSERT INTO public.roles (id, code, label, description)
VALUES (gen_random_uuid(), 'auditor', 'Auditor', 'Solo lectura + exportación de reportes')
ON CONFLICT (code) DO NOTHING;

-- ------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE v2.tipo_propiedad AS ENUM ('casa', 'terreno');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE v2.estado_fisico AS ENUM ('libre', 'separado', 'ocupado', 'bloqueado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE v2.estado_comercial AS ENUM ('sin_venta', 'separacion', 'inicial', 'cuotas', 'cancelacion', 'entregada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE v2.moneda AS ENUM ('PEN', 'USD');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE v2.estado_venta AS ENUM ('separacion', 'inicial', 'cuotas', 'cancelada', 'entregada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE v2.tipo_pago AS ENUM ('separacion', 'inicial', 'cuota', 'saldo_favor', 'otro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE v2.estado_pago AS ENUM ('registrado', 'conciliado', 'anulado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE v2.estado_cuota AS ENUM ('pendiente', 'parcial', 'pagada', 'vencida');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE v2.tipo_documento AS ENUM ('hoja_separacion', 'contrato', 'cronograma', 'recibo', 'otro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE v2.operacion_audit AS ENUM ('INSERT', 'UPDATE', 'DELETE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------
-- Etapas (subproyectos)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS v2.etapas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  plano_url text,
  orden int NOT NULL DEFAULT 0,
  activa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Propiedades (inventario)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS v2.propiedades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuh text UNIQUE NOT NULL,
  etapa_id uuid REFERENCES v2.etapas(id) ON DELETE RESTRICT,
  tipo v2.tipo_propiedad NOT NULL,
  modelo text,
  partida_registral text,
  manzana text,
  lote text,
  ubicacion text,
  area_m2 numeric(10,2),
  precio_lista numeric(12,2) NOT NULL,
  precio_venta numeric(12,2),
  moneda v2.moneda NOT NULL DEFAULT 'USD',
  adicionales jsonb NOT NULL DEFAULT '{}'::jsonb,
  plano_coords jsonb,
  estado_fisico v2.estado_fisico NOT NULL DEFAULT 'libre',
  estado_comercial v2.estado_comercial NOT NULL DEFAULT 'sin_venta',
  bloqueada_por uuid REFERENCES public.profiles(id),
  bloqueada_motivo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_propiedades_etapa ON v2.propiedades(etapa_id);
CREATE INDEX IF NOT EXISTS idx_propiedades_estado_fisico ON v2.propiedades(estado_fisico);
CREATE INDEX IF NOT EXISTS idx_propiedades_estado_comercial ON v2.propiedades(estado_comercial);
CREATE INDEX IF NOT EXISTS idx_propiedades_tipo ON v2.propiedades(tipo);

-- ------------------------------------------------------------
-- Clientes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS v2.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombres text NOT NULL,
  apellidos text NOT NULL,
  dni text UNIQUE NOT NULL,
  telefono text,
  email text,
  direccion text,
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clientes_dni ON v2.clientes(dni);
CREATE INDEX IF NOT EXISTS idx_clientes_auth_user ON v2.clientes(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- ------------------------------------------------------------
-- Ventas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS v2.ventas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  propiedad_id uuid NOT NULL REFERENCES v2.propiedades(id) ON DELETE RESTRICT,
  cliente_id uuid NOT NULL REFERENCES v2.clientes(id) ON DELETE RESTRICT,
  promotor_id uuid REFERENCES public.profiles(id),
  estado v2.estado_venta NOT NULL DEFAULT 'separacion',
  precio_acordado numeric(12,2) NOT NULL,
  moneda v2.moneda NOT NULL,
  fecha_separacion timestamptz NOT NULL DEFAULT now(),
  fecha_vencimiento_separacion timestamptz NOT NULL,
  fecha_pago_separacion timestamptz,
  fecha_limite_inicial timestamptz,
  fecha_inicial_completa timestamptz,
  fecha_contrato timestamptz,
  fecha_cancelacion timestamptz,
  motivo_cancelacion text,
  meses_cuotas int,
  monto_inicial_objetivo numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ventas_propiedad ON v2.ventas(propiedad_id);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON v2.ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_promotor ON v2.ventas(promotor_id);
CREATE INDEX IF NOT EXISTS idx_ventas_estado ON v2.ventas(estado);
CREATE INDEX IF NOT EXISTS idx_ventas_venc_sep ON v2.ventas(fecha_vencimiento_separacion) WHERE estado = 'separacion';

-- ------------------------------------------------------------
-- Pagos (separación, inicial, cuota)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS v2.pagos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id uuid NOT NULL REFERENCES v2.ventas(id) ON DELETE RESTRICT,
  tipo v2.tipo_pago NOT NULL,
  cuota_numero int,
  fecha_deposito date NOT NULL,
  numero_operacion text,
  banco text,
  monto numeric(12,2) NOT NULL CHECK (monto > 0),
  moneda v2.moneda NOT NULL,
  monto_pen numeric(12,2),
  monto_usd numeric(12,2),
  tc_sbs numeric(8,4),
  voucher_url text,
  estado v2.estado_pago NOT NULL DEFAULT 'registrado',
  registrado_por uuid REFERENCES public.profiles(id),
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pagos_venta ON v2.pagos(venta_id);
CREATE INDEX IF NOT EXISTS idx_pagos_tipo ON v2.pagos(tipo);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON v2.pagos(fecha_deposito);
CREATE INDEX IF NOT EXISTS idx_pagos_numero_operacion ON v2.pagos(numero_operacion) WHERE numero_operacion IS NOT NULL;

-- ------------------------------------------------------------
-- Cuotas (cronograma)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS v2.cuotas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id uuid NOT NULL REFERENCES v2.ventas(id) ON DELETE CASCADE,
  numero int NOT NULL,
  fecha_vencimiento date NOT NULL,
  monto numeric(12,2) NOT NULL CHECK (monto >= 0),
  moneda v2.moneda NOT NULL,
  monto_pagado numeric(12,2) NOT NULL DEFAULT 0,
  estado v2.estado_cuota NOT NULL DEFAULT 'pendiente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(venta_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_cuotas_venta ON v2.cuotas(venta_id);
CREATE INDEX IF NOT EXISTS idx_cuotas_estado ON v2.cuotas(estado);
CREATE INDEX IF NOT EXISTS idx_cuotas_vencimiento ON v2.cuotas(fecha_vencimiento);

-- ------------------------------------------------------------
-- Saldos a favor (excedentes de pago)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS v2.saldos_favor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id uuid NOT NULL REFERENCES v2.ventas(id) ON DELETE CASCADE,
  monto numeric(12,2) NOT NULL CHECK (monto > 0),
  moneda v2.moneda NOT NULL,
  origen_pago_id uuid REFERENCES v2.pagos(id) ON DELETE SET NULL,
  consumido boolean NOT NULL DEFAULT false,
  consumido_en uuid REFERENCES v2.cuotas(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saldos_venta ON v2.saldos_favor(venta_id);
CREATE INDEX IF NOT EXISTS idx_saldos_consumido ON v2.saldos_favor(consumido) WHERE consumido = false;

-- ------------------------------------------------------------
-- Documentos generados (PDFs) y checklist
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS v2.documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id uuid REFERENCES v2.ventas(id) ON DELETE CASCADE,
  tipo v2.tipo_documento NOT NULL,
  nombre text NOT NULL,
  url text NOT NULL,
  firmado boolean NOT NULL DEFAULT false,
  firmado_url text,
  generado_por uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documentos_venta ON v2.documentos(venta_id);
CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON v2.documentos(tipo);

CREATE TABLE IF NOT EXISTS v2.checklist_venta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id uuid NOT NULL REFERENCES v2.ventas(id) ON DELETE CASCADE,
  item text NOT NULL,
  completado boolean NOT NULL DEFAULT false,
  url text,
  completado_at timestamptz,
  completado_por uuid REFERENCES public.profiles(id),
  UNIQUE(venta_id, item)
);

-- ------------------------------------------------------------
-- Tipo de cambio SBS (cache diario)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS v2.tipo_cambio_sbs (
  fecha date PRIMARY KEY,
  compra numeric(8,4) NOT NULL,
  venta numeric(8,4) NOT NULL,
  fuente text NOT NULL DEFAULT 'sbs',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Parámetros del sistema (configurables por admin)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS v2.parametros (
  clave text PRIMARY KEY,
  valor jsonb NOT NULL,
  descripcion text,
  updated_by uuid REFERENCES public.profiles(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Auditoría (append-only)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS v2.auditoria (
  id bigserial PRIMARY KEY,
  tabla text NOT NULL,
  fila_id text NOT NULL,
  operacion v2.operacion_audit NOT NULL,
  usuario_id uuid REFERENCES public.profiles(id),
  cambios jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_tabla ON v2.auditoria(tabla);
CREATE INDEX IF NOT EXISTS idx_auditoria_fila ON v2.auditoria(fila_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON v2.auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_created ON v2.auditoria(created_at DESC);

-- ------------------------------------------------------------
-- Notificaciones in-app
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS v2.notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  titulo text NOT NULL,
  mensaje text,
  venta_id uuid REFERENCES v2.ventas(id) ON DELETE CASCADE,
  leida boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_usuario_leida ON v2.notificaciones(usuario_id, leida);
CREATE INDEX IF NOT EXISTS idx_notif_created ON v2.notificaciones(created_at DESC);

-- ------------------------------------------------------------
-- Reportes bancarios importados
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS v2.reportes_bancarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_archivo text NOT NULL,
  url text NOT NULL,
  formato text NOT NULL,
  total_filas int NOT NULL DEFAULT 0,
  matcheadas int NOT NULL DEFAULT 0,
  pendientes int NOT NULL DEFAULT 0,
  subido_por uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS v2.reporte_bancario_filas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporte_id uuid NOT NULL REFERENCES v2.reportes_bancarios(id) ON DELETE CASCADE,
  fila_original jsonb NOT NULL,
  fecha date,
  monto numeric(12,2),
  moneda v2.moneda,
  glosa text,
  numero_operacion text,
  matched_pago_id uuid REFERENCES v2.pagos(id) ON DELETE SET NULL,
  estado text NOT NULL DEFAULT 'pendiente',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rbf_reporte ON v2.reporte_bancario_filas(reporte_id);
CREATE INDEX IF NOT EXISTS idx_rbf_estado ON v2.reporte_bancario_filas(estado);

-- ============================================================
-- Triggers: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION v2.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'etapas','propiedades','clientes','ventas','pagos','cuotas','saldos_favor'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_updated_at ON v2.%I; '
      'CREATE TRIGGER trg_updated_at BEFORE UPDATE ON v2.%I '
      'FOR EACH ROW EXECUTE FUNCTION v2.set_updated_at();',
      t, t
    );
  END LOOP;
END $$;

-- ============================================================
-- Trigger de auditoría genérico
-- ============================================================
CREATE OR REPLACE FUNCTION v2.log_audit()
RETURNS trigger AS $$
DECLARE
  v_user uuid;
  v_row_id text;
  v_changes jsonb;
BEGIN
  BEGIN
    v_user := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_user := NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    v_row_id := OLD.id::text;
    v_changes := jsonb_build_object('old', to_jsonb(OLD));
  ELSIF TG_OP = 'UPDATE' THEN
    v_row_id := NEW.id::text;
    v_changes := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  ELSE
    v_row_id := NEW.id::text;
    v_changes := jsonb_build_object('new', to_jsonb(NEW));
  END IF;

  INSERT INTO v2.auditoria (tabla, fila_id, operacion, usuario_id, cambios)
  VALUES (TG_TABLE_NAME, v_row_id, TG_OP::v2.operacion_audit, v_user, v_changes);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'propiedades','clientes','ventas','pagos','cuotas','saldos_favor','documentos'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_audit ON v2.%I; '
      'CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON v2.%I '
      'FOR EACH ROW EXECUTE FUNCTION v2.log_audit();',
      t, t
    );
  END LOOP;
END $$;

-- ============================================================
-- Vista: saldo consolidado por venta (útil para reportes y UI)
-- ============================================================
CREATE OR REPLACE VIEW v2.vw_saldos_venta AS
SELECT
  v.id AS venta_id,
  v.propiedad_id,
  v.cliente_id,
  v.estado AS estado_venta,
  v.precio_acordado,
  v.moneda,
  COALESCE(SUM(CASE WHEN p.tipo = 'separacion' AND p.estado <> 'anulado' THEN p.monto ELSE 0 END), 0) AS total_separacion,
  COALESCE(SUM(CASE WHEN p.tipo = 'inicial' AND p.estado <> 'anulado' THEN p.monto ELSE 0 END), 0) AS total_inicial,
  COALESCE(SUM(CASE WHEN p.tipo = 'cuota' AND p.estado <> 'anulado' THEN p.monto ELSE 0 END), 0) AS total_cuotas,
  COALESCE(SUM(CASE WHEN p.estado <> 'anulado' THEN p.monto ELSE 0 END), 0) AS total_pagado,
  v.precio_acordado - COALESCE(SUM(CASE WHEN p.estado <> 'anulado' THEN p.monto ELSE 0 END), 0) AS saldo_pendiente,
  COALESCE((SELECT SUM(sf.monto) FROM v2.saldos_favor sf WHERE sf.venta_id = v.id AND sf.consumido = false), 0) AS saldo_favor
FROM v2.ventas v
LEFT JOIN v2.pagos p ON p.venta_id = v.id
GROUP BY v.id;

-- ============================================================
-- Grants mínimos (el detalle de RLS va en el archivo _rls.sql)
-- ============================================================
GRANT USAGE ON SCHEMA v2 TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA v2 TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA v2 TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA v2 TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA v2 GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA v2 GRANT USAGE, SELECT ON SEQUENCES TO authenticated, service_role;

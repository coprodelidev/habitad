-- ============================================================
-- HABITAD 2.0 — Tabla staging y función de promote para import
-- del Excel operativo "CUH SAN FERNANDO 2026 CMR"
-- Fecha: 2026-05-28
-- ============================================================
-- Modelo: subimos cada fila del XLSX a v2.import_cuh_staging con
-- todas las columnas relevantes como text (tolerante a errores)
-- + raw_row jsonb fallback. Luego v2.fn_promote_staging(batch)
-- inserta etapas → propiedades → clientes → ventas → pagos.
-- Idempotente: corre varias veces, solo actualiza/inserta lo que
-- corresponde, marca cada fila con status final.
-- ============================================================

-- Enum status del staging.
DO $$ BEGIN
  CREATE TYPE v2.import_status AS ENUM ('pending', 'promoted', 'warning', 'error', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------
-- Tabla staging
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS v2.import_cuh_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_batch_id uuid NOT NULL,
  row_num int NOT NULL,
  status v2.import_status NOT NULL DEFAULT 'pending',
  error text,
  warning text,

  -- Identidad de la propiedad
  codigo_sap_ubicacion text,             -- col 0: SF-1_3
  etapa_codigo         text,             -- col 2: "1".."21"
  cuh                  text,             -- col 3: C001..C2400+
  declaratoria_tipo    text,             -- col 4: VIVIENDA / TERRENO
  precio_cuh           text,             -- col 5
  partida_registral    text,             -- col 6
  mz                   text,             -- col 7
  lt                   text,             -- col 8
  esq_parq             text,             -- col 9: ESQUINA / PARQUE
  area_lote            text,             -- col 10
  precio_contrato_cuota_moneda text,     -- col 11 (encabezado real de moneda)
  tc                   text,             -- col 12
  precio_promotor_soles text,            -- col 13
  precio_promotor_dolar text,            -- col 14

  -- Valor adicional CV (cobro Coprovidig paralelo)
  valor_adicional_cv   text,             -- col 15
  abonos_cv            text,             -- col 16
  por_pagar_cv         text,             -- col 17
  precio_promotor_final text,            -- col 18

  -- Concepto + promotor + cliente
  concepto             text,             -- col 19
  promotor_csv         text,             -- col 20: puede traer sufijos -DESP/-NZ/-N/(JS)/(PAMO)
  dni                  text,             -- col 21
  apellido_paterno     text,             -- col 22
  apellido_materno     text,             -- col 23
  primer_nombre        text,             -- col 24
  segundo_nombre       text,             -- col 25
  direccion            text,             -- col 26
  ubigeo_cod           text,             -- col 27
  distrito             text,             -- col 28
  provincia            text,             -- col 29
  departamento         text,             -- col 30
  urbanizacion         text,             -- col 31
  celular              text,             -- col 32
  correo               text,             -- col 33

  -- Abonos acumulados + FMV
  abonos_total_29022024 text,            -- col 34
  abonos_total_31032025 text,            -- col 35
  bono_fmv_promotor    text,             -- col 36
  fecha_ch             text,             -- col 37
  ch                   text,             -- col 38
  saldo_pagar          text,             -- col 39
  fecha_desemb_bono    text,             -- col 40
  bono_fmv_real        text,             -- col 41
  abono_cliente_fmv    text,             -- col 42
  donacion_coprodeli   text,             -- col 43
  gastos_administrativos text,           -- col 44
  saldo_cuh            text,             -- col 45
  saldo_a_financiar    text,             -- col 46
  cuota_pagada_31122024 text,            -- col 47
  total_pagado_recaudacion text,         -- col 48
  saldo_pendiente      text,             -- col 49
  ultimo_mes_pagado    text,             -- col 50

  -- Fechas y cronograma
  fecha_separacion     text,             -- col 51
  mes_inicial          text,             -- col 52
  fecha_contrato       text,             -- col 53
  recaudacion          text,             -- col 54
  mes_recaud_inicio    text,             -- col 55
  mes_termino_recaud   text,             -- col 56
  valor_cuota          text,             -- col 57
  num_cuotas           text,             -- col 58
  moneda_estado        text,             -- col 59 (en realidad estado contractual)

  -- Checklist documental
  observaciones_contrato text,           -- col 60
  observaciones_sap    text,             -- col 61
  verificacion_fmv     text,             -- col 62
  carta_fianza         text,             -- col 63
  firmo_cliente        text,             -- col 64
  firmo_coprodeli      text,             -- col 65
  inscrito_rrpp        text,             -- col 66
  acta_conformidad     text,             -- col 67
  testimonio           text,             -- col 68
  descargar_municipalidad text,          -- col 69
  situacion_entrega    text,             -- col 70

  -- FMV (Fondo MiVivienda) - flujo expediente
  fecha_ingreso_fmv    text,             -- col 71
  fecha_liberacion_cf  text,             -- col 72
  observacion          text,             -- col 73
  observaciones_yessenia text,           -- col 74
  fecha_beneficiario   text,             -- col 75
  fecha_caducidad      text,             -- col 76

  -- Comisión por avance
  comision_2pct        text,             -- col 77
  avance               text,             -- col 78
  comision_total       text,             -- col 79

  -- Abonos individuales y totales (jsonb para no inflar columnas)
  abonos_detalle       jsonb DEFAULT '[]'::jsonb,  -- cols 89-120
  total_al_2024        text,             -- col 121
  total_general        text,             -- col 122
  ultimo_pago          text,             -- col 123

  -- Fallback completo de la fila (para debug)
  raw_row              jsonb,

  -- Resultados del promote
  propiedad_id         uuid REFERENCES v2.propiedades(id) ON DELETE SET NULL,
  cliente_id           uuid REFERENCES v2.clientes(id) ON DELETE SET NULL,
  venta_id             uuid REFERENCES v2.ventas(id) ON DELETE SET NULL,
  promoted_at          timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_import_cuh_staging_batch ON v2.import_cuh_staging(import_batch_id, status);
CREATE INDEX IF NOT EXISTS idx_import_cuh_staging_cuh   ON v2.import_cuh_staging(cuh);
CREATE INDEX IF NOT EXISTS idx_import_cuh_staging_dni   ON v2.import_cuh_staging(dni);

ALTER TABLE v2.import_cuh_staging ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS import_cuh_staging_admin_all ON v2.import_cuh_staging;
CREATE POLICY import_cuh_staging_admin_all ON v2.import_cuh_staging
  FOR ALL TO authenticated
  USING (v2.is_admin())
  WITH CHECK (v2.is_admin());

-- ------------------------------------------------------------
-- Helpers privados
-- ------------------------------------------------------------

-- Convierte "53,875.00 " (formato peruano con espacios) a numeric.
-- Devuelve NULL si no parsea.
CREATE OR REPLACE FUNCTION v2.fn_parse_numeric(s text)
RETURNS numeric LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE clean text;
BEGIN
  IF s IS NULL OR btrim(s) = '' THEN RETURN NULL; END IF;
  clean := btrim(s);
  clean := replace(clean, ',', '');     -- separador miles
  clean := replace(clean, ' ', '');
  clean := replace(clean, 'S/', '');
  clean := replace(clean, '$', '');
  clean := replace(clean, '/.', '');
  IF clean = '-' OR clean = '' THEN RETURN NULL; END IF;
  RETURN clean::numeric;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END $$;

-- Convierte "17/02/2026" o "2026-02-17" o un timestamp Excel a date.
CREATE OR REPLACE FUNCTION v2.fn_parse_date(s text)
RETURNS date LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE clean text;
BEGIN
  IF s IS NULL OR btrim(s) = '' THEN RETURN NULL; END IF;
  clean := btrim(s);
  -- ISO directo
  BEGIN RETURN clean::date; EXCEPTION WHEN OTHERS THEN NULL; END;
  -- dd/mm/yyyy
  IF clean ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
    RETURN to_date(clean, 'DD/MM/YYYY');
  END IF;
  -- número serial Excel (días desde 1900-01-01, ajuste -2 por bug 1900)
  IF clean ~ '^\d+(\.\d+)?$' THEN
    RETURN (DATE '1899-12-30' + (clean::numeric)::int);
  END IF;
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END $$;

-- Limpia el sufijo del CSV ("HUGO RODRIGUEZ - DESP - NZ" → base+sufijos)
CREATE OR REPLACE FUNCTION v2.fn_split_promotor(s text, OUT base text, OUT sufijos text[])
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  parts text[];
  i int;
  token text;
BEGIN
  base := NULL;
  sufijos := ARRAY[]::text[];
  IF s IS NULL OR btrim(s) = '' THEN RETURN; END IF;

  -- Marcadores reservados que NO son promotor real
  IF upper(btrim(s)) IN ('CASA LIBRE', 'BLOQUEADO', 'TERRENO LIBRE') OR upper(s) LIKE 'CASA LIBRE%' OR upper(s) LIKE 'TERRENO%LIBRE%' THEN
    RETURN;
  END IF;

  -- Separar por " - " y "(...)"
  parts := regexp_split_to_array(regexp_replace(s, '\s+', ' ', 'g'), ' - ');
  base := btrim(parts[1]);
  FOR i IN 2..coalesce(array_length(parts, 1), 0) LOOP
    token := upper(btrim(parts[i]));
    IF token IN ('DESP', 'NZ', 'N', 'NR') THEN
      sufijos := array_append(sufijos, token);
    END IF;
  END LOOP;

  -- Sufijos entre paréntesis ("(JS)", "(PAMO)")
  FOR token IN
    SELECT upper(btrim(m[1])) FROM regexp_matches(s, '\(([^)]+)\)', 'g') AS m
  LOOP
    sufijos := array_append(sufijos, token);
  END LOOP;

  -- Limpia paréntesis del base
  base := btrim(regexp_replace(base, '\([^)]*\)', '', 'g'));
END $$;

-- Mapea CONCEPTO + estado contractual a estado_venta de v2.
-- Devuelve NULL si no se debe crear venta.
CREATE OR REPLACE FUNCTION v2.fn_map_estado_venta(concepto text, moneda_estado text, contrato text, recaudacion text)
RETURNS v2.estado_venta LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE c text; m text;
BEGIN
  c := upper(coalesce(btrim(concepto), ''));
  m := upper(coalesce(btrim(moneda_estado), ''));
  IF c IN ('', 'BLOQUEADO') OR c LIKE 'CASA LIBRE%' OR c LIKE 'TERRENO%LIBRE%' THEN
    RETURN NULL;
  END IF;
  IF m LIKE 'CANCELADO%' THEN RETURN 'cancelada'; END IF;
  IF contrato IS NOT NULL AND upper(btrim(contrato)) LIKE 'OK%' THEN RETURN 'cuotas'; END IF;
  IF recaudacion IS NOT NULL AND upper(btrim(recaudacion)) LIKE 'OK%' THEN RETURN 'cuotas'; END IF;
  IF c LIKE 'TERRENO%' THEN RETURN 'inicial'; END IF;
  RETURN 'inicial';
END $$;

-- ------------------------------------------------------------
-- Función principal: promueve un batch al modelo v2
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION v2.fn_promote_staging(p_batch uuid)
RETURNS TABLE (
  total_filas        int,
  propiedades_creadas int,
  clientes_creados   int,
  ventas_creadas     int,
  warnings           int,
  errores            int
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  r v2.import_cuh_staging%ROWTYPE;
  v_etapa_id uuid;
  v_propiedad_id uuid;
  v_cliente_id uuid;
  v_venta_id uuid;
  v_tipo v2.tipo_propiedad;
  v_moneda v2.moneda;
  v_precio numeric;
  v_estado_venta v2.estado_venta;
  v_total int := 0;
  v_props int := 0;
  v_clis int := 0;
  v_ventas int := 0;
  v_warn int := 0;
  v_err int := 0;
  v_promotor_base text;
  v_promotor_suf text[];
  v_promotor_id uuid;
  v_fecha_sep timestamptz;
BEGIN
  FOR r IN
    SELECT * FROM v2.import_cuh_staging
    WHERE import_batch_id = p_batch AND status IN ('pending','warning','error')
    ORDER BY row_num
  LOOP
    v_total := v_total + 1;
    BEGIN
      -- Validaciones mínimas
      IF r.cuh IS NULL OR btrim(r.cuh) = '' THEN
        UPDATE v2.import_cuh_staging SET status='error', error='cuh vacío' WHERE id = r.id;
        v_err := v_err + 1; CONTINUE;
      END IF;
      IF r.etapa_codigo IS NULL OR btrim(r.etapa_codigo) = '' THEN
        UPDATE v2.import_cuh_staging SET status='error', error='etapa_codigo vacío' WHERE id = r.id;
        v_err := v_err + 1; CONTINUE;
      END IF;

      -- 1) Etapa (idempotente)
      SELECT id INTO v_etapa_id FROM v2.etapas WHERE codigo = btrim(r.etapa_codigo);
      IF v_etapa_id IS NULL THEN
        INSERT INTO v2.etapas (codigo, nombre, orden, activa)
        VALUES (btrim(r.etapa_codigo), 'Etapa ' || btrim(r.etapa_codigo),
                COALESCE(NULLIF(btrim(r.etapa_codigo), '')::int, 99), true)
        RETURNING id INTO v_etapa_id;
      END IF;

      -- 2) Propiedad (idempotente por CUH)
      v_tipo := CASE upper(coalesce(r.declaratoria_tipo,'')) WHEN 'TERRENO' THEN 'terreno'::v2.tipo_propiedad ELSE 'casa'::v2.tipo_propiedad END;
      IF v2.fn_parse_numeric(r.precio_promotor_dolar) IS NOT NULL AND v2.fn_parse_numeric(r.precio_promotor_dolar) > 0 THEN
        v_moneda := 'USD'; v_precio := v2.fn_parse_numeric(r.precio_promotor_dolar);
      ELSE
        v_moneda := 'PEN'; v_precio := COALESCE(v2.fn_parse_numeric(r.precio_promotor_soles), v2.fn_parse_numeric(r.precio_cuh), 0);
      END IF;

      SELECT id INTO v_propiedad_id FROM v2.propiedades WHERE cuh = btrim(r.cuh);
      IF v_propiedad_id IS NULL THEN
        INSERT INTO v2.propiedades (
          cuh, etapa_id, tipo, modelo, partida_registral, manzana, lote,
          ubicacion, area_m2, precio_lista, moneda,
          estado_fisico, estado_comercial, adicionales
        ) VALUES (
          btrim(r.cuh), v_etapa_id, v_tipo,
          NULLIF(btrim(coalesce(r.concepto,'')), ''),
          NULLIF(btrim(coalesce(r.partida_registral,'')), ''),
          NULLIF(btrim(coalesce(r.mz,'')), ''),
          NULLIF(btrim(coalesce(r.lt,'')), ''),
          NULLIF(btrim(coalesce(r.codigo_sap_ubicacion,'')), ''),
          v2.fn_parse_numeric(r.area_lote),
          v_precio, v_moneda,
          CASE
            WHEN upper(coalesce(r.concepto,'')) = 'BLOQUEADO' THEN 'bloqueado'::v2.estado_fisico
            WHEN r.dni IS NULL OR btrim(r.dni) = '' OR upper(btrim(r.dni)) = 'BLOQUEADO' THEN 'libre'::v2.estado_fisico
            ELSE 'ocupado'::v2.estado_fisico
          END,
          CASE
            WHEN r.dni IS NULL OR btrim(r.dni) = '' OR upper(btrim(r.dni)) = 'BLOQUEADO' THEN 'sin_venta'::v2.estado_comercial
            ELSE 'separacion'::v2.estado_comercial
          END,
          jsonb_build_object(
            'esq_parq', NULLIF(btrim(coalesce(r.esq_parq,'')), ''),
            'concepto_csv', r.concepto,
            'precio_cuh', r.precio_cuh,
            'tc', r.tc
          )
        ) RETURNING id INTO v_propiedad_id;
        v_props := v_props + 1;
      END IF;

      -- Si no hay cliente válido (DNI vacío o BLOQUEADO), terminamos acá
      IF r.dni IS NULL OR btrim(r.dni) = '' OR upper(btrim(r.dni)) = 'BLOQUEADO' THEN
        UPDATE v2.import_cuh_staging
          SET status='promoted', propiedad_id=v_propiedad_id, promoted_at=now()
          WHERE id = r.id;
        CONTINUE;
      END IF;

      -- 3) Cliente (idempotente por DNI). NOT NULL en nombres/apellidos → placeholder si CSV vacío.
      SELECT id INTO v_cliente_id FROM v2.clientes WHERE dni = btrim(r.dni);
      IF v_cliente_id IS NULL THEN
        INSERT INTO v2.clientes (
          dni, apellidos, nombres,
          apellido_paterno, apellido_materno, segundo_nombre,
          telefono, email, direccion,
          urbanizacion, ubigeo_cod
        ) VALUES (
          btrim(r.dni),
          COALESCE(NULLIF(btrim(concat_ws(' ', NULLIF(r.apellido_paterno,''), NULLIF(r.apellido_materno,''))), ''), '(sin apellidos)'),
          COALESCE(NULLIF(btrim(concat_ws(' ', NULLIF(r.primer_nombre,''), NULLIF(r.segundo_nombre,''))), ''), '(sin nombres)'),
          NULLIF(btrim(coalesce(r.apellido_paterno,'')), ''),
          NULLIF(btrim(coalesce(r.apellido_materno,'')), ''),
          NULLIF(btrim(coalesce(r.segundo_nombre,'')), ''),
          NULLIF(btrim(coalesce(r.celular,'')), ''),
          NULLIF(btrim(coalesce(r.correo,'')), ''),
          NULLIF(btrim(coalesce(r.direccion,'')), ''),
          NULLIF(btrim(coalesce(r.urbanizacion,'')), ''),
          NULLIF(btrim(coalesce(r.ubigeo_cod,'')), '')
        ) RETURNING id INTO v_cliente_id;
        v_clis := v_clis + 1;
      END IF;

      -- 4) Promotor (busca por nombre base, si no existe deja null)
      SELECT base, sufijos INTO v_promotor_base, v_promotor_suf FROM v2.fn_split_promotor(r.promotor_csv);
      v_promotor_id := NULL;
      IF v_promotor_base IS NOT NULL THEN
        SELECT id INTO v_promotor_id FROM public.profiles
          WHERE upper(coalesce(sap_employee_name,
                               trim(coalesce(first_name,'') || ' ' || coalesce(last_name,'')))) = upper(v_promotor_base)
          LIMIT 1;
      END IF;

      -- 5) Venta (idempotente por propiedad+cliente)
      v_estado_venta := v2.fn_map_estado_venta(r.concepto, r.moneda_estado, r.fecha_contrato, r.recaudacion);
      IF v_estado_venta IS NULL THEN
        UPDATE v2.import_cuh_staging
          SET status='promoted', propiedad_id=v_propiedad_id, cliente_id=v_cliente_id, promoted_at=now()
          WHERE id = r.id;
        CONTINUE;
      END IF;

      SELECT id INTO v_venta_id FROM v2.ventas
        WHERE propiedad_id = v_propiedad_id AND cliente_id = v_cliente_id;
      IF v_venta_id IS NULL THEN
        v_fecha_sep := COALESCE(v2.fn_parse_date(r.fecha_separacion)::timestamptz, now());
        INSERT INTO v2.ventas (
          propiedad_id, cliente_id, promotor_id, estado,
          precio_acordado, moneda,
          fecha_separacion, fecha_vencimiento_separacion, fecha_contrato,
          meses_cuotas
        ) VALUES (
          v_propiedad_id, v_cliente_id, v_promotor_id, v_estado_venta,
          v_precio, v_moneda,
          v_fecha_sep,
          v_fecha_sep + interval '24 hours',
          v2.fn_parse_date(r.fecha_contrato)::timestamptz,
          NULLIF(btrim(coalesce(r.num_cuotas,'')), '')::int
        ) RETURNING id INTO v_venta_id;
        v_ventas := v_ventas + 1;
      END IF;

      UPDATE v2.import_cuh_staging SET
        status='promoted',
        propiedad_id=v_propiedad_id,
        cliente_id=v_cliente_id,
        venta_id=v_venta_id,
        promoted_at=now()
      WHERE id = r.id;

      IF v_promotor_id IS NULL AND v_promotor_base IS NOT NULL THEN
        UPDATE v2.import_cuh_staging SET status='warning', warning='Promotor sin profile: ' || v_promotor_base WHERE id = r.id;
        v_warn := v_warn + 1;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      UPDATE v2.import_cuh_staging SET status='error', error=SQLERRM WHERE id = r.id;
      v_err := v_err + 1;
    END;
  END LOOP;

  RETURN QUERY SELECT v_total, v_props, v_clis, v_ventas, v_warn, v_err;
END $$;

REVOKE EXECUTE ON FUNCTION v2.fn_promote_staging(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION v2.fn_promote_staging(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION v2.fn_parse_numeric(text) TO authenticated;
GRANT EXECUTE ON FUNCTION v2.fn_parse_date(text) TO authenticated;

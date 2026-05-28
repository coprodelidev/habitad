-- ============================================================
-- HABITAD 2.0 — Validación de etapa_codigo en fn_promote_staging
-- Fecha: 2026-05-28
-- ============================================================
-- Evita que el re-promote vuelva a crear etapas outlier (códigos
-- como 88, 122, 2941, etc. del Excel). Las filas con etapa fuera
-- de 1..21 quedan en staging con warning + propiedad sin etapa.
-- ============================================================

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
  v_ubigeo_valid text;
  v_num_cuotas_num numeric;
  v_num_cuotas int;
  v_concepto_norm text;
  v_obs_lower text;
  v_fmv_estado text;
  v_etapa_codigo text;
BEGIN
  FOR r IN
    SELECT * FROM v2.import_cuh_staging
    WHERE import_batch_id = p_batch
    ORDER BY row_num
  LOOP
    v_total := v_total + 1;
    BEGIN
      IF r.cuh IS NULL OR btrim(r.cuh) = '' THEN
        UPDATE v2.import_cuh_staging SET status='error', error='cuh vacío' WHERE id = r.id;
        v_err := v_err + 1; CONTINUE;
      END IF;
      IF r.etapa_codigo IS NULL OR btrim(r.etapa_codigo) = '' THEN
        UPDATE v2.import_cuh_staging SET status='error', error='etapa_codigo vacío' WHERE id = r.id;
        v_err := v_err + 1; CONTINUE;
      END IF;

      v_etapa_codigo := btrim(r.etapa_codigo);
      -- Validar rango: solo etapas 1..21 son legítimas en San Fernando.
      IF NOT (v_etapa_codigo ~ '^[0-9]+$' AND v_etapa_codigo::int BETWEEN 1 AND 21) THEN
        UPDATE v2.import_cuh_staging
          SET status='warning', warning='Etapa fuera de rango 1-21: ' || v_etapa_codigo
          WHERE id = r.id;
        v_warn := v_warn + 1;
        v_etapa_id := NULL;
      ELSE
        SELECT id INTO v_etapa_id FROM v2.etapas WHERE codigo = v_etapa_codigo;
        IF v_etapa_id IS NULL THEN
          INSERT INTO v2.etapas (codigo, nombre, orden, activa)
          VALUES (v_etapa_codigo, 'Etapa ' || v_etapa_codigo, v_etapa_codigo::int, true)
          RETURNING id INTO v_etapa_id;
        END IF;
      END IF;

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
            'tc', r.tc,
            'etapa_csv', v_etapa_codigo
          )
        ) RETURNING id INTO v_propiedad_id;
        v_props := v_props + 1;
      END IF;

      IF r.dni IS NULL OR btrim(r.dni) = '' OR upper(btrim(r.dni)) = 'BLOQUEADO' THEN
        UPDATE v2.import_cuh_staging
          SET status=CASE WHEN status='warning' THEN 'warning' ELSE 'promoted' END,
              propiedad_id=v_propiedad_id, promoted_at=now(), error=NULL
          WHERE id = r.id;
        CONTINUE;
      END IF;

      v_ubigeo_valid := NULL;
      IF r.ubigeo_cod IS NOT NULL AND btrim(r.ubigeo_cod) <> '' THEN
        SELECT codigo INTO v_ubigeo_valid FROM v2.ubigeos WHERE codigo = btrim(r.ubigeo_cod);
      END IF;

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
          v_ubigeo_valid
        ) RETURNING id INTO v_cliente_id;
        v_clis := v_clis + 1;
      END IF;

      SELECT base, sufijos INTO v_promotor_base, v_promotor_suf FROM v2.fn_split_promotor(r.promotor_csv);
      v_promotor_id := NULL;
      IF v_promotor_base IS NOT NULL THEN
        SELECT id INTO v_promotor_id FROM public.profiles
          WHERE upper(coalesce(sap_employee_name,
                               trim(coalesce(first_name,'') || ' ' || coalesce(last_name,'')))) LIKE upper(v_promotor_base) || '%'
          ORDER BY (CASE WHEN sap_sales_person_code IS NOT NULL THEN 0 ELSE 1 END)
          LIMIT 1;
      END IF;

      v_estado_venta := v2.fn_map_estado_venta(r.concepto, r.moneda_estado, r.fecha_contrato, r.recaudacion);
      IF v_estado_venta IS NULL THEN
        UPDATE v2.import_cuh_staging
          SET status=CASE WHEN status='warning' THEN 'warning' ELSE 'promoted' END,
              propiedad_id=v_propiedad_id, cliente_id=v_cliente_id, promoted_at=now(), error=NULL
          WHERE id = r.id;
        CONTINUE;
      END IF;

      v_num_cuotas_num := v2.fn_parse_numeric(r.num_cuotas);
      v_num_cuotas := CASE WHEN v_num_cuotas_num IS NULL THEN NULL ELSE v_num_cuotas_num::int END;

      v_concepto_norm := NULLIF(btrim(coalesce(r.concepto,'')), '');
      IF v_concepto_norm IS NOT NULL THEN
        INSERT INTO v2.conceptos_cliente (codigo, descripcion)
        VALUES (v_concepto_norm, 'Auto-creado desde import CSV')
        ON CONFLICT (codigo) DO NOTHING;
      END IF;

      v_obs_lower := lower(coalesce(r.observacion,'') || ' ' || coalesce(r.observaciones_yessenia,'') || ' ' || coalesce(r.recaudacion,''));
      v_fmv_estado := CASE
        WHEN r.fecha_desemb_bono IS NOT NULL AND btrim(r.fecha_desemb_bono) <> '' THEN 'cf_desembolsado'
        WHEN r.fecha_beneficiario IS NOT NULL AND btrim(r.fecha_beneficiario) <> '' THEN 'beneficiario'
        WHEN v_obs_lower LIKE '%pedir cf%' THEN 'pedir_cf'
        WHEN v_obs_lower LIKE '%caduc%' THEN 'caducado'
        WHEN v_obs_lower LIKE '%rechaz%' THEN 'rechazado'
        ELSE NULL
      END;

      SELECT id INTO v_venta_id FROM v2.ventas
        WHERE propiedad_id = v_propiedad_id AND cliente_id = v_cliente_id;
      IF v_venta_id IS NULL THEN
        v_fecha_sep := COALESCE(v2.fn_parse_date(r.fecha_separacion)::timestamptz, now());
        INSERT INTO v2.ventas (
          propiedad_id, cliente_id, promotor_id, estado,
          precio_acordado, moneda,
          fecha_separacion, fecha_vencimiento_separacion, fecha_contrato,
          meses_cuotas,
          concepto_cliente,
          valor_adicional_cv, abonos_cv,
          fmv_precio, fmv_bono_real, fmv_abono_cliente,
          fmv_donacion_coprodeli, fmv_gastos_administrativos, fmv_saldo,
          fmv_fecha_desembolso, fmv_estado_expediente,
          mivivienda_fecha_beneficiario, mivivienda_fecha_caducidad
        ) VALUES (
          v_propiedad_id, v_cliente_id, v_promotor_id, v_estado_venta,
          v_precio, v_moneda,
          v_fecha_sep,
          v_fecha_sep + interval '24 hours',
          v2.fn_parse_date(r.fecha_contrato)::timestamptz,
          v_num_cuotas,
          v_concepto_norm,
          COALESCE(v2.fn_parse_numeric(r.valor_adicional_cv), 0),
          COALESCE(v2.fn_parse_numeric(r.abonos_cv), 0),
          v2.fn_parse_numeric(r.precio_cuh),
          v2.fn_parse_numeric(r.bono_fmv_real),
          v2.fn_parse_numeric(r.abono_cliente_fmv),
          v2.fn_parse_numeric(r.donacion_coprodeli),
          v2.fn_parse_numeric(r.gastos_administrativos),
          v2.fn_parse_numeric(r.saldo_cuh),
          v2.fn_parse_date(r.fecha_desemb_bono),
          v_fmv_estado,
          v2.fn_parse_date(r.fecha_beneficiario),
          v2.fn_parse_date(r.fecha_caducidad)
        ) RETURNING id INTO v_venta_id;
        v_ventas := v_ventas + 1;
      ELSE
        UPDATE v2.ventas SET
          promotor_id = COALESCE(promotor_id, v_promotor_id),
          concepto_cliente = COALESCE(concepto_cliente, v_concepto_norm),
          valor_adicional_cv = COALESCE(NULLIF(valor_adicional_cv,0), v2.fn_parse_numeric(r.valor_adicional_cv), 0),
          abonos_cv = COALESCE(NULLIF(abonos_cv,0), v2.fn_parse_numeric(r.abonos_cv), 0),
          fmv_precio = COALESCE(fmv_precio, v2.fn_parse_numeric(r.precio_cuh)),
          fmv_bono_real = COALESCE(fmv_bono_real, v2.fn_parse_numeric(r.bono_fmv_real)),
          fmv_abono_cliente = COALESCE(fmv_abono_cliente, v2.fn_parse_numeric(r.abono_cliente_fmv)),
          fmv_donacion_coprodeli = COALESCE(fmv_donacion_coprodeli, v2.fn_parse_numeric(r.donacion_coprodeli)),
          fmv_gastos_administrativos = COALESCE(fmv_gastos_administrativos, v2.fn_parse_numeric(r.gastos_administrativos)),
          fmv_saldo = COALESCE(fmv_saldo, v2.fn_parse_numeric(r.saldo_cuh)),
          fmv_fecha_desembolso = COALESCE(fmv_fecha_desembolso, v2.fn_parse_date(r.fecha_desemb_bono)),
          fmv_estado_expediente = COALESCE(fmv_estado_expediente, v_fmv_estado),
          mivivienda_fecha_beneficiario = COALESCE(mivivienda_fecha_beneficiario, v2.fn_parse_date(r.fecha_beneficiario)),
          mivivienda_fecha_caducidad = COALESCE(mivivienda_fecha_caducidad, v2.fn_parse_date(r.fecha_caducidad)),
          updated_at = now()
        WHERE id = v_venta_id;
      END IF;

      UPDATE v2.import_cuh_staging SET
        status=CASE WHEN status='warning' THEN 'warning' ELSE 'promoted' END,
        propiedad_id=v_propiedad_id,
        cliente_id=v_cliente_id,
        venta_id=v_venta_id,
        promoted_at=now(),
        error=NULL
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

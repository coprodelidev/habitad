-- Retiro confirmado: expediente, cancelación y liberación en una transacción.
-- Los vencimientos pasan a revisión; ya no liberan sin confirmación humana.
BEGIN;

CREATE TABLE v2.retiros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id uuid NOT NULL UNIQUE REFERENCES v2.ventas(id) ON DELETE RESTRICT,
  motivo text NOT NULL CHECK (motivo IN ('cuotas_atrasadas', 'no_cumple_requisitos',
    'requisitos_cambio_titular', 'cambio_ubicacion', 'inicial_separacion_incompleta')),
  aplica_penalidad boolean GENERATED ALWAYS AS
    (motivo IN ('cuotas_atrasadas', 'no_cumple_requisitos', 'inicial_separacion_incompleta')) STORED,
  penalidad_monto numeric(12,2) NOT NULL,
  penalidad_moneda v2.moneda NOT NULL DEFAULT 'PEN',
  fecha_retiro timestamptz NOT NULL DEFAULT now(),
  cliente_snapshot jsonb NOT NULL,
  propiedad_snapshot jsonb NOT NULL,
  carta_solicitada boolean NOT NULL DEFAULT false,
  carta_recibida boolean NOT NULL DEFAULT false,
  datos_verificados boolean NOT NULL DEFAULT false,
  fecha_confirmada boolean NOT NULL DEFAULT false,
  penalidad_revisada boolean NOT NULL DEFAULT false,
  devolucion_gestionada boolean NOT NULL DEFAULT false,
  completado_at timestamptz,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  CHECK ((aplica_penalidad AND penalidad_monto > 0 AND penalidad_monto < 10000000000)
    OR (NOT aplica_penalidad AND penalidad_monto = 0)),
  CHECK (NOT carta_recibida OR carta_solicitada),
  CHECK (NOT devolucion_gestionada OR
    (carta_solicitada AND carta_recibida AND datos_verificados AND fecha_confirmada AND penalidad_revisada))
);
CREATE INDEX retiros_fecha_idx ON v2.retiros(fecha_retiro DESC);

CREATE TABLE v2.retiro_observaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retiro_id uuid NOT NULL REFERENCES v2.retiros(id) ON DELETE RESTRICT,
  texto text NOT NULL CHECK (length(trim(texto)) BETWEEN 1 AND 2000),
  autor_id uuid NOT NULL REFERENCES public.profiles(id),
  autor_nombre text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resuelta_at timestamptz,
  resuelta_por uuid REFERENCES public.profiles(id)
);
CREATE INDEX retiro_observaciones_retiro_idx ON v2.retiro_observaciones(retiro_id, created_at DESC);

ALTER TABLE v2.retiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE v2.retiro_observaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY retiros_lectura ON v2.retiros FOR SELECT TO authenticated
  USING ((v2.is_staff() OR v2.is_auditor()) AND EXISTS
    (SELECT 1 FROM v2.ventas v WHERE v.id = venta_id));
CREATE POLICY retiro_observaciones_lectura ON v2.retiro_observaciones FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM v2.retiros r WHERE r.id = retiro_id));
-- Las escrituras pasan por RPC: ni el cliente ni un UPDATE directo pueden omitir validaciones.
REVOKE ALL ON v2.retiros, v2.retiro_observaciones FROM anon, authenticated;
GRANT SELECT ON v2.retiros, v2.retiro_observaciones TO authenticated;

CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON v2.retiros
  FOR EACH ROW EXECUTE FUNCTION v2.log_audit();
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON v2.retiro_observaciones
  FOR EACH ROW EXECUTE FUNCTION v2.log_audit();

-- Recordatorios pendientes únicos por destinatario y venta. Las observaciones no se agrupan.
CREATE UNIQUE INDEX notif_retiro_pendiente_unique ON v2.notificaciones(usuario_id, venta_id, tipo)
  WHERE NOT leida AND tipo IN ('retiro_pendiente', 'retiro_revision_vencimiento');

CREATE FUNCTION v2.notificar_retiro(p_venta_id uuid, p_tipo text, p_titulo text, p_mensaje text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog, v2 AS $$
  INSERT INTO v2.notificaciones(usuario_id, tipo, titulo, mensaje, venta_id)
  SELECT p.id, p_tipo, p_titulo, p_mensaje, v.id
  FROM v2.ventas v CROSS JOIN public.profiles p
  JOIN public.roles rol ON rol.id = p.role_id
  WHERE v.id = p_venta_id AND
    (rol.code IN ('administrador','gerente','coordinador','supervisor','asistente')
      OR (rol.code = 'promotor' AND p.id = v.promotor_id))
  ON CONFLICT DO NOTHING;
$$;
REVOKE ALL ON FUNCTION v2.notificar_retiro(uuid,text,text,text) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION v2.registrar_retiro(
  p_venta_id uuid, p_motivo text, p_penalidad numeric,
  p_observacion text DEFAULT NULL, p_confirmado boolean DEFAULT false
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, v2 AS $$
DECLARE
  v_venta v2.ventas%ROWTYPE;
  v_cliente v2.clientes%ROWTYPE;
  v_propiedad v2.propiedades%ROWTYPE;
  v_id uuid;
  v_motivo text;
  v_penalidad boolean;
BEGIN
  IF auth.uid() IS NULL OR NOT coalesce(v2.is_admin(), false) THEN
    RAISE EXCEPTION 'Solo un administrador puede liberar una ubicación.';
  END IF;
  IF p_confirmado IS DISTINCT FROM true THEN RAISE EXCEPTION 'Debe confirmar la advertencia de retiro.'; END IF;
  v_motivo := CASE p_motivo
    WHEN 'cuotas_atrasadas' THEN 'Cuotas atrasadas'
    WHEN 'no_cumple_requisitos' THEN 'No cumple requisitos'
    WHEN 'requisitos_cambio_titular' THEN 'No cumple requisitos del cambio de titular'
    WHEN 'cambio_ubicacion' THEN 'Cambio de ubicación'
    WHEN 'inicial_separacion_incompleta' THEN 'No completó inicial o separación'
    ELSE NULL END;
  IF v_motivo IS NULL THEN RAISE EXCEPTION 'Seleccione un motivo de retiro válido.'; END IF;
  v_penalidad := p_motivo IN ('cuotas_atrasadas','no_cumple_requisitos','inicial_separacion_incompleta');
  IF p_penalidad IS NULL OR p_penalidad::text IN ('NaN','Infinity','-Infinity')
    OR p_penalidad <> round(p_penalidad, 2)
    OR p_penalidad >= 10000000000
    OR (v_penalidad AND p_penalidad <= 0) OR (NOT v_penalidad AND p_penalidad <> 0) THEN
    RAISE EXCEPTION 'Confirme un monto positivo con hasta dos decimales para los motivos con penalidad, o cero si no aplica.';
  END IF;
  IF length(coalesce(p_observacion, '')) > 2000 THEN RAISE EXCEPTION 'La observación admite hasta 2000 caracteres.'; END IF;
  SELECT * INTO v_venta FROM v2.ventas WHERE id = p_venta_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Venta no encontrada.'; END IF;
  -- Reintentos de la misma operación no duplican el expediente ni liberan otra venta.
  SELECT id INTO v_id FROM v2.retiros WHERE venta_id = p_venta_id;
  IF v_id IS NOT NULL THEN RETURN v_id; END IF;
  IF v_venta.estado NOT IN ('separacion','inicial','cuotas') THEN
    RAISE EXCEPTION 'La venta ya no está activa. Actualice el plano.';
  END IF;
  SELECT * INTO STRICT v_propiedad FROM v2.propiedades WHERE id = v_venta.propiedad_id FOR UPDATE;
  IF EXISTS (SELECT 1 FROM v2.ventas WHERE propiedad_id = v_venta.propiedad_id
    AND id <> v_venta.id AND estado IN ('separacion','inicial','cuotas','entregada')) THEN
    RAISE EXCEPTION 'La ubicación tiene otra venta vigente. Revise las ventas antes de liberar.';
  END IF;
  SELECT * INTO STRICT v_cliente FROM v2.clientes WHERE id = v_venta.cliente_id;
  INSERT INTO v2.retiros(venta_id, motivo, penalidad_monto, cliente_snapshot, propiedad_snapshot, created_by)
  VALUES (v_venta.id, p_motivo, p_penalidad,
    jsonb_build_object('nombres',v_cliente.nombres,'apellidos',v_cliente.apellidos,'dni',v_cliente.dni,
      'telefono',v_cliente.telefono,'email',v_cliente.email,'direccion',v_cliente.direccion),
    jsonb_build_object('cuh',v_propiedad.cuh,'manzana',v_propiedad.manzana,'lote',v_propiedad.lote), auth.uid())
  RETURNING id INTO v_id;
  UPDATE v2.ventas SET estado = 'cancelada', fecha_cancelacion = now(), motivo_cancelacion = v_motivo
    WHERE id = v_venta.id;
  -- El trigger existente sync_propiedad_estado libera la ubicación en esta misma transacción.
  IF nullif(trim(p_observacion), '') IS NOT NULL THEN
    INSERT INTO v2.retiro_observaciones(retiro_id,texto,autor_id,autor_nombre)
    SELECT v_id, trim(p_observacion), auth.uid(),
      coalesce(nullif(trim(concat_ws(' ',first_name,last_name)),''),email,'Usuario')
    FROM public.profiles WHERE id = auth.uid();
  END IF;
  UPDATE v2.notificaciones SET leida = true
    WHERE venta_id = v_venta.id AND tipo = 'retiro_revision_vencimiento' AND NOT leida;
  PERFORM v2.notificar_retiro(v_venta.id,'retiro_pendiente','Retiro registrado: solicitar carta de devolución',
    concat(v_cliente.nombres,' ',v_cliente.apellidos,' · DNI ',v_cliente.dni,' · ',v_motivo,
      '. Fecha: ',to_char(now() AT TIME ZONE 'America/Lima','DD/MM/YYYY'),
      '. Penalidad: ',CASE WHEN v_penalidad THEN concat('S/ ',p_penalidad) ELSE 'sin penalidad' END,
      '. Pendiente: carta de devolución, datos del cliente, fecha y revisión de penalidad.',
      CASE WHEN nullif(trim(p_observacion),'') IS NOT NULL THEN concat(' Observación: ',trim(p_observacion)) ELSE '' END));
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION v2.registrar_retiro(uuid,text,numeric,text,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION v2.registrar_retiro(uuid,text,numeric,text,boolean) TO authenticated;

CREATE FUNCTION v2.validar_cancelacion_retiro()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, v2 AS $$
BEGIN
  IF OLD.estado IN ('separacion','inicial','cuotas') AND NEW.estado IN ('cancelada','cancelada_desplazada')
    AND NOT EXISTS (SELECT 1 FROM v2.retiros WHERE venta_id = OLD.id) THEN
    RAISE EXCEPTION 'Debe registrar el retiro con motivo y confirmación antes de liberar la ubicación.';
  END IF;
  IF EXISTS (SELECT 1 FROM v2.retiros WHERE venta_id = OLD.id) AND
    (NEW.propiedad_id IS DISTINCT FROM OLD.propiedad_id OR NEW.cliente_id IS DISTINCT FROM OLD.cliente_id
      OR NEW.estado NOT IN ('cancelada','cancelada_desplazada')) THEN
    RAISE EXCEPTION 'Una venta retirada conserva su cliente, ubicación y estado cancelado.';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validar_cancelacion_retiro BEFORE UPDATE ON v2.ventas
  FOR EACH ROW EXECUTE FUNCTION v2.validar_cancelacion_retiro();

CREATE FUNCTION v2.validar_liberacion_retiro()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, v2 AS $$
BEGIN
  IF NEW.estado_fisico = 'libre' AND OLD.estado_fisico <> 'libre' AND EXISTS
    (SELECT 1 FROM v2.ventas WHERE propiedad_id = OLD.id AND estado IN ('separacion','inicial','cuotas','entregada')) THEN
    RAISE EXCEPTION 'La ubicación tiene una venta vigente. Registre el retiro antes de liberarla.';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_validar_liberacion_retiro BEFORE UPDATE OF estado_fisico ON v2.propiedades
  FOR EACH ROW EXECUTE FUNCTION v2.validar_liberacion_retiro();

-- Acceso de seguimiento coherente con ventas: promotor solo sus ventas, auditor solo lectura.
CREATE FUNCTION v2.puede_gestionar_retiro(p_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, v2 AS $$
  SELECT auth.uid() IS NOT NULL AND coalesce(v2.is_staff(),false) AND EXISTS (
    SELECT 1 FROM v2.retiros r JOIN v2.ventas v ON v.id = r.venta_id
    WHERE r.id = p_id AND (v2.user_role() <> 'promotor' OR v.promotor_id = auth.uid())
  );
$$;
REVOKE ALL ON FUNCTION v2.puede_gestionar_retiro(uuid) FROM PUBLIC, anon, authenticated;

CREATE FUNCTION v2.actualizar_tarea_retiro(p_id uuid, p_campo text, p_completado boolean, p_version integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, v2 AS $$
DECLARE v_retiro v2.retiros%ROWTYPE;
BEGIN
  IF NOT v2.puede_gestionar_retiro(p_id) THEN RAISE EXCEPTION 'No tiene permiso para gestionar este retiro.'; END IF;
  SELECT * INTO STRICT v_retiro FROM v2.retiros WHERE id = p_id FOR UPDATE;
  IF p_version IS DISTINCT FROM v_retiro.version THEN RAISE EXCEPTION 'Otro usuario actualizó este retiro. Actualice antes de continuar.'; END IF;
  IF p_campo IS NULL OR p_campo NOT IN ('carta_solicitada','carta_recibida','datos_verificados','fecha_confirmada','penalidad_revisada','devolucion_gestionada')
    OR p_completado IS NULL THEN RAISE EXCEPTION 'Tarea inválida.'; END IF;
  IF p_campo = 'carta_recibida' AND p_completado AND NOT v_retiro.carta_solicitada THEN
    RAISE EXCEPTION 'Primero marque la carta como solicitada.';
  END IF;
  IF p_campo = 'carta_solicitada' AND NOT p_completado AND v_retiro.carta_recibida THEN
    RAISE EXCEPTION 'Primero desmarque la recepción de la carta.';
  END IF;
  IF p_campo <> 'devolucion_gestionada' AND NOT p_completado AND v_retiro.devolucion_gestionada THEN
    RAISE EXCEPTION 'Primero reabra la gestión de devolución.';
  END IF;
  IF p_campo = 'devolucion_gestionada' AND p_completado THEN
    IF NOT (v_retiro.carta_solicitada AND v_retiro.carta_recibida AND v_retiro.datos_verificados
      AND v_retiro.fecha_confirmada AND v_retiro.penalidad_revisada) THEN
      RAISE EXCEPTION 'Complete primero la carta, datos, fecha y revisión de penalidad.';
    END IF;
    IF EXISTS (SELECT 1 FROM v2.retiro_observaciones WHERE retiro_id = p_id AND resuelta_at IS NULL) THEN
      RAISE EXCEPTION 'Resuelva las observaciones pendientes antes de completar la gestión.';
    END IF;
  END IF;
  EXECUTE format('UPDATE v2.retiros SET %I = $1, version = version + 1, updated_at = now() WHERE id = $2',p_campo)
    USING p_completado,p_id;
  UPDATE v2.retiros SET completado_at = CASE WHEN devolucion_gestionada THEN coalesce(completado_at,now()) ELSE NULL END WHERE id = p_id;
  IF p_campo = 'devolucion_gestionada' AND p_completado THEN
    UPDATE v2.notificaciones SET leida = true WHERE venta_id = v_retiro.venta_id AND tipo = 'retiro_pendiente' AND NOT leida;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION v2.actualizar_tarea_retiro(uuid,text,boolean,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION v2.actualizar_tarea_retiro(uuid,text,boolean,integer) TO authenticated;

CREATE FUNCTION v2.agregar_observacion_retiro(p_id uuid, p_texto text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, v2 AS $$
DECLARE v_retiro v2.retiros%ROWTYPE;
BEGIN
  IF NOT v2.puede_gestionar_retiro(p_id) THEN RAISE EXCEPTION 'No tiene permiso para gestionar este retiro.'; END IF;
  IF p_texto IS NULL OR length(trim(p_texto)) NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'Escriba una observación de hasta 2000 caracteres.'; END IF;
  SELECT * INTO STRICT v_retiro FROM v2.retiros WHERE id = p_id FOR UPDATE;
  INSERT INTO v2.retiro_observaciones(retiro_id,texto,autor_id,autor_nombre)
  SELECT p_id, trim(p_texto), auth.uid(),coalesce(nullif(trim(concat_ws(' ',first_name,last_name)),''),email,'Usuario')
    FROM public.profiles WHERE id = auth.uid();
  UPDATE v2.retiros SET devolucion_gestionada = false, completado_at = NULL, version = version + 1, updated_at = now() WHERE id = p_id;
  PERFORM v2.notificar_retiro(v_retiro.venta_id,'retiro_observacion','Observación de cliente retirado',
    concat(v_retiro.cliente_snapshot->>'nombres',' ',v_retiro.cliente_snapshot->>'apellidos',
      ' · DNI ',v_retiro.cliente_snapshot->>'dni',': ',trim(p_texto)));
END;
$$;
REVOKE ALL ON FUNCTION v2.agregar_observacion_retiro(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION v2.agregar_observacion_retiro(uuid,text) TO authenticated;

CREATE FUNCTION v2.resolver_observacion_retiro(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, v2 AS $$
DECLARE v_retiro_id uuid;
BEGIN
  SELECT retiro_id INTO v_retiro_id FROM v2.retiro_observaciones WHERE id = p_id;
  IF NOT v2.puede_gestionar_retiro(v_retiro_id) THEN RAISE EXCEPTION 'No tiene permiso para gestionar esta observación.'; END IF;
  PERFORM 1 FROM v2.retiros WHERE id = v_retiro_id FOR UPDATE;
  UPDATE v2.retiro_observaciones SET resuelta_at = now(), resuelta_por = auth.uid()
    WHERE id = p_id AND resuelta_at IS NULL;
END;
$$;
REVOKE ALL ON FUNCTION v2.resolver_observacion_retiro(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION v2.resolver_observacion_retiro(uuid) TO authenticated;

-- Conservamos las firmas usadas por cron; solo notifican, nunca cancelan.
CREATE OR REPLACE FUNCTION v2.liberar_separaciones_vencidas()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, v2 AS $$
DECLARE v record; n int := 0;
BEGIN
  FOR v IN SELECT ve.id, c.nombres, c.apellidos FROM v2.ventas ve JOIN v2.clientes c ON c.id = ve.cliente_id
    WHERE ve.estado = 'separacion' AND ve.fecha_pago_separacion IS NULL AND ve.fecha_vencimiento_separacion < now()
  LOOP
    PERFORM v2.notificar_retiro(v.id,'retiro_revision_vencimiento','Separación vencida: revisar retiro',
      concat(v.nombres,' ',v.apellidos,': revise los pagos y confirme el motivo y la penalidad desde el plano antes de liberar.'));
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;
CREATE OR REPLACE FUNCTION v2.cancelar_iniciales_vencidas()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, v2 AS $$
DECLARE v record; n int := 0;
BEGIN
  FOR v IN SELECT ve.id, c.nombres, c.apellidos FROM v2.ventas ve JOIN v2.clientes c ON c.id = ve.cliente_id
    WHERE ve.estado = 'inicial' AND ve.fecha_limite_inicial < now() AND ve.fecha_inicial_completa IS NULL
    AND (ve.monto_inicial_objetivo IS NULL OR ve.monto_inicial_objetivo >
      (SELECT coalesce(sum(p.monto),0) FROM v2.pagos p WHERE p.venta_id = ve.id AND p.tipo = 'inicial' AND p.estado <> 'anulado'))
  LOOP
    PERFORM v2.notificar_retiro(v.id,'retiro_revision_vencimiento','Inicial vencida: revisar retiro',
      concat(v.nombres,' ',v.apellidos,': revise los pagos y confirme el motivo y la penalidad desde el plano antes de liberar.'));
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;

CREATE FUNCTION v2.notificar_retiros_pendientes()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, v2 AS $$
DECLARE r v2.retiros%ROWTYPE; n int := 0;
BEGIN
  FOR r IN SELECT * FROM v2.retiros WHERE completado_at IS NULL LOOP
    PERFORM v2.notificar_retiro(r.venta_id,'retiro_pendiente','Retiro con trámites pendientes',
      concat(r.cliente_snapshot->>'nombres',' ',r.cliente_snapshot->>'apellidos',
        ' · DNI ',r.cliente_snapshot->>'dni','. Pendientes: ',concat_ws(', ',
        CASE WHEN NOT r.carta_solicitada THEN 'solicitar carta de devolución' END,
        CASE WHEN NOT r.carta_recibida THEN 'recibir carta' END,
        CASE WHEN NOT r.datos_verificados THEN 'verificar datos del cliente' END,
        CASE WHEN NOT r.fecha_confirmada THEN 'confirmar fecha' END,
        CASE WHEN NOT r.penalidad_revisada THEN 'revisar penalidad' END,
        CASE WHEN NOT r.devolucion_gestionada THEN 'gestionar devolución y resolver observaciones' END)));
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;
REVOKE ALL ON FUNCTION v2.notificar_retiros_pendientes() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION v2.fn_cron_run()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, v2 AS $$
DECLARE v_sep int; v_ini int; v_ven int; v_not int; v_ret int;
BEGIN
  v_sep := v2.liberar_separaciones_vencidas();
  v_ini := v2.cancelar_iniciales_vencidas();
  v_ven := v2.fn_marcar_cuotas_vencidas();
  v_not := v2.fn_notificar_cuotas_proximas();
  v_ret := v2.notificar_retiros_pendientes();
  RETURN jsonb_build_object('separaciones_por_revisar',v_sep,'iniciales_por_revisar',v_ini,
    'cuotas_marcadas_vencidas',v_ven,'notificaciones_cuota_proxima',v_not,'retiros_pendientes',v_ret);
END;
$$;
NOTIFY pgrst, 'reload schema';
COMMIT;

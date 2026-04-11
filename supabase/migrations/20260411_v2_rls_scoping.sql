-- ============================================================
-- HABITAD 2.0 — Scoping RLS por rol (fase 2)
-- ============================================================
-- Problema detectado: las policies SELECT para pagos, cuotas,
-- saldos_favor, documentos y checklist_venta permitían acceso
-- a cualquier is_staff(). El promotor, al ser staff, veía datos
-- de todos los demás promotores.
--
-- Fix: reemplazamos esas policies para que el promotor vea ÚNICAMENTE
-- los registros asociados a ventas donde él es el promotor_id.
-- Los demás roles staff (gerente, coordinador, supervisor, asistente)
-- mantienen visibilidad global porque son roles de supervisión.
--
-- clientes se deja abierto a todo staff porque el flujo de separación
-- hace upsert por DNI (si promotor no ve un cliente existente, crearía
-- un duplicado y fallaría por unique constraint). La privacidad aquí
-- es baja — solo se exponen nombre/DNI/tel — y es un tradeoff consciente.
-- ============================================================

-- ---------- PAGOS ----------
DROP POLICY IF EXISTS pagos_select ON v2.pagos;
CREATE POLICY pagos_select ON v2.pagos
  FOR SELECT TO authenticated
  USING (
    v2.is_admin()
    OR v2.is_auditor()
    OR v2.user_role() IN ('gerente','coordinador','supervisor','asistente')
    OR (v2.is_promotor() AND venta_id IN (SELECT id FROM v2.ventas WHERE promotor_id = auth.uid()))
    OR venta_id IN (SELECT v.id FROM v2.ventas v JOIN v2.clientes c ON c.id = v.cliente_id WHERE c.auth_user_id = auth.uid())
  );

-- Promotor solo puede INSERT pagos sobre ventas suyas
DROP POLICY IF EXISTS pagos_insert_staff ON v2.pagos;
CREATE POLICY pagos_insert_staff ON v2.pagos
  FOR INSERT TO authenticated
  WITH CHECK (
    v2.is_admin()
    OR v2.user_role() IN ('gerente','coordinador','supervisor','asistente')
    OR (v2.is_promotor() AND venta_id IN (SELECT id FROM v2.ventas WHERE promotor_id = auth.uid()))
  );

-- ---------- CUOTAS ----------
DROP POLICY IF EXISTS cuotas_select ON v2.cuotas;
CREATE POLICY cuotas_select ON v2.cuotas
  FOR SELECT TO authenticated
  USING (
    v2.is_admin()
    OR v2.is_auditor()
    OR v2.user_role() IN ('gerente','coordinador','supervisor','asistente')
    OR (v2.is_promotor() AND venta_id IN (SELECT id FROM v2.ventas WHERE promotor_id = auth.uid()))
    OR venta_id IN (SELECT v.id FROM v2.ventas v JOIN v2.clientes c ON c.id = v.cliente_id WHERE c.auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS cuotas_write_staff ON v2.cuotas;
CREATE POLICY cuotas_write_staff ON v2.cuotas
  FOR INSERT TO authenticated
  WITH CHECK (
    v2.is_admin()
    OR v2.user_role() IN ('gerente','coordinador','supervisor','asistente')
    OR (v2.is_promotor() AND venta_id IN (SELECT id FROM v2.ventas WHERE promotor_id = auth.uid()))
  );

DROP POLICY IF EXISTS cuotas_update_staff ON v2.cuotas;
CREATE POLICY cuotas_update_staff ON v2.cuotas
  FOR UPDATE TO authenticated
  USING (
    v2.is_admin()
    OR v2.user_role() IN ('gerente','coordinador','supervisor','asistente')
    OR (v2.is_promotor() AND venta_id IN (SELECT id FROM v2.ventas WHERE promotor_id = auth.uid()))
  )
  WITH CHECK (
    v2.is_admin()
    OR v2.user_role() IN ('gerente','coordinador','supervisor','asistente')
    OR (v2.is_promotor() AND venta_id IN (SELECT id FROM v2.ventas WHERE promotor_id = auth.uid()))
  );

-- ---------- SALDOS A FAVOR ----------
DROP POLICY IF EXISTS saldos_select ON v2.saldos_favor;
CREATE POLICY saldos_select ON v2.saldos_favor
  FOR SELECT TO authenticated
  USING (
    v2.is_admin() OR v2.is_auditor()
    OR v2.user_role() IN ('gerente','coordinador','supervisor','asistente')
    OR (v2.is_promotor() AND venta_id IN (SELECT id FROM v2.ventas WHERE promotor_id = auth.uid()))
    OR venta_id IN (SELECT v.id FROM v2.ventas v JOIN v2.clientes c ON c.id = v.cliente_id WHERE c.auth_user_id = auth.uid())
  );

-- ---------- DOCUMENTOS ----------
DROP POLICY IF EXISTS documentos_select ON v2.documentos;
CREATE POLICY documentos_select ON v2.documentos
  FOR SELECT TO authenticated
  USING (
    v2.is_admin() OR v2.is_auditor()
    OR v2.user_role() IN ('gerente','coordinador','supervisor','asistente')
    OR (v2.is_promotor() AND venta_id IN (SELECT id FROM v2.ventas WHERE promotor_id = auth.uid()))
    OR venta_id IN (SELECT v.id FROM v2.ventas v JOIN v2.clientes c ON c.id = v.cliente_id WHERE c.auth_user_id = auth.uid())
  );

-- ---------- CHECKLIST VENTA ----------
DROP POLICY IF EXISTS checklist_select ON v2.checklist_venta;
CREATE POLICY checklist_select ON v2.checklist_venta
  FOR SELECT TO authenticated
  USING (
    v2.is_admin() OR v2.is_auditor()
    OR v2.user_role() IN ('gerente','coordinador','supervisor','asistente')
    OR (v2.is_promotor() AND venta_id IN (SELECT id FROM v2.ventas WHERE promotor_id = auth.uid()))
    OR venta_id IN (SELECT v.id FROM v2.ventas v JOIN v2.clientes c ON c.id = v.cliente_id WHERE c.auth_user_id = auth.uid())
  );

-- ---------- VENTAS (refuerzo: promotor update solo las suyas) ----------
-- Ya existe ventas_update_staff que lo hace. Verificamos nada cambia.

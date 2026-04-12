-- ============================================================
-- HABITAD 2.0 — Romper recursión entre policies clientes ↔ ventas
-- ============================================================
-- Problema: clientes_select subquery ventas (promotor check),
-- y ventas_select subquery clientes (portal cliente check).
-- Postgres detecta recursión infinita.
--
-- Fix: funciones SECURITY DEFINER (owner postgres, bypasa RLS)
-- que rompen el ciclo al consultar la otra tabla sin pasar por RLS.
-- ============================================================

-- Helper: IDs de clientes vinculados al promotor actual vía ventas
CREATE OR REPLACE FUNCTION v2.clientes_de_promotor()
RETURNS SETOF uuid AS $$
  SELECT DISTINCT cliente_id FROM v2.ventas WHERE promotor_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: IDs de clientes donde auth_user_id = usuario actual (portal)
CREATE OR REPLACE FUNCTION v2.clientes_de_usuario()
RETURNS SETOF uuid AS $$
  SELECT id FROM v2.clientes WHERE auth_user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: IDs de ventas del cliente-usuario actual
CREATE OR REPLACE FUNCTION v2.ventas_de_cliente_usuario()
RETURNS SETOF uuid AS $$
  SELECT v.id FROM v2.ventas v
  WHERE v.cliente_id IN (SELECT id FROM v2.clientes WHERE auth_user_id = auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- -----------------------------------------------------------
-- CLIENTES: reemplazar policy (sin subquery directa a ventas)
-- -----------------------------------------------------------
DROP POLICY IF EXISTS clientes_select ON v2.clientes;
DROP POLICY IF EXISTS clientes_select_staff ON v2.clientes;
CREATE POLICY clientes_select ON v2.clientes
  FOR SELECT TO authenticated
  USING (
    v2.is_admin()
    OR v2.is_auditor()
    OR v2.user_role() IN ('gerente','coordinador','supervisor','asistente')
    OR (v2.is_promotor() AND (
        created_by = auth.uid()
        OR id IN (SELECT v2.clientes_de_promotor())
    ))
    OR auth_user_id = auth.uid()
  );

DROP POLICY IF EXISTS clientes_update ON v2.clientes;
DROP POLICY IF EXISTS clientes_update_staff ON v2.clientes;
CREATE POLICY clientes_update ON v2.clientes
  FOR UPDATE TO authenticated
  USING (
    v2.is_admin()
    OR v2.user_role() IN ('gerente','coordinador','supervisor','asistente')
    OR (v2.is_promotor() AND (
        created_by = auth.uid()
        OR id IN (SELECT v2.clientes_de_promotor())
    ))
  )
  WITH CHECK (
    v2.is_admin()
    OR v2.user_role() IN ('gerente','coordinador','supervisor','asistente')
    OR (v2.is_promotor() AND (
        created_by = auth.uid()
        OR id IN (SELECT v2.clientes_de_promotor())
    ))
  );

-- -----------------------------------------------------------
-- VENTAS: reemplazar subquery a clientes con función
-- -----------------------------------------------------------
DROP POLICY IF EXISTS ventas_select ON v2.ventas;
CREATE POLICY ventas_select ON v2.ventas
  FOR SELECT TO authenticated
  USING (
    v2.is_admin()
    OR v2.is_auditor()
    OR promotor_id = auth.uid()
    OR cliente_id IN (SELECT v2.clientes_de_usuario())
    OR v2.user_role() IN ('gerente','coordinador','supervisor','asistente')
  );

-- -----------------------------------------------------------
-- PAGOS: reemplazar join ventas↔clientes con función
-- -----------------------------------------------------------
DROP POLICY IF EXISTS pagos_select ON v2.pagos;
CREATE POLICY pagos_select ON v2.pagos
  FOR SELECT TO authenticated
  USING (
    v2.is_admin()
    OR v2.is_auditor()
    OR v2.user_role() IN ('gerente','coordinador','supervisor','asistente')
    OR (v2.is_promotor() AND venta_id IN (SELECT id FROM v2.ventas WHERE promotor_id = auth.uid()))
    OR venta_id IN (SELECT v2.ventas_de_cliente_usuario())
  );

-- -----------------------------------------------------------
-- CUOTAS: mismo patrón
-- -----------------------------------------------------------
DROP POLICY IF EXISTS cuotas_select ON v2.cuotas;
CREATE POLICY cuotas_select ON v2.cuotas
  FOR SELECT TO authenticated
  USING (
    v2.is_admin()
    OR v2.is_auditor()
    OR v2.user_role() IN ('gerente','coordinador','supervisor','asistente')
    OR (v2.is_promotor() AND venta_id IN (SELECT id FROM v2.ventas WHERE promotor_id = auth.uid()))
    OR venta_id IN (SELECT v2.ventas_de_cliente_usuario())
  );

-- -----------------------------------------------------------
-- SALDOS A FAVOR
-- -----------------------------------------------------------
DROP POLICY IF EXISTS saldos_select ON v2.saldos_favor;
CREATE POLICY saldos_select ON v2.saldos_favor
  FOR SELECT TO authenticated
  USING (
    v2.is_admin() OR v2.is_auditor()
    OR v2.user_role() IN ('gerente','coordinador','supervisor','asistente')
    OR (v2.is_promotor() AND venta_id IN (SELECT id FROM v2.ventas WHERE promotor_id = auth.uid()))
    OR venta_id IN (SELECT v2.ventas_de_cliente_usuario())
  );

-- -----------------------------------------------------------
-- DOCUMENTOS
-- -----------------------------------------------------------
DROP POLICY IF EXISTS documentos_select ON v2.documentos;
CREATE POLICY documentos_select ON v2.documentos
  FOR SELECT TO authenticated
  USING (
    v2.is_admin() OR v2.is_auditor()
    OR v2.user_role() IN ('gerente','coordinador','supervisor','asistente')
    OR (v2.is_promotor() AND venta_id IN (SELECT id FROM v2.ventas WHERE promotor_id = auth.uid()))
    OR venta_id IN (SELECT v2.ventas_de_cliente_usuario())
  );

-- -----------------------------------------------------------
-- CHECKLIST
-- -----------------------------------------------------------
DROP POLICY IF EXISTS checklist_select ON v2.checklist_venta;
CREATE POLICY checklist_select ON v2.checklist_venta
  FOR SELECT TO authenticated
  USING (
    v2.is_admin() OR v2.is_auditor()
    OR v2.user_role() IN ('gerente','coordinador','supervisor','asistente')
    OR (v2.is_promotor() AND venta_id IN (SELECT id FROM v2.ventas WHERE promotor_id = auth.uid()))
    OR venta_id IN (SELECT v2.ventas_de_cliente_usuario())
  );

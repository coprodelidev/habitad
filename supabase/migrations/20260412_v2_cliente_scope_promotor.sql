-- ============================================================
-- HABITAD 2.0 — Scope clientes por promotor (Opción A)
-- ============================================================
-- Antes: cualquier staff veía TODOS los clientes. El promotor
-- podía listar clientes creados por otros promotores.
--
-- Ahora: el promotor solo ve clientes que:
--   a) él creó (created_by = auth.uid()), O
--   b) tienen al menos una venta donde él es promotor_id
--
-- Roles de supervisión (gerente, coord, supervisor, asistente) siguen
-- viendo todos. Admin y auditor también.
--
-- Para evitar duplicados de DNI: función SECURITY DEFINER
-- buscar_cliente_por_dni que busca en TODA la tabla (bypassea RLS)
-- y devuelve solo el UUID. El promotor no ve los datos del cliente
-- de otro, solo sabe que el DNI ya existe y se vincula al existente.
-- ============================================================

-- 1) Función de búsqueda por DNI (SECURITY DEFINER → bypasa RLS)
CREATE OR REPLACE FUNCTION v2.buscar_cliente_por_dni(p_dni text)
RETURNS uuid AS $$
  SELECT id FROM v2.clientes WHERE dni = p_dni LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION v2.buscar_cliente_por_dni(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION v2.buscar_cliente_por_dni(text) TO authenticated;

-- 2) RLS SELECT: promotor solo ve sus clientes (por ventas o created_by)
DROP POLICY IF EXISTS clientes_select_staff ON v2.clientes;
CREATE POLICY clientes_select ON v2.clientes
  FOR SELECT TO authenticated
  USING (
    v2.is_admin()
    OR v2.is_auditor()
    OR v2.user_role() IN ('gerente','coordinador','supervisor','asistente')
    OR (v2.is_promotor() AND (
        created_by = auth.uid()
        OR id IN (SELECT cliente_id FROM v2.ventas WHERE promotor_id = auth.uid())
    ))
    OR auth_user_id = auth.uid()
  );

-- 3) RLS UPDATE: promotor solo edita clientes que él creó o tiene en ventas
DROP POLICY IF EXISTS clientes_update_staff ON v2.clientes;
CREATE POLICY clientes_update ON v2.clientes
  FOR UPDATE TO authenticated
  USING (
    v2.is_admin()
    OR v2.user_role() IN ('gerente','coordinador','supervisor','asistente')
    OR (v2.is_promotor() AND (
        created_by = auth.uid()
        OR id IN (SELECT cliente_id FROM v2.ventas WHERE promotor_id = auth.uid())
    ))
  )
  WITH CHECK (
    v2.is_admin()
    OR v2.user_role() IN ('gerente','coordinador','supervisor','asistente')
    OR (v2.is_promotor() AND (
        created_by = auth.uid()
        OR id IN (SELECT cliente_id FROM v2.ventas WHERE promotor_id = auth.uid())
    ))
  );

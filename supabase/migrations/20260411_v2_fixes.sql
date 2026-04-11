-- ============================================================
-- HABITAD 2.0 — Fixes post-despliegue
-- ============================================================
-- Problemas detectados tras el primer deploy:
--
-- 1) PostgREST no exponía el schema v2 → solucionado vía Management API
--    (db_schema = 'public,graphql_public,v2'). No hay SQL aquí.
--
-- 2) Las llamadas RPC del cliente iban al schema por defecto (public)
--    y las funciones viven en v2. Se corrigió el código cliente para
--    usar .schema('v2').rpc() — no requiere SQL.
--
-- 3) public.profiles RLS solo permitía a cada usuario ver/editar su
--    propio perfil. La pantalla /v2/admin/usuarios necesita listar y
--    editar TODOS los perfiles cuando el usuario es admin. Añadimos
--    policies adicionales (las multiples policies por cmd se OR-ean,
--    no reemplazan las existentes).
--
-- 4) Seguridad: revocamos EXECUTE de PUBLIC en funciones v2 y damos
--    solo a authenticated. El anon NO debería poder ejecutar nada.
-- ============================================================

-- -----------------------------------------------------------
-- (3) Admins pueden leer y editar todos los profiles
-- -----------------------------------------------------------
DROP POLICY IF EXISTS profiles_admin_select_all ON public.profiles;
CREATE POLICY profiles_admin_select_all ON public.profiles
  FOR SELECT TO authenticated
  USING (v2.is_admin());

DROP POLICY IF EXISTS profiles_admin_update_all ON public.profiles;
CREATE POLICY profiles_admin_update_all ON public.profiles
  FOR UPDATE TO authenticated
  USING (v2.is_admin())
  WITH CHECK (v2.is_admin());

-- -----------------------------------------------------------
-- (4) Revocar EXECUTE de PUBLIC y mantener solo para authenticated
--     en las funciones RPC-expuestas. Las funciones helper
--     (is_admin, is_staff, etc.) sí las mantenemos callables por
--     PUBLIC porque se invocan desde RLS policies y desde storage.
-- -----------------------------------------------------------
REVOKE EXECUTE ON FUNCTION v2.aplicar_pago_cuota(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION v2.liberar_separaciones_vencidas() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION v2.cancelar_iniciales_vencidas() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION v2.aplicar_pago_cuota(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION v2.liberar_separaciones_vencidas() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION v2.cancelar_iniciales_vencidas() TO authenticated, service_role;

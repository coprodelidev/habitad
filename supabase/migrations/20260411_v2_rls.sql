-- ============================================================
-- HABITAD 2.0 — Row Level Security (RLS) para schema v2
-- ============================================================
-- Estrategia:
--   * Todas las tablas de v2 tienen RLS habilitado.
--   * Helper v2.user_role() lee el role code del usuario actual
--     desde public.profiles + public.roles. Se marca STABLE.
--   * Los roles reconocidos en v2:
--        - administrador  → CRUD completo
--        - promotor       → operación sin borrar pagos
--        - auditor        → solo lectura
--        - cliente        → solo lectura limitada a sus ventas
-- ============================================================

CREATE OR REPLACE FUNCTION v2.user_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT r.code
  FROM public.profiles p
  LEFT JOIN public.roles r ON r.id = p.role_id
  WHERE p.id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION v2.is_admin()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT v2.user_role() IN ('administrador','gerente');
$$;

CREATE OR REPLACE FUNCTION v2.is_staff()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT v2.user_role() IN ('administrador','gerente','promotor','coordinador','supervisor','asistente');
$$;

CREATE OR REPLACE FUNCTION v2.is_promotor()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT v2.user_role() = 'promotor';
$$;

CREATE OR REPLACE FUNCTION v2.is_auditor()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT v2.user_role() = 'auditor';
$$;

CREATE OR REPLACE FUNCTION v2.is_cliente()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT v2.user_role() = 'cliente';
$$;

-- ------------------------------------------------------------
-- Enable RLS
-- ------------------------------------------------------------
ALTER TABLE v2.etapas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE v2.propiedades          ENABLE ROW LEVEL SECURITY;
ALTER TABLE v2.clientes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE v2.ventas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE v2.pagos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE v2.cuotas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE v2.saldos_favor         ENABLE ROW LEVEL SECURITY;
ALTER TABLE v2.documentos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE v2.checklist_venta      ENABLE ROW LEVEL SECURITY;
ALTER TABLE v2.tipo_cambio_sbs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE v2.parametros           ENABLE ROW LEVEL SECURITY;
ALTER TABLE v2.auditoria            ENABLE ROW LEVEL SECURITY;
ALTER TABLE v2.notificaciones       ENABLE ROW LEVEL SECURITY;
ALTER TABLE v2.reportes_bancarios   ENABLE ROW LEVEL SECURITY;
ALTER TABLE v2.reporte_bancario_filas ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- Limpiar policies previas si existen
-- ------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'v2'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- Etapas: todos los autenticados leen; staff escribe; admin borra
-- ------------------------------------------------------------
CREATE POLICY etapas_select_auth ON v2.etapas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY etapas_insert_staff ON v2.etapas
  FOR INSERT TO authenticated WITH CHECK (v2.is_staff());
CREATE POLICY etapas_update_admin ON v2.etapas
  FOR UPDATE TO authenticated USING (v2.is_admin()) WITH CHECK (v2.is_admin());
CREATE POLICY etapas_delete_admin ON v2.etapas
  FOR DELETE TO authenticated USING (v2.is_admin());

-- ------------------------------------------------------------
-- Propiedades: staff lee; admin gestiona; promotor solo lee
-- ------------------------------------------------------------
CREATE POLICY propiedades_select_auth ON v2.propiedades
  FOR SELECT TO authenticated USING (true);
CREATE POLICY propiedades_insert_admin ON v2.propiedades
  FOR INSERT TO authenticated WITH CHECK (v2.is_admin());
CREATE POLICY propiedades_update_admin ON v2.propiedades
  FOR UPDATE TO authenticated USING (v2.is_admin()) WITH CHECK (v2.is_admin());
CREATE POLICY propiedades_delete_admin ON v2.propiedades
  FOR DELETE TO authenticated USING (v2.is_admin());

-- ------------------------------------------------------------
-- Clientes: staff lee/crea/edita; admin borra; cliente ve sólo el suyo
-- ------------------------------------------------------------
CREATE POLICY clientes_select_staff ON v2.clientes
  FOR SELECT TO authenticated
  USING (v2.is_staff() OR v2.is_auditor() OR auth_user_id = auth.uid());
CREATE POLICY clientes_insert_staff ON v2.clientes
  FOR INSERT TO authenticated WITH CHECK (v2.is_staff());
CREATE POLICY clientes_update_staff ON v2.clientes
  FOR UPDATE TO authenticated
  USING (v2.is_staff())
  WITH CHECK (v2.is_staff());
CREATE POLICY clientes_delete_admin ON v2.clientes
  FOR DELETE TO authenticated USING (v2.is_admin());

-- ------------------------------------------------------------
-- Ventas: staff ve todo; promotor ve las suyas; cliente ve las suyas
-- ------------------------------------------------------------
CREATE POLICY ventas_select ON v2.ventas
  FOR SELECT TO authenticated
  USING (
    v2.is_admin()
    OR v2.is_auditor()
    OR promotor_id = auth.uid()
    OR cliente_id IN (SELECT id FROM v2.clientes WHERE auth_user_id = auth.uid())
    OR v2.user_role() IN ('gerente','coordinador','supervisor','asistente')
  );
CREATE POLICY ventas_insert_staff ON v2.ventas
  FOR INSERT TO authenticated WITH CHECK (v2.is_staff());
CREATE POLICY ventas_update_staff ON v2.ventas
  FOR UPDATE TO authenticated
  USING (v2.is_admin() OR (v2.is_promotor() AND promotor_id = auth.uid()) OR v2.user_role() IN ('gerente','coordinador','supervisor'))
  WITH CHECK (v2.is_admin() OR (v2.is_promotor() AND promotor_id = auth.uid()) OR v2.user_role() IN ('gerente','coordinador','supervisor'));
CREATE POLICY ventas_delete_admin ON v2.ventas
  FOR DELETE TO authenticated USING (v2.is_admin());

-- ------------------------------------------------------------
-- Pagos: staff registra, solo admin edita/borra
-- ------------------------------------------------------------
CREATE POLICY pagos_select ON v2.pagos
  FOR SELECT TO authenticated
  USING (
    v2.is_admin() OR v2.is_auditor() OR v2.is_staff()
    OR venta_id IN (SELECT v.id FROM v2.ventas v JOIN v2.clientes c ON c.id = v.cliente_id WHERE c.auth_user_id = auth.uid())
  );
CREATE POLICY pagos_insert_staff ON v2.pagos
  FOR INSERT TO authenticated WITH CHECK (v2.is_staff());
CREATE POLICY pagos_update_admin ON v2.pagos
  FOR UPDATE TO authenticated USING (v2.is_admin()) WITH CHECK (v2.is_admin());
CREATE POLICY pagos_delete_admin ON v2.pagos
  FOR DELETE TO authenticated USING (v2.is_admin());

-- ------------------------------------------------------------
-- Cuotas: staff ve; admin edita
-- ------------------------------------------------------------
CREATE POLICY cuotas_select ON v2.cuotas
  FOR SELECT TO authenticated
  USING (
    v2.is_admin() OR v2.is_auditor() OR v2.is_staff()
    OR venta_id IN (SELECT v.id FROM v2.ventas v JOIN v2.clientes c ON c.id = v.cliente_id WHERE c.auth_user_id = auth.uid())
  );
CREATE POLICY cuotas_write_staff ON v2.cuotas
  FOR INSERT TO authenticated WITH CHECK (v2.is_staff());
CREATE POLICY cuotas_update_staff ON v2.cuotas
  FOR UPDATE TO authenticated USING (v2.is_staff()) WITH CHECK (v2.is_staff());
CREATE POLICY cuotas_delete_admin ON v2.cuotas
  FOR DELETE TO authenticated USING (v2.is_admin());

-- ------------------------------------------------------------
-- Saldos a favor: igual que pagos
-- ------------------------------------------------------------
CREATE POLICY saldos_select ON v2.saldos_favor
  FOR SELECT TO authenticated
  USING (v2.is_admin() OR v2.is_auditor() OR v2.is_staff()
    OR venta_id IN (SELECT v.id FROM v2.ventas v JOIN v2.clientes c ON c.id = v.cliente_id WHERE c.auth_user_id = auth.uid()));
CREATE POLICY saldos_write_staff ON v2.saldos_favor
  FOR INSERT TO authenticated WITH CHECK (v2.is_staff());
CREATE POLICY saldos_update_admin ON v2.saldos_favor
  FOR UPDATE TO authenticated USING (v2.is_admin()) WITH CHECK (v2.is_admin());
CREATE POLICY saldos_delete_admin ON v2.saldos_favor
  FOR DELETE TO authenticated USING (v2.is_admin());

-- ------------------------------------------------------------
-- Documentos: staff ve y crea; admin borra; cliente ve sus propios
-- ------------------------------------------------------------
CREATE POLICY documentos_select ON v2.documentos
  FOR SELECT TO authenticated
  USING (v2.is_admin() OR v2.is_auditor() OR v2.is_staff()
    OR venta_id IN (SELECT v.id FROM v2.ventas v JOIN v2.clientes c ON c.id = v.cliente_id WHERE c.auth_user_id = auth.uid()));
CREATE POLICY documentos_insert_staff ON v2.documentos
  FOR INSERT TO authenticated WITH CHECK (v2.is_staff());
CREATE POLICY documentos_update_staff ON v2.documentos
  FOR UPDATE TO authenticated USING (v2.is_staff()) WITH CHECK (v2.is_staff());
CREATE POLICY documentos_delete_admin ON v2.documentos
  FOR DELETE TO authenticated USING (v2.is_admin());

-- ------------------------------------------------------------
-- Checklist: staff
-- ------------------------------------------------------------
CREATE POLICY checklist_select ON v2.checklist_venta
  FOR SELECT TO authenticated
  USING (v2.is_admin() OR v2.is_auditor() OR v2.is_staff()
    OR venta_id IN (SELECT v.id FROM v2.ventas v JOIN v2.clientes c ON c.id = v.cliente_id WHERE c.auth_user_id = auth.uid()));
CREATE POLICY checklist_write_staff ON v2.checklist_venta
  FOR INSERT TO authenticated WITH CHECK (v2.is_staff());
CREATE POLICY checklist_update_staff ON v2.checklist_venta
  FOR UPDATE TO authenticated USING (v2.is_staff()) WITH CHECK (v2.is_staff());
CREATE POLICY checklist_delete_admin ON v2.checklist_venta
  FOR DELETE TO authenticated USING (v2.is_admin());

-- ------------------------------------------------------------
-- Tipo de cambio SBS: lectura pública autenticada; sólo admin escribe
-- ------------------------------------------------------------
CREATE POLICY tc_select_auth ON v2.tipo_cambio_sbs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY tc_write_admin ON v2.tipo_cambio_sbs
  FOR INSERT TO authenticated WITH CHECK (v2.is_admin());
CREATE POLICY tc_update_admin ON v2.tipo_cambio_sbs
  FOR UPDATE TO authenticated USING (v2.is_admin()) WITH CHECK (v2.is_admin());

-- ------------------------------------------------------------
-- Parámetros: lectura staff; escritura admin
-- ------------------------------------------------------------
CREATE POLICY params_select_staff ON v2.parametros
  FOR SELECT TO authenticated USING (v2.is_staff() OR v2.is_auditor());
CREATE POLICY params_write_admin ON v2.parametros
  FOR INSERT TO authenticated WITH CHECK (v2.is_admin());
CREATE POLICY params_update_admin ON v2.parametros
  FOR UPDATE TO authenticated USING (v2.is_admin()) WITH CHECK (v2.is_admin());
CREATE POLICY params_delete_admin ON v2.parametros
  FOR DELETE TO authenticated USING (v2.is_admin());

-- ------------------------------------------------------------
-- Auditoría: solo admin y auditor pueden leer; inserts vienen de triggers SECURITY DEFINER
-- ------------------------------------------------------------
CREATE POLICY audit_select_admin ON v2.auditoria
  FOR SELECT TO authenticated USING (v2.is_admin() OR v2.is_auditor());

-- ------------------------------------------------------------
-- Notificaciones: el usuario sólo ve las suyas
-- ------------------------------------------------------------
CREATE POLICY notif_select_own ON v2.notificaciones
  FOR SELECT TO authenticated USING (usuario_id = auth.uid() OR v2.is_admin());
CREATE POLICY notif_update_own ON v2.notificaciones
  FOR UPDATE TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());
CREATE POLICY notif_insert_staff ON v2.notificaciones
  FOR INSERT TO authenticated WITH CHECK (v2.is_staff());

-- ------------------------------------------------------------
-- Reportes bancarios: solo admin/gerente
-- ------------------------------------------------------------
CREATE POLICY rb_select_admin ON v2.reportes_bancarios
  FOR SELECT TO authenticated USING (v2.is_admin() OR v2.is_auditor());
CREATE POLICY rb_write_admin ON v2.reportes_bancarios
  FOR INSERT TO authenticated WITH CHECK (v2.is_admin());
CREATE POLICY rb_update_admin ON v2.reportes_bancarios
  FOR UPDATE TO authenticated USING (v2.is_admin()) WITH CHECK (v2.is_admin());
CREATE POLICY rb_delete_admin ON v2.reportes_bancarios
  FOR DELETE TO authenticated USING (v2.is_admin());

CREATE POLICY rbf_select_admin ON v2.reporte_bancario_filas
  FOR SELECT TO authenticated USING (v2.is_admin() OR v2.is_auditor());
CREATE POLICY rbf_write_admin ON v2.reporte_bancario_filas
  FOR INSERT TO authenticated WITH CHECK (v2.is_admin());
CREATE POLICY rbf_update_admin ON v2.reporte_bancario_filas
  FOR UPDATE TO authenticated USING (v2.is_admin()) WITH CHECK (v2.is_admin());
CREATE POLICY rbf_delete_admin ON v2.reporte_bancario_filas
  FOR DELETE TO authenticated USING (v2.is_admin());

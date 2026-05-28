-- ============================================================
-- HABITAD 2.0 — Purga de seeds demo (C001-C025 + C848 + T100)
-- Fecha: 2026-05-28
-- ============================================================
-- Antes de importar el CUH operativo real (CMR 26-05-2026)
-- limpiamos los 27 props demo y todas sus dependencias.
-- Backup local previo en temporal/backups/20260528_v2_*.json.
-- ============================================================

BEGIN;

TRUNCATE
  v2.notificaciones,
  v2.saldos_favor,
  v2.documentos,
  v2.checklist_venta,
  v2.pagos,
  v2.cuotas,
  v2.ventas,
  v2.clientes,
  v2.propiedades
RESTART IDENTITY CASCADE;

DELETE FROM v2.etapas WHERE codigo = 'etapa-1' OR nombre ILIKE 'Etapa 1';

COMMIT;

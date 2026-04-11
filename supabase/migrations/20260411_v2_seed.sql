-- ============================================================
-- HABITAD 2.0 — Seed de parámetros y datos base
-- ============================================================

INSERT INTO v2.parametros (clave, valor, descripcion) VALUES
  ('separacion_horas',        '24',                           'Horas de validez de una separación antes de liberarse'),
  ('inicial_meses',           '3',                            'Meses máximos para completar la inicial'),
  ('moneda_base',             '"USD"',                        'Moneda base por defecto para nuevas propiedades'),
  ('bancos_permitidos',       '["BCP","BBVA","Interbank","Scotiabank","BanBif","Pichincha","Mibanco"]', 'Lista de bancos válidos para vouchers'),
  ('plantilla_contrato',      '{"version":1,"cabecera":"COPRODELI","clausulas":[]}', 'Plantilla base del contrato'),
  ('plantilla_separacion',    '{"version":1,"cabecera":"COPRODELI"}', 'Plantilla base de hoja de separación'),
  ('sbs_source',              '"manual"',                     'Fuente del tipo de cambio SBS (manual|api|scrape)'),
  ('notif_recordatorio_cuota_dias', '3',                      'Días previos al vencimiento de cuota para notificar')
ON CONFLICT (clave) DO NOTHING;

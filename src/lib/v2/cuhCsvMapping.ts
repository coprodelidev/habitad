// Mapping entre las 123 columnas del XLSX operativo
// "CUH SAN FERNANDO 2026 CMR" y la tabla v2.import_cuh_staging.
//
// El XLSX tiene 4 filas de leyenda/agrupadores (0-3) y los headers reales
// en la fila índice 4. Los datos arrancan en la fila índice 5.

export const HEADER_ROW_INDEX = 4;
export const DATA_FIRST_ROW = 5;

// Mapeo posicional: índice de columna en la hoja "unificado" → columna en staging.
// Solo declaramos las columnas que vamos a usar (las demás van a raw_row).
export const COLUMN_MAP: Array<[number, string]> = [
  [0, 'codigo_sap_ubicacion'],
  [2, 'etapa_codigo'],
  [3, 'cuh'],
  [4, 'declaratoria_tipo'],
  [5, 'precio_cuh'],
  [6, 'partida_registral'],
  [7, 'mz'],
  [8, 'lt'],
  [9, 'esq_parq'],
  [10, 'area_lote'],
  [11, 'precio_contrato_cuota_moneda'],
  [12, 'tc'],
  [13, 'precio_promotor_soles'],
  [14, 'precio_promotor_dolar'],
  [15, 'valor_adicional_cv'],
  [16, 'abonos_cv'],
  [17, 'por_pagar_cv'],
  [18, 'precio_promotor_final'],
  [19, 'concepto'],
  [20, 'promotor_csv'],
  [21, 'dni'],
  [22, 'apellido_paterno'],
  [23, 'apellido_materno'],
  [24, 'primer_nombre'],
  [25, 'segundo_nombre'],
  [26, 'direccion'],
  [27, 'ubigeo_cod'],
  [28, 'distrito'],
  [29, 'provincia'],
  [30, 'departamento'],
  [31, 'urbanizacion'],
  [32, 'celular'],
  [33, 'correo'],
  [34, 'abonos_total_29022024'],
  [35, 'abonos_total_31032025'],
  [36, 'bono_fmv_promotor'],
  [37, 'fecha_ch'],
  [38, 'ch'],
  [39, 'saldo_pagar'],
  [40, 'fecha_desemb_bono'],
  [41, 'bono_fmv_real'],
  [42, 'abono_cliente_fmv'],
  [43, 'donacion_coprodeli'],
  [44, 'gastos_administrativos'],
  [45, 'saldo_cuh'],
  [46, 'saldo_a_financiar'],
  [47, 'cuota_pagada_31122024'],
  [48, 'total_pagado_recaudacion'],
  [49, 'saldo_pendiente'],
  [50, 'ultimo_mes_pagado'],
  [51, 'fecha_separacion'],
  [52, 'mes_inicial'],
  [53, 'fecha_contrato'],
  [54, 'recaudacion'],
  [55, 'mes_recaud_inicio'],
  [56, 'mes_termino_recaud'],
  [57, 'valor_cuota'],
  [58, 'num_cuotas'],
  [59, 'moneda_estado'],
  [60, 'observaciones_contrato'],
  [61, 'observaciones_sap'],
  [62, 'verificacion_fmv'],
  [63, 'carta_fianza'],
  [64, 'firmo_cliente'],
  [65, 'firmo_coprodeli'],
  [66, 'inscrito_rrpp'],
  [67, 'acta_conformidad'],
  [68, 'testimonio'],
  [69, 'descargar_municipalidad'],
  [70, 'situacion_entrega'],
  [71, 'fecha_ingreso_fmv'],
  [72, 'fecha_liberacion_cf'],
  [73, 'observacion'],
  [74, 'observaciones_yessenia'],
  [75, 'fecha_beneficiario'],
  [76, 'fecha_caducidad'],
  [77, 'comision_2pct'],
  [78, 'avance'],
  [79, 'comision_total'],
  [121, 'total_al_2024'],
  [122, 'total_general'],
  [123, 'ultimo_pago'],
];

// Columnas de abonos individuales (cols 89-120) — van a abonos_detalle jsonb.
export const ABONO_COL_FIRST = 89;
export const ABONO_COL_LAST = 120;

// Etapas válidas del CUH operativo (1-21). Otras quedan en warning.
export const VALID_ETAPAS = new Set<string>(
  Array.from({ length: 21 }, (_, i) => String(i + 1))
);

// Marcadores que NO son promotor real (significa propiedad libre / bloqueada).
export function isPlaceholderPromotor(raw: string | null | undefined): boolean {
  if (!raw) return true;
  const s = String(raw).trim().toUpperCase();
  if (!s) return true;
  if (s === 'BLOQUEADO') return true;
  if (s.startsWith('CASA LIBRE')) return true;
  if (s.startsWith('TERRENO') && s.includes('LIBRE')) return true;
  return false;
}

// Limpia números peruanos con espacios y separadores. Mantiene null si vacío o "-".
export function cleanNumberCell(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s || s === '-' || s.toUpperCase() === 'BLOQUEADO') return null;
  return s;
}

// Normaliza un valor de celda a string-trimmed o null.
export function cleanCell(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return String(v);
  const s = String(v).trim();
  return s ? s : null;
}

export type StagingRow = Record<string, string | null | object>;

// Convierte una fila del XLSX (array de celdas) a un objeto staging.
export function rowToStaging(row: unknown[], rowNum: number): StagingRow {
  const out: StagingRow = { row_num: String(rowNum) as any };
  for (const [idx, field] of COLUMN_MAP) {
    out[field] = cleanCell(row[idx]);
  }

  // Abonos individuales como array.
  const abonos: Array<{ idx: number; value: string }> = [];
  for (let i = ABONO_COL_FIRST; i <= ABONO_COL_LAST; i++) {
    const v = cleanCell(row[i]);
    if (v) abonos.push({ idx: i - ABONO_COL_FIRST + 1, value: v });
  }
  out.abonos_detalle = abonos;

  // Raw row para debug — solo guardamos índices con valor.
  const raw: Record<string, string> = {};
  for (let i = 0; i < row.length; i++) {
    const v = cleanCell(row[i]);
    if (v) raw[String(i)] = v;
  }
  out.raw_row = raw;

  return out;
}

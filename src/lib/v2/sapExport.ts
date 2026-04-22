type Nullable<T> = T | null | undefined;

export interface SapPromotorProfile {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  sap_sales_person_code?: number | null;
}

export interface SapVentaLike {
  id: string;
  estado?: string | null;
  precio_acordado?: number | null;
  moneda?: 'PEN' | 'USD' | string | null;
  fecha_separacion?: string | null;
  fecha_inicial_completa?: string | null;
  fecha_contrato?: string | null;
  promotor_id?: string | null;
  meses_cuotas?: number | null;
  monto_inicial_objetivo?: number | null;
  propiedad?: {
    cuh?: string | null;
    tipo?: 'casa' | 'terreno' | string | null;
    modelo?: string | null;
    manzana?: string | null;
    lote?: string | null;
    area_m2?: number | null;
    moneda?: 'PEN' | 'USD' | string | null;
    etapa?: { codigo?: string | null; nombre?: string | null } | null;
    adicionales?: Record<string, unknown> | null;
  } | null;
  cliente?: {
    nombres?: string | null;
    apellidos?: string | null;
    segundo_nombre?: string | null;
    apellido_paterno?: string | null;
    apellido_materno?: string | null;
    dni?: string | null;
    telefono?: string | null;
    email?: string | null;
    direccion?: string | null;
    ubigeo?: string | null;
    ubigeo_code?: string | null;
    ubigeo_cod?: string | null;
    distrito?: string | null;
    provincia?: string | null;
    departamento?: string | null;
    urbanizacion?: string | null;
    // Dirección estructurada (Fase A)
    tipo_via?: string | null;
    zona_nombre?: string | null;
    direccion_mz?: string | null;
    direccion_lt?: string | null;
    numero_puerta?: string | null;
    interior?: string | null;
    referencia?: string | null;
  } | null;
  cuotas?: Array<{
    numero?: number | null;
    fecha_vencimiento?: string | null;
    monto?: number | null;
    estado?: string | null;
  }> | null;
  pagos?: Array<{
    tipo?: string | null;
    fecha_deposito?: string | null;
    monto?: number | null;
    moneda?: string | null;
    tc_sbs?: number | null;
    estado?: string | null;
  }> | null;
}

const MAESTRO_HEADERS = [
  'CardCode', 'CardName', 'CardType', 'GroupCode', 'GroupNum', 'LicTradNum', 'Currency', 'DebPayAcct',
  'DpmClear', 'DpmIntAct', 'WTLiable', 'SalesPersonCode', 'Cellular', 'E_Mail', 'validFor', 'U_SYP_BPTP',
  'U_SYP_BPTD', 'U_SYP_BPAP', 'U_SYP_BPAM', 'U_SYP_BPNO', 'U_SYP_BPN2', 'Notes', '',
  'CardCode', 'LineNum', 'AdresType', 'Address', 'Street', 'ZipCode', 'Block', 'City', 'County',
  'U_SYP_URBANIZA', 'Country',
];

const ORDEN_HEADERS = [
  'DocNum', 'CardCode', 'DocType', 'ControlAccount', 'TaxDate', 'DocDueDate', 'DocDate', 'DocCurrency', 'DocRate', 'DocTotal',
  'U_SYP_MDTD', 'U_SYP_MDSD', 'U_SYP_MDCD', 'NumAtCard', 'JournalMemo', 'SalesPersonCode', 'PaymentGroupCode', 'Series',
  'U_SYP_MDMT', 'U_SYP_STATUS', 'U_SYP_VAPROMOTOR', 'U_SYP_VAEXPEDIENTE', 'U_SYP_VACOPROVIDIG', 'U_SYP_VACOPRODELI',
  'U_SYP_VAGASTOSADM', 'U_SYP_SEPARA', 'U_SYP_FESEPARAINI', 'U_SYP_FEINICIAL', 'U_SYP_CUINICIAL', 'U_SYP_PRECONT',
  'U_SYP_FERECAINI', 'U_SYP_FERECAFIN', 'U_SYP_VACUOTA', 'U_SYP_NROCUOTAS', 'U_SYP_OBS_VENTAS', 'U_SYP_SITUACION',
  'U_SYP_EXPED', 'U_SYP_FINGEXP', 'U_SYP_FBENEF', 'U_SYP_FCADUC', 'U_SYP_COM1', 'U_SYP_COM2', 'U_SYP_COM3', 'U_SYP_COM4',
  'U_SYP_COM5', 'U_SYP_LICF', 'U_SYP_CARTAF', 'U_SYP_VALORCF', 'U_SYP_FEINICF', 'U_SYP_FEFINCF', 'FERENCF', 'U_SYP_INFMV',
  'U_SYP_VALORBONO', 'U_SYP_AHORRO', 'U_SYP_CREDHIPO', 'U_SYP_DONACION', 'U_SYP_GASTOSDMIN', 'U_SYP_COGRUPO',
  'U_SYP_PROGRAMA', 'U_SYP_CCCENCO', 'U_SYP_CCFINAN', 'U_SYP_CCPARTIDA', 'U_SYP_CCSUBPARTIDA', 'U_SYP_HBCUONUM',
  'U_SYP_CUOFALTA', 'U_SYP_VACUNICIAL', 'U_SYP_HBCUOVEN', 'U_SYP_HBCUOIMP', 'U_SYP_HBCUOMOR', 'U_SYP_HBVALFMV',
  'Comments', '', 'ParentKey', 'LineNum', 'ItemCode', 'ItemDescription', 'WarehouseCode', 'Quantity', 'Price', 'LineTotal',
  'TaxCode', 'VatGroup', 'AccountCode', 'CostingCode', 'CostingCode2', 'CostingCode3', 'CostingCode4', 'CostingCode5', 'ProjectCode',
];

const ORDEN_HEADER_INDEX = Object.fromEntries(ORDEN_HEADERS.map((h, i) => [h, i]));

const SEPARACION_HEADERS = [
  'tipo_formato', 'fecha_separacion', 'estado_venta', 'nombres_titular', 'apellidos_titular', 'dni_titular',
  'celular_titular', 'email_titular', 'estado_civil_titular', 'grado_estudio_titular', 'fecha_nacimiento_titular',
  'ubigeo', 'distrito', 'provincia', 'departamento', 'domicilio', 'ocupacion_titular', 'centro_trabajo_titular',
  'posee_otro_bien', 'referencia1_nombre', 'referencia1_email', 'referencia1_celular', 'referencia2_nombre',
  'referencia2_email', 'referencia2_celular', 'valor_unidad', 'monto_separacion', 'monto_inicial_objetivo',
  'saldo_financiar', 'manzana', 'lote', 'etapa', 'area_m2', 'tipo_ubicacion', 'promotor_nombre',
  'promotor_codigo_sap', 'observacion',
];

function normalizeDigits(v: Nullable<string>, max = 999): string {
  if (!v) return '';
  return String(v).replace(/\D/g, '').slice(0, max);
}

function splitNameParts(nombres: Nullable<string>, apellidos: Nullable<string>) {
  const names = String(nombres ?? '').trim().split(/\s+/).filter(Boolean);
  const lasts = String(apellidos ?? '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: names[0] ?? '',
    secondName: names.slice(1).join(' '),
    lastName1: lasts[0] ?? '',
    lastName2: lasts.slice(1).join(' '),
    fullName: [String(apellidos ?? '').trim(), String(nombres ?? '').trim()].filter(Boolean).join(' '),
  };
}

function formatYmd(v: Nullable<string | Date>): string {
  if (!v) return '';
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

function addYears(v: Nullable<string>, years: number): string {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  d.setFullYear(d.getFullYear() + years);
  return formatYmd(d);
}

function getDocCurrency(moneda: Nullable<string>): string {
  return moneda === 'USD' ? 'US$' : 'S/';
}

function getDebitorAccount(tipo: Nullable<string>, moneda: Nullable<string>): number {
  if (tipo === 'casa' && moneda === 'USD') return 12122162;
  if (tipo === 'terreno' && moneda === 'USD') return 12122161;
  if (tipo === 'terreno') return 12121164;
  return 12121165;
}

function getGrupoIntegrante(tipo: Nullable<string>, moneda: Nullable<string>): string {
  if (tipo === 'casa' && moneda === 'USD') return '0012';
  if (tipo === 'terreno' && moneda === 'USD') return '0030';
  if (tipo === 'terreno') return '0031';
  return '0013';
}

function getPartida(tipo: Nullable<string>): string {
  return tipo === 'terreno' ? '24' : '25';
}

function getSubpartida(tipo: Nullable<string>): string {
  return tipo === 'terreno' ? '60424703' : '60425701';
}

function getTaxCode(tipo: Nullable<string>): string {
  return tipo === 'terreno' ? 'EXO_TERR' : 'EXO_CASA';
}

function getAccountCodeLine(tipo: Nullable<string>): number {
  return tipo === 'terreno' ? 70221102 : 70221104;
}

function getTipoNota(tipo: Nullable<string>): string {
  return tipo === 'terreno' ? 'URB-SF-T' : 'URB-SF-C';
}

function getSituacion(estado: Nullable<string>): string {
  if (estado === 'separacion') return 'OK-SEPARACION';
  if (estado === 'inicial') return 'OK-INICIAL';
  if (estado === 'cuotas') return 'OK-REC-BIF';
  if (estado === 'entregada') return 'CANCELADO';
  if (estado === 'cancelada') return 'CANCELADO';
  return '';
}

function sumByTipo(venta: SapVentaLike, tipo: string): number {
  const pagos = venta.pagos ?? [];
  return pagos
    .filter((p) => p?.tipo === tipo && p?.estado !== 'anulado')
    .reduce((acc, p) => acc + Number(p?.monto ?? 0), 0);
}

function firstPagoDateByTipo(venta: SapVentaLike, tipo: string): string {
  const pagos = (venta.pagos ?? [])
    .filter((p) => p?.tipo === tipo && p?.estado !== 'anulado' && p?.fecha_deposito)
    .map((p) => String(p.fecha_deposito))
    .sort();
  return pagos[0] ?? '';
}

function sortedCuotas(venta: SapVentaLike) {
  return [...(venta.cuotas ?? [])]
    .filter((c) => !!c)
    .sort((a, b) => Number(a?.numero ?? 0) - Number(b?.numero ?? 0));
}

function getPromotorMap(profiles: SapPromotorProfile[]): Record<string, SapPromotorProfile> {
  const map: Record<string, SapPromotorProfile> = {};
  for (const p of profiles) {
    if (!p?.id) continue;
    map[p.id] = p;
  }
  return map;
}

function getPromotorData(venta: SapVentaLike, byId: Record<string, SapPromotorProfile>) {
  const p = venta.promotor_id ? byId[venta.promotor_id] : undefined;
  return {
    code: p?.sap_sales_person_code ?? '',
    name: [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim(),
  };
}

function setOrdenValue(row: unknown[], key: string, value: unknown) {
  const idx = ORDEN_HEADER_INDEX[key];
  if (idx === undefined) return;
  row[idx] = value ?? '';
}

function buildItemDescription(venta: SapVentaLike): string {
  const modelo = String(venta.propiedad?.modelo ?? '').trim();
  const mz = String(venta.propiedad?.manzana ?? '').trim();
  const lt = String(venta.propiedad?.lote ?? '').trim();
  const parts = [modelo, mz ? `MZ ${mz}` : '', lt ? `LT ${lt}` : ''].filter(Boolean);
  return parts.join(' ').trim() || String(venta.propiedad?.cuh ?? '').trim();
}

function parseOptionalNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v !== 'string') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function safeAdditional(venta: SapVentaLike, key: string): unknown {
  return venta.propiedad?.adicionales?.[key];
}

function buildCardCode(dni: string): string {
  return `C${dni.slice(0, 8).padStart(8, '0')}`;
}

// Concatena los campos estructurados de dirección al formato que SAP espera en Street
function buildSapStreet(c: SapVentaLike['cliente']): string {
  if (!c) return '';
  const parts: string[] = [];
  if (c.tipo_via && c.zona_nombre) parts.push(`${c.tipo_via} ${c.zona_nombre}`);
  else if (c.zona_nombre) parts.push(String(c.zona_nombre));
  if (c.direccion_mz) parts.push(`Mz ${c.direccion_mz}`);
  if (c.direccion_lt) parts.push(`Lt ${c.direccion_lt}`);
  if (c.numero_puerta) parts.push(`Nº ${c.numero_puerta}`);
  if (c.interior) parts.push(`Int ${c.interior}`);
  const joined = parts.join(' - ').trim();
  return joined || String(c.direccion ?? '').trim();
}

function ubigeoCode(c: SapVentaLike['cliente']): string {
  return String(c?.ubigeo_cod ?? c?.ubigeo_code ?? c?.ubigeo ?? '').trim();
}

export function buildMaestroClientesAoa(ventas: SapVentaLike[], promotores: SapPromotorProfile[]) {
  const byPromotor = getPromotorMap(promotores);
  const rows: unknown[][] = [MAESTRO_HEADERS];
  const seen = new Set<string>();

  for (const venta of ventas) {
    const dni = normalizeDigits(venta.cliente?.dni, 8);
    if (!dni || seen.has(dni)) continue;
    seen.add(dni);

    const cardCode = buildCardCode(dni);
    const cardName = splitNameParts(venta.cliente?.nombres, venta.cliente?.apellidos).fullName;
    const names = splitNameParts(venta.cliente?.nombres, venta.cliente?.apellidos);
    const promotor = getPromotorData(venta, byPromotor);
    const tipo = venta.propiedad?.tipo ?? 'casa';
    const moneda = venta.moneda ?? venta.propiedad?.moneda ?? 'PEN';
    const debitorAccount = getDebitorAccount(tipo, moneda);
    const ubigeo = ubigeoCode(venta.cliente);
    const distrito = String(venta.cliente?.distrito ?? '').trim();
    const provincia = String(venta.cliente?.provincia ?? '').trim();
    const departamento = String(venta.cliente?.departamento ?? '').trim();
    const urbanizacion = String(venta.cliente?.urbanizacion ?? '').trim();
    const street = buildSapStreet(venta.cliente);

    rows.push([
      cardCode,
      cardName,
      'C',
      100,
      -1,
      dni,
      '##',
      debitorAccount,
      12213102,
      12213101,
      'N',
      promotor.code,
      normalizeDigits(venta.cliente?.telefono, 20),
      String(venta.cliente?.email ?? '').trim(),
      'Y',
      'TPN',
      1,
      names.lastName1,
      names.lastName2,
      names.firstName,
      names.secondName,
      getTipoNota(tipo),
      '',
      cardCode,
      0,
      'bo_BillTo',
      'FISCAL',
      street,
      ubigeo,
      distrito,
      provincia,
      departamento,
      urbanizacion,
      'PE',
    ]);
  }

  return rows;
}

export function buildCodPromotorAoa(promotores: SapPromotorProfile[]) {
  const rows: unknown[][] = [
    ['Codigo del empleado del departamento de ventas', 'Nombre de empleado del departamento de ventas'],
    [-1, '-Ningun empleado del departamento de ventas-'],
  ];

  const sorted = [...promotores]
    .filter((p) => p.sap_sales_person_code != null)
    .sort((a, b) => Number(a.sap_sales_person_code) - Number(b.sap_sales_person_code));

  for (const p of sorted) {
    rows.push([p.sap_sales_person_code, [p.first_name, p.last_name].filter(Boolean).join(' ').trim()]);
  }
  return rows;
}

export function buildOrdenesVentaAoa(ventas: SapVentaLike[], promotores: SapPromotorProfile[]) {
  const byPromotor = getPromotorMap(promotores);
  const rows: unknown[][] = [ORDEN_HEADERS];

  ventas.forEach((venta, idx) => {
    const row = new Array(ORDEN_HEADERS.length).fill('');
    const dni = normalizeDigits(venta.cliente?.dni, 8);
    const cardCode = dni ? buildCardCode(dni) : '';
    const tipo = venta.propiedad?.tipo ?? 'casa';
    const moneda = (venta.moneda ?? 'PEN') as string;
    const promotor = getPromotorData(venta, byPromotor);
    const cuotas = sortedCuotas(venta);
    const cuotasCount = venta.meses_cuotas ?? cuotas.length ?? 0;
    const cuotasFaltantes = cuotas.filter((c) => c.estado !== 'pagada').length;
    const cuotaMonto = Number(cuotas[0]?.monto ?? 0);
    const fechaSep = formatYmd(venta.fecha_separacion);
    const fechaInicial = formatYmd(venta.fecha_inicial_completa ?? firstPagoDateByTipo(venta, 'inicial'));
    const fechaPrimeraCuota = formatYmd(cuotas[0]?.fecha_vencimiento ?? null);
    const fechaUltimaCuota = formatYmd(cuotas[cuotas.length - 1]?.fecha_vencimiento ?? null);
    const separacionMonto = sumByTipo(venta, 'separacion');
    const inicialPagada = sumByTipo(venta, 'inicial');
    const docTotal = Number(venta.precio_acordado ?? 0);
    const itemCode = String(safeAdditional(venta, 'sap_item_code') ?? venta.propiedad?.cuh ?? '').trim();
    const itemDescription = String(safeAdditional(venta, 'sap_item_description') ?? buildItemDescription(venta)).trim();
    const warehouseCode = String(safeAdditional(venta, 'sap_warehouse_code') ?? 'SFERN').trim();
    const programCode = parseOptionalNumber(safeAdditional(venta, 'sap_programa')) ?? 6;
    const costCenter = parseOptionalNumber(safeAdditional(venta, 'sap_centro_costo')) ?? 604;
    const financeCode = String(safeAdditional(venta, 'sap_finanza') ?? 'F02').trim();
    const partida = String(safeAdditional(venta, 'sap_partida') ?? getPartida(tipo)).trim();
    const subpartida = String(safeAdditional(venta, 'sap_subpartida') ?? getSubpartida(tipo)).trim();
    const grupoIntegrante = String(safeAdditional(venta, 'sap_grupo_integrante') ?? getGrupoIntegrante(tipo, moneda)).trim();
    const projectCode = parseOptionalNumber(safeAdditional(venta, 'sap_project_code')) ?? costCenter;
    const controlAccount = getDebitorAccount(tipo, moneda);
    const tcRef = (venta.pagos ?? []).find((p) => p?.tc_sbs != null && p?.tc_sbs !== 0)?.tc_sbs ?? '';
    const tipoSituacion = getSituacion(venta.estado);

    setOrdenValue(row, 'DocNum', idx + 1);
    setOrdenValue(row, 'CardCode', cardCode);
    setOrdenValue(row, 'DocType', 'dDocument_Items');
    setOrdenValue(row, 'ControlAccount', controlAccount);
    setOrdenValue(row, 'TaxDate', fechaSep);
    setOrdenValue(row, 'DocDueDate', addYears(venta.fecha_separacion, 8));
    setOrdenValue(row, 'DocDate', fechaSep);
    setOrdenValue(row, 'DocCurrency', getDocCurrency(moneda));
    setOrdenValue(row, 'DocRate', moneda === 'USD' ? tcRef : '');
    setOrdenValue(row, 'DocTotal', docTotal);
    setOrdenValue(row, 'SalesPersonCode', promotor.code);
    setOrdenValue(row, 'U_SYP_SEPARA', 'Y');
    setOrdenValue(row, 'U_SYP_FESEPARAINI', formatYmd(firstPagoDateByTipo(venta, 'separacion')));
    setOrdenValue(row, 'U_SYP_FEINICIAL', fechaInicial);
    setOrdenValue(row, 'U_SYP_CUINICIAL', 'Y');
    setOrdenValue(row, 'U_SYP_PRECONT', venta.fecha_contrato ? 'OK' : '');
    setOrdenValue(row, 'U_SYP_FERECAINI', fechaPrimeraCuota);
    setOrdenValue(row, 'U_SYP_FERECAFIN', fechaUltimaCuota);
    setOrdenValue(row, 'U_SYP_VACUOTA', cuotaMonto || '');
    setOrdenValue(row, 'U_SYP_NROCUOTAS', cuotasCount || '');
    setOrdenValue(row, 'U_SYP_OBS_VENTAS', cuotasCount > 0 ? 'Rec BIF' : '');
    setOrdenValue(row, 'U_SYP_SITUACION', tipoSituacion);
    setOrdenValue(row, 'U_SYP_EXPED', promotor.name);
    setOrdenValue(row, 'U_SYP_VALORBONO', Number(safeAdditional(venta, 'sap_valor_bono') ?? 0) || '');
    setOrdenValue(row, 'U_SYP_GASTOSDMIN', Number(safeAdditional(venta, 'sap_gastos_admin') ?? 0) || '');
    setOrdenValue(row, 'U_SYP_COGRUPO', grupoIntegrante);
    setOrdenValue(row, 'U_SYP_PROGRAMA', programCode);
    setOrdenValue(row, 'U_SYP_CCCENCO', costCenter);
    setOrdenValue(row, 'U_SYP_CCFINAN', financeCode);
    setOrdenValue(row, 'U_SYP_CCPARTIDA', partida);
    setOrdenValue(row, 'U_SYP_CCSUBPARTIDA', subpartida);
    setOrdenValue(row, 'U_SYP_HBCUONUM', cuotasCount || '');
    setOrdenValue(row, 'U_SYP_CUOFALTA', cuotasFaltantes || '');
    setOrdenValue(row, 'U_SYP_VACUNICIAL', Number(venta.monto_inicial_objetivo ?? inicialPagada) || '');
    setOrdenValue(row, 'U_SYP_HBCUOVEN', fechaPrimeraCuota);
    setOrdenValue(row, 'U_SYP_HBCUOIMP', cuotaMonto || '');
    setOrdenValue(row, 'Comments', itemDescription);
    setOrdenValue(row, 'ParentKey', idx + 1);
    setOrdenValue(row, 'LineNum', 0);
    setOrdenValue(row, 'ItemCode', itemCode);
    setOrdenValue(row, 'ItemDescription', itemDescription);
    setOrdenValue(row, 'WarehouseCode', warehouseCode);
    setOrdenValue(row, 'Quantity', 1);
    setOrdenValue(row, 'Price', docTotal);
    setOrdenValue(row, 'LineTotal', docTotal);
    setOrdenValue(row, 'TaxCode', getTaxCode(tipo));
    setOrdenValue(row, 'VatGroup', getTaxCode(tipo));
    setOrdenValue(row, 'AccountCode', getAccountCodeLine(tipo));
    setOrdenValue(row, 'CostingCode', programCode);
    setOrdenValue(row, 'CostingCode2', costCenter);
    setOrdenValue(row, 'CostingCode3', financeCode);
    setOrdenValue(row, 'CostingCode4', partida);
    setOrdenValue(row, 'CostingCode5', subpartida);
    setOrdenValue(row, 'ProjectCode', projectCode);

    // Keep a commonly-used numeric for initial in case SAP template expects it downstream.
    setOrdenValue(row, 'U_SYP_VAPROMOTOR', Number(safeAdditional(venta, 'sap_precio_bono_venta') ?? 0) || '');

    rows.push(row);
    void separacionMonto; // Computed for consistency and future use in optional columns.
  });

  return rows;
}

export function buildOrdenesCodigosAoa(promotores: SapPromotorProfile[]) {
  const rows: unknown[][] = [
    [
      'Codigo del empleado del departamento de ventas',
      'Nombre de empleado del departamento de ventas',
      '',
      'CODIGO: GRUPO DE INTEGRANTE BIF',
      'DESCRIPCION',
      '',
      'CODIGO: CENTRO DE COSTO',
      'DESCRIPCION',
      '',
      'CODIGO: PARTIDA',
      'DESCRIPCION',
      '',
      'CODIGO: SUBPARTIDA',
      'DESCRIPCION',
    ],
    [-1, '-Ningun empleado del departamento de ventas-', '', '0013', 'URB SAN FERN CASAS S', '', 604, '604-URB SAN FERNANDO', '', 25, 'CASAS', '', '60425701', 'INGRESO VIVIENDA'],
    ['', '', '', '0031', 'SAN FERNANDO TERR', '', 604, '604-URB SAN FERNANDO', '', 24, 'TERRENOS', '', '60424703', 'INGRESO TERRENO'],
  ];

  const sorted = [...promotores]
    .filter((p) => p.sap_sales_person_code != null)
    .sort((a, b) => Number(a.sap_sales_person_code) - Number(b.sap_sales_person_code));

  for (const p of sorted) {
    rows.push([p.sap_sales_person_code, [p.first_name, p.last_name].filter(Boolean).join(' ').trim(), '', '', '', '', '', '', '', '', '', '', '', '']);
  }

  return rows;
}

function buildSeparacionRowsByTipo(
  ventas: SapVentaLike[],
  promotores: SapPromotorProfile[],
  tipoFiltrado: 'casa' | 'terreno',
) {
  const byPromotor = getPromotorMap(promotores);
  const rows: unknown[][] = [SEPARACION_HEADERS];

  for (const venta of ventas) {
    const tipo = venta.propiedad?.tipo;
    if (tipo !== tipoFiltrado) continue;
    const promotor = getPromotorData(venta, byPromotor);
    const separacion = sumByTipo(venta, 'separacion');
    const inicialObj = Number(venta.monto_inicial_objetivo ?? 0);
    const saldo = Math.max(Number(venta.precio_acordado ?? 0) - separacion - inicialObj, 0);

    rows.push([
      tipoFiltrado === 'casa' ? 'VIVIENDA' : 'TERRENO',
      formatYmd(venta.fecha_separacion),
      venta.estado ?? '',
      String(venta.cliente?.nombres ?? '').trim(),
      String(venta.cliente?.apellidos ?? '').trim(),
      normalizeDigits(venta.cliente?.dni, 20),
      normalizeDigits(venta.cliente?.telefono, 20),
      String(venta.cliente?.email ?? '').trim(),
      String(safeAdditional(venta, 'estado_civil_titular') ?? ''),
      String(safeAdditional(venta, 'grado_estudio_titular') ?? ''),
      String(safeAdditional(venta, 'fecha_nacimiento_titular') ?? ''),
      String(venta.cliente?.ubigeo_code ?? venta.cliente?.ubigeo ?? '').trim(),
      String(venta.cliente?.distrito ?? '').trim(),
      String(venta.cliente?.provincia ?? '').trim(),
      String(venta.cliente?.departamento ?? '').trim(),
      String(venta.cliente?.direccion ?? '').trim(),
      String(safeAdditional(venta, 'ocupacion_titular') ?? ''),
      String(safeAdditional(venta, 'centro_trabajo_titular') ?? ''),
      String(safeAdditional(venta, 'posee_otro_bien') ?? ''),
      String(safeAdditional(venta, 'referencia1_nombre') ?? ''),
      String(safeAdditional(venta, 'referencia1_email') ?? ''),
      String(safeAdditional(venta, 'referencia1_celular') ?? ''),
      String(safeAdditional(venta, 'referencia2_nombre') ?? ''),
      String(safeAdditional(venta, 'referencia2_email') ?? ''),
      String(safeAdditional(venta, 'referencia2_celular') ?? ''),
      Number(venta.precio_acordado ?? 0),
      separacion || '',
      inicialObj || '',
      saldo || '',
      String(venta.propiedad?.manzana ?? '').trim(),
      String(venta.propiedad?.lote ?? '').trim(),
      String(venta.propiedad?.etapa?.nombre ?? venta.propiedad?.etapa?.codigo ?? '').trim(),
      Number(venta.propiedad?.area_m2 ?? 0) || '',
      String(safeAdditional(venta, 'tipo_ubicacion') ?? ''),
      promotor.name,
      promotor.code,
      String(safeAdditional(venta, 'observacion') ?? ''),
    ]);
  }

  return rows;
}

export function buildSeparacionViviendaAoa(ventas: SapVentaLike[], promotores: SapPromotorProfile[]) {
  return buildSeparacionRowsByTipo(ventas, promotores, 'casa');
}

export function buildSeparacionTerrenoAoa(ventas: SapVentaLike[], promotores: SapPromotorProfile[]) {
  return buildSeparacionRowsByTipo(ventas, promotores, 'terreno');
}

// Tipos de dominio para Habitad v2.
// Nota: tipados manualmente (no generados) por ahora para no depender
// de supabase CLI. Mantener sincronizado con las tablas en schema v2.

export type TipoPropiedad = 'casa' | 'terreno';
export type EstadoFisico = 'libre' | 'separado' | 'ocupado' | 'bloqueado';
export type EstadoComercial =
  | 'sin_venta'
  | 'separacion'
  | 'inicial'
  | 'cuotas'
  | 'cancelacion'
  | 'entregada';
export type Moneda = 'PEN' | 'USD';
export type EstadoVenta =
  | 'separacion'
  | 'inicial'
  | 'cuotas'
  | 'cancelada'
  | 'entregada';
export type TipoPago = 'separacion' | 'inicial' | 'cuota' | 'saldo_favor' | 'otro';
export type EstadoPago = 'registrado' | 'conciliado' | 'anulado';
export type EstadoCuota = 'pendiente' | 'parcial' | 'pagada' | 'vencida';
export type TipoDocumento = 'hoja_separacion' | 'contrato' | 'cronograma' | 'recibo' | 'otro';

export interface Etapa {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  plano_url?: string | null;
  orden: number;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface Propiedad {
  id: string;
  cuh: string;
  etapa_id: string | null;
  tipo: TipoPropiedad;
  modelo?: string | null;
  partida_registral?: string | null;
  manzana?: string | null;
  lote?: string | null;
  ubicacion?: string | null;
  area_m2?: number | null;
  precio_lista: number;
  precio_venta?: number | null;
  moneda: Moneda;
  adicionales: Record<string, unknown>;
  plano_coords?: { x: number; y: number; width?: number; height?: number } | null;
  estado_fisico: EstadoFisico;
  estado_comercial: EstadoComercial;
  bloqueada_por?: string | null;
  bloqueada_motivo?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Cliente {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  auth_user_id?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Fase A — campos estructurados
  segundo_nombre?: string | null;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  tipo_via?: string | null;
  tipo_zona?: string | null;
  zona_nombre?: string | null;
  direccion_mz?: string | null;
  direccion_lt?: string | null;
  numero_puerta?: string | null;
  interior?: string | null;
  referencia?: string | null;
  ubigeo_cod?: string | null;
  urbanizacion?: string | null;
}

export interface Ubigeo {
  codigo: string;
  distrito: string;
  provincia: string;
  departamento: string;
}

export type ModalidadPago = 'contado' | 'cuotas_sin_interes' | 'cuotas_con_interes' | 'bono_mivivienda';
export type CuentaRecaudadora = 'sin_data' | 'con_data_terreno' | 'con_data_casas';
export type CorteCancelacionForma = 'efectivo' | 'credito_hipotecario';
export type TipoSeparacion = 'terreno_con_interes' | 'terreno_sin_interes' | 'casa';

export interface Venta {
  id: string;
  propiedad_id: string;
  cliente_id: string;
  promotor_id?: string | null;
  estado: EstadoVenta;
  precio_acordado: number;
  moneda: Moneda;
  fecha_separacion: string;
  fecha_vencimiento_separacion: string;
  fecha_pago_separacion?: string | null;
  fecha_limite_inicial?: string | null;
  fecha_inicial_completa?: string | null;
  fecha_contrato?: string | null;
  fecha_cancelacion?: string | null;
  motivo_cancelacion?: string | null;
  meses_cuotas?: number | null;
  monto_inicial_objetivo?: number | null;
  tipo_separacion?: TipoSeparacion | null;
  created_at: string;
  updated_at: string;
  // Fase C — modalidad precontrato
  modalidad_pago?: ModalidadPago | null;
  tasa_interes_anual?: number | null;
  penalidad_retiro?: number | null;
  cuenta_recaudadora?: CuentaRecaudadora | null;
  mora_diaria?: number | null;
  descuento_tipo?: string | null;
  descuento_monto?: number | null;
  descuento_descripcion?: string | null;
  corte_cancelacion_fecha?: string | null;
  corte_cancelacion_forma?: CorteCancelacionForma | null;
  corte_cancelacion_monto?: number | null;
  corte_cancelacion_notas?: string | null;
  // Fase D — MiVivienda
  mivivienda_expediente?: string | null;
  mivivienda_fecha_ingreso?: string | null;
  mivivienda_fecha_beneficiario?: string | null;
  mivivienda_fecha_caducidad?: string | null;
  mivivienda_bono_monto?: number | null;
  mivivienda_ahorro?: number | null;
  credito_hipotecario_banco?: string | null;
  credito_hipotecario_monto?: number | null;
  credito_hipotecario_fecha_inicio?: string | null;
  credito_hipotecario_fecha_fin?: string | null;
}

export interface Pago {
  id: string;
  venta_id: string;
  tipo: TipoPago;
  cuota_numero?: number | null;
  fecha_deposito: string;
  numero_operacion?: string | null;
  banco?: string | null;
  monto: number;
  moneda: Moneda;
  monto_pen?: number | null;
  monto_usd?: number | null;
  tc_sbs?: number | null;
  voucher_url?: string | null;
  estado: EstadoPago;
  registrado_por?: string | null;
  notas?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Cuota {
  id: string;
  venta_id: string;
  numero: number;
  fecha_vencimiento: string;
  monto: number;
  moneda: Moneda;
  monto_pagado: number;
  estado: EstadoCuota;
  created_at: string;
  updated_at: string;
}

export interface SaldoFavor {
  id: string;
  venta_id: string;
  monto: number;
  moneda: Moneda;
  origen_pago_id?: string | null;
  consumido: boolean;
  consumido_en?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaldoVenta {
  venta_id: string;
  propiedad_id: string;
  cliente_id: string;
  estado_venta: EstadoVenta;
  precio_acordado: number;
  moneda: Moneda;
  total_separacion: number;
  total_inicial: number;
  total_cuotas: number;
  total_pagado: number;
  saldo_pendiente: number;
  saldo_favor: number;
}

export interface Parametro {
  clave: string;
  valor: unknown;
  descripcion?: string | null;
  updated_by?: string | null;
  updated_at: string;
}

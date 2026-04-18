// Catálogo de entidades y campos disponibles para el constructor de reportes.
// Cada entidad raíz define sus campos propios y las relaciones (FKs) que se pueden
// desplegar como columnas adicionales.

export type FieldFormat = 'text' | 'number' | 'money' | 'date' | 'datetime' | 'bool';

export interface Field {
  key: string;           // único por entidad raíz
  label: string;         // texto visible
  path: string;          // path en el registro devuelto (ej: "propiedad.cuh")
  format?: FieldFormat;
  group: string;         // grupo en el panel izquierdo
  moneda_path?: string;  // para format=money: path del campo moneda del registro
}

export interface Entity {
  key: string;
  label: string;
  desc: string;
  table: string;         // tabla en schema v2
  dateField?: string;    // campo de fecha para el filtro Desde/Hasta
  select: string;        // string select para supabase.from(table).select(...)
  fields: Field[];
}

const MONEDA_PROPIEDAD = 'propiedad.moneda';

// ==============================================================
// VENTAS
// ==============================================================
const VENTAS_FIELDS: Field[] = [
  // Venta
  { key: 'id', label: 'ID venta', path: 'id', group: 'Venta' },
  { key: 'fecha_separacion', label: 'Fecha separación', path: 'fecha_separacion', format: 'datetime', group: 'Venta' },
  { key: 'fecha_pago_separacion', label: 'Fecha pago separación', path: 'fecha_pago_separacion', format: 'datetime', group: 'Venta' },
  { key: 'fecha_vencimiento_separacion', label: 'Vencimiento separación', path: 'fecha_vencimiento_separacion', format: 'datetime', group: 'Venta' },
  { key: 'fecha_limite_inicial', label: 'Límite inicial', path: 'fecha_limite_inicial', format: 'date', group: 'Venta' },
  { key: 'fecha_inicial_completa', label: 'Inicial completa', path: 'fecha_inicial_completa', format: 'datetime', group: 'Venta' },
  { key: 'fecha_contrato', label: 'Fecha contrato', path: 'fecha_contrato', format: 'datetime', group: 'Venta' },
  { key: 'fecha_cancelacion', label: 'Fecha cancelación', path: 'fecha_cancelacion', format: 'datetime', group: 'Venta' },
  { key: 'estado', label: 'Estado venta', path: 'estado', group: 'Venta' },
  { key: 'precio_acordado', label: 'Precio acordado', path: 'precio_acordado', format: 'money', group: 'Venta', moneda_path: 'moneda' },
  { key: 'moneda', label: 'Moneda', path: 'moneda', group: 'Venta' },
  { key: 'meses_cuotas', label: 'Meses cuotas', path: 'meses_cuotas', format: 'number', group: 'Venta' },
  { key: 'monto_inicial_objetivo', label: 'Objetivo inicial', path: 'monto_inicial_objetivo', format: 'money', group: 'Venta', moneda_path: 'moneda' },
  { key: 'motivo_cancelacion', label: 'Motivo cancelación', path: 'motivo_cancelacion', group: 'Venta' },
  // Propiedad (relación)
  { key: 'propiedad_cuh', label: 'CUH', path: 'propiedad.cuh', group: 'Propiedad' },
  { key: 'propiedad_tipo', label: 'Tipo', path: 'propiedad.tipo', group: 'Propiedad' },
  { key: 'propiedad_modelo', label: 'Modelo', path: 'propiedad.modelo', group: 'Propiedad' },
  { key: 'propiedad_manzana', label: 'Manzana', path: 'propiedad.manzana', group: 'Propiedad' },
  { key: 'propiedad_lote', label: 'Lote', path: 'propiedad.lote', group: 'Propiedad' },
  { key: 'propiedad_ubicacion', label: 'Ubicación', path: 'propiedad.ubicacion', group: 'Propiedad' },
  { key: 'propiedad_area', label: 'Área (m²)', path: 'propiedad.area_m2', format: 'number', group: 'Propiedad' },
  { key: 'propiedad_partida', label: 'Partida registral', path: 'propiedad.partida_registral', group: 'Propiedad' },
  { key: 'propiedad_precio_lista', label: 'Precio lista', path: 'propiedad.precio_lista', format: 'money', moneda_path: MONEDA_PROPIEDAD, group: 'Propiedad' },
  { key: 'propiedad_estado_fisico', label: 'Estado físico', path: 'propiedad.estado_fisico', group: 'Propiedad' },
  { key: 'propiedad_estado_comercial', label: 'Estado comercial', path: 'propiedad.estado_comercial', group: 'Propiedad' },
  { key: 'etapa_nombre', label: 'Etapa', path: 'propiedad.etapa.nombre', group: 'Propiedad' },
  // Cliente
  { key: 'cliente_nombres', label: 'Nombres', path: 'cliente.nombres', group: 'Cliente' },
  { key: 'cliente_apellidos', label: 'Apellidos', path: 'cliente.apellidos', group: 'Cliente' },
  { key: 'cliente_dni', label: 'DNI', path: 'cliente.dni', group: 'Cliente' },
  { key: 'cliente_telefono', label: 'Teléfono', path: 'cliente.telefono', group: 'Cliente' },
  { key: 'cliente_email', label: 'Email', path: 'cliente.email', group: 'Cliente' },
];

const VENTAS_SELECT =
  '*, propiedad:propiedades(cuh, tipo, modelo, manzana, lote, ubicacion, area_m2, partida_registral, precio_lista, moneda, estado_fisico, estado_comercial, etapa:etapas(nombre)), cliente:clientes(nombres, apellidos, dni, telefono, email)';

// ==============================================================
// PAGOS
// ==============================================================
const PAGOS_FIELDS: Field[] = [
  { key: 'fecha_deposito', label: 'Fecha depósito', path: 'fecha_deposito', format: 'date', group: 'Pago' },
  { key: 'tipo', label: 'Tipo pago', path: 'tipo', group: 'Pago' },
  { key: 'cuota_numero', label: 'Nº cuota', path: 'cuota_numero', format: 'number', group: 'Pago' },
  { key: 'numero_operacion', label: 'Nº operación', path: 'numero_operacion', group: 'Pago' },
  { key: 'banco', label: 'Banco', path: 'banco', group: 'Pago' },
  { key: 'monto', label: 'Monto', path: 'monto', format: 'money', moneda_path: 'moneda', group: 'Pago' },
  { key: 'moneda', label: 'Moneda', path: 'moneda', group: 'Pago' },
  { key: 'estado', label: 'Estado pago', path: 'estado', group: 'Pago' },
  { key: 'notas', label: 'Notas', path: 'notas', group: 'Pago' },
  { key: 'created_at', label: 'Registrado en', path: 'created_at', format: 'datetime', group: 'Pago' },
  // Venta
  { key: 'venta_estado', label: 'Estado venta', path: 'venta.estado', group: 'Venta' },
  { key: 'venta_precio', label: 'Precio venta', path: 'venta.precio_acordado', format: 'money', moneda_path: 'venta.moneda', group: 'Venta' },
  // Propiedad
  { key: 'propiedad_cuh', label: 'CUH', path: 'venta.propiedad.cuh', group: 'Propiedad' },
  { key: 'propiedad_manzana', label: 'Manzana', path: 'venta.propiedad.manzana', group: 'Propiedad' },
  { key: 'propiedad_lote', label: 'Lote', path: 'venta.propiedad.lote', group: 'Propiedad' },
  { key: 'propiedad_tipo', label: 'Tipo', path: 'venta.propiedad.tipo', group: 'Propiedad' },
  { key: 'etapa_nombre', label: 'Etapa', path: 'venta.propiedad.etapa.nombre', group: 'Propiedad' },
  // Cliente
  { key: 'cliente_nombres', label: 'Nombres', path: 'venta.cliente.nombres', group: 'Cliente' },
  { key: 'cliente_apellidos', label: 'Apellidos', path: 'venta.cliente.apellidos', group: 'Cliente' },
  { key: 'cliente_dni', label: 'DNI', path: 'venta.cliente.dni', group: 'Cliente' },
];

const PAGOS_SELECT =
  '*, venta:ventas(estado, precio_acordado, moneda, propiedad:propiedades(cuh, manzana, lote, tipo, etapa:etapas(nombre)), cliente:clientes(nombres, apellidos, dni))';

// ==============================================================
// PROPIEDADES
// ==============================================================
const PROPIEDADES_FIELDS: Field[] = [
  { key: 'cuh', label: 'CUH', path: 'cuh', group: 'Propiedad' },
  { key: 'tipo', label: 'Tipo', path: 'tipo', group: 'Propiedad' },
  { key: 'modelo', label: 'Modelo', path: 'modelo', group: 'Propiedad' },
  { key: 'manzana', label: 'Manzana', path: 'manzana', group: 'Propiedad' },
  { key: 'lote', label: 'Lote', path: 'lote', group: 'Propiedad' },
  { key: 'ubicacion', label: 'Ubicación', path: 'ubicacion', group: 'Propiedad' },
  { key: 'area_m2', label: 'Área (m²)', path: 'area_m2', format: 'number', group: 'Propiedad' },
  { key: 'partida_registral', label: 'Partida', path: 'partida_registral', group: 'Propiedad' },
  { key: 'precio_lista', label: 'Precio lista', path: 'precio_lista', format: 'money', moneda_path: 'moneda', group: 'Propiedad' },
  { key: 'precio_venta', label: 'Precio venta', path: 'precio_venta', format: 'money', moneda_path: 'moneda', group: 'Propiedad' },
  { key: 'moneda', label: 'Moneda', path: 'moneda', group: 'Propiedad' },
  { key: 'estado_fisico', label: 'Estado físico', path: 'estado_fisico', group: 'Propiedad' },
  { key: 'estado_comercial', label: 'Estado comercial', path: 'estado_comercial', group: 'Propiedad' },
  { key: 'bloqueada_motivo', label: 'Motivo bloqueo', path: 'bloqueada_motivo', group: 'Propiedad' },
  { key: 'created_at', label: 'Creada en', path: 'created_at', format: 'datetime', group: 'Propiedad' },
  { key: 'etapa_codigo', label: 'Etapa (código)', path: 'etapa.codigo', group: 'Etapa' },
  { key: 'etapa_nombre', label: 'Etapa', path: 'etapa.nombre', group: 'Etapa' },
];

const PROPIEDADES_SELECT = '*, etapa:etapas(codigo, nombre)';

// ==============================================================
// CUOTAS
// ==============================================================
const CUOTAS_FIELDS: Field[] = [
  { key: 'numero', label: 'Nº cuota', path: 'numero', format: 'number', group: 'Cuota' },
  { key: 'fecha_vencimiento', label: 'Vencimiento', path: 'fecha_vencimiento', format: 'date', group: 'Cuota' },
  { key: 'monto', label: 'Monto cuota', path: 'monto', format: 'money', moneda_path: 'moneda', group: 'Cuota' },
  { key: 'monto_pagado', label: 'Monto pagado', path: 'monto_pagado', format: 'money', moneda_path: 'moneda', group: 'Cuota' },
  { key: 'estado', label: 'Estado cuota', path: 'estado', group: 'Cuota' },
  { key: 'moneda', label: 'Moneda', path: 'moneda', group: 'Cuota' },
  // Venta
  { key: 'venta_estado', label: 'Estado venta', path: 'venta.estado', group: 'Venta' },
  // Propiedad
  { key: 'propiedad_cuh', label: 'CUH', path: 'venta.propiedad.cuh', group: 'Propiedad' },
  { key: 'propiedad_manzana', label: 'Manzana', path: 'venta.propiedad.manzana', group: 'Propiedad' },
  { key: 'propiedad_lote', label: 'Lote', path: 'venta.propiedad.lote', group: 'Propiedad' },
  { key: 'etapa_nombre', label: 'Etapa', path: 'venta.propiedad.etapa.nombre', group: 'Propiedad' },
  // Cliente
  { key: 'cliente_nombres', label: 'Nombres', path: 'venta.cliente.nombres', group: 'Cliente' },
  { key: 'cliente_apellidos', label: 'Apellidos', path: 'venta.cliente.apellidos', group: 'Cliente' },
  { key: 'cliente_dni', label: 'DNI', path: 'venta.cliente.dni', group: 'Cliente' },
];

const CUOTAS_SELECT =
  '*, venta:ventas(estado, propiedad:propiedades(cuh, manzana, lote, etapa:etapas(nombre)), cliente:clientes(nombres, apellidos, dni))';

export const ENTITIES: Entity[] = [
  { key: 'ventas', label: 'Ventas', desc: 'Reportar sobre ventas con datos de propiedad y cliente', table: 'ventas', dateField: 'fecha_separacion', select: VENTAS_SELECT, fields: VENTAS_FIELDS },
  { key: 'pagos', label: 'Pagos', desc: 'Reportar sobre pagos registrados (separación, inicial, cuotas)', table: 'pagos', dateField: 'fecha_deposito', select: PAGOS_SELECT, fields: PAGOS_FIELDS },
  { key: 'propiedades', label: 'Propiedades', desc: 'Inventario de unidades con etapa', table: 'propiedades', select: PROPIEDADES_SELECT, fields: PROPIEDADES_FIELDS },
  { key: 'cuotas', label: 'Cuotas', desc: 'Cronograma de cuotas de todas las ventas en estado cuotas', table: 'cuotas', dateField: 'fecha_vencimiento', select: CUOTAS_SELECT, fields: CUOTAS_FIELDS },
];

export function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((o, p) => (o == null ? undefined : o[p]), obj);
}

export function formatCell(v: any, field: Field, row?: any): string {
  if (v == null) return '';
  switch (field.format) {
    case 'date':
      return new Date(v).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    case 'datetime':
      return new Date(v).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    case 'money': {
      const moneda = field.moneda_path && row ? getNestedValue(row, field.moneda_path) : 'USD';
      const symbol = moneda === 'PEN' ? 'S/' : '$';
      const n = Number(v);
      return `${symbol} ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    case 'number':
      return String(Number(v));
    case 'bool':
      return v ? 'Sí' : 'No';
    default:
      return String(v);
  }
}

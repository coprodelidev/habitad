// Catálogo de entidades y campos disponibles para el constructor de reportes.
// Cada entidad raíz define sus campos propios y las relaciones (FKs) que se pueden
// desplegar como columnas adicionales.
//
// Convención de labels: cuando un campo es genérico (nombres, apellidos, email,
// teléfono) se incluye el sustantivo que lo contextualiza en la propia etiqueta
// (ej. "Nombres del cliente", "Nombres del promotor"). Así al mezclar columnas
// de varias entidades el usuario siempre sabe qué dato está eligiendo.

export type FieldFormat = 'text' | 'number' | 'money' | 'date' | 'datetime' | 'bool';

export interface Field {
  key: string;
  label: string;
  path: string;
  format?: FieldFormat;
  group: string;
  moneda_path?: string;
}

export interface Entity {
  key: string;
  label: string;
  desc: string;
  table: string;
  dateField?: string;
  select: string;
  fields: Field[];
}

// ==============================================================
// VENTAS
// ==============================================================
const VENTAS_FIELDS: Field[] = [
  // Venta
  { key: 'id', label: 'ID de la venta', path: 'id', group: 'Venta' },
  { key: 'fecha_separacion', label: 'Fecha de separación', path: 'fecha_separacion', format: 'datetime', group: 'Venta' },
  { key: 'fecha_pago_separacion', label: 'Fecha de pago separación', path: 'fecha_pago_separacion', format: 'datetime', group: 'Venta' },
  { key: 'fecha_vencimiento_separacion', label: 'Vencimiento de separación', path: 'fecha_vencimiento_separacion', format: 'datetime', group: 'Venta' },
  { key: 'fecha_limite_inicial', label: 'Fecha límite de inicial', path: 'fecha_limite_inicial', format: 'date', group: 'Venta' },
  { key: 'fecha_inicial_completa', label: 'Fecha inicial completada', path: 'fecha_inicial_completa', format: 'datetime', group: 'Venta' },
  { key: 'fecha_contrato', label: 'Fecha del contrato', path: 'fecha_contrato', format: 'datetime', group: 'Venta' },
  { key: 'fecha_cancelacion', label: 'Fecha de cancelación', path: 'fecha_cancelacion', format: 'datetime', group: 'Venta' },
  { key: 'estado', label: 'Estado de la venta', path: 'estado', group: 'Venta' },
  { key: 'precio_acordado', label: 'Precio acordado de la venta', path: 'precio_acordado', format: 'money', group: 'Venta', moneda_path: 'moneda' },
  { key: 'moneda', label: 'Moneda de la venta', path: 'moneda', group: 'Venta' },
  { key: 'meses_cuotas', label: 'Meses de cuotas', path: 'meses_cuotas', format: 'number', group: 'Venta' },
  { key: 'monto_inicial_objetivo', label: 'Monto objetivo de inicial', path: 'monto_inicial_objetivo', format: 'money', group: 'Venta', moneda_path: 'moneda' },
  { key: 'motivo_cancelacion', label: 'Motivo de cancelación', path: 'motivo_cancelacion', group: 'Venta' },
  // Propiedad
  { key: 'propiedad_cuh', label: 'CUH de la propiedad', path: 'propiedad.cuh', group: 'Propiedad' },
  { key: 'propiedad_tipo', label: 'Tipo (casa/terreno)', path: 'propiedad.tipo', group: 'Propiedad' },
  { key: 'propiedad_modelo', label: 'Modelo de la propiedad', path: 'propiedad.modelo', group: 'Propiedad' },
  { key: 'propiedad_manzana', label: 'Manzana', path: 'propiedad.manzana', group: 'Propiedad' },
  { key: 'propiedad_lote', label: 'Lote', path: 'propiedad.lote', group: 'Propiedad' },
  { key: 'propiedad_ubicacion', label: 'Ubicación de la propiedad', path: 'propiedad.ubicacion', group: 'Propiedad' },
  { key: 'propiedad_area', label: 'Área (m²)', path: 'propiedad.area_m2', format: 'number', group: 'Propiedad' },
  { key: 'propiedad_partida', label: 'Partida registral', path: 'propiedad.partida_registral', group: 'Propiedad' },
  { key: 'propiedad_precio_lista', label: 'Precio lista de la propiedad', path: 'propiedad.precio_lista', format: 'money', moneda_path: 'propiedad.moneda', group: 'Propiedad' },
  { key: 'propiedad_estado_fisico', label: 'Estado físico de la propiedad', path: 'propiedad.estado_fisico', group: 'Propiedad' },
  { key: 'propiedad_estado_comercial', label: 'Estado comercial de la propiedad', path: 'propiedad.estado_comercial', group: 'Propiedad' },
  { key: 'etapa_nombre', label: 'Etapa de la propiedad', path: 'propiedad.etapa.nombre', group: 'Propiedad' },
  // Cliente
  { key: 'cliente_nombres', label: 'Nombres del cliente', path: 'cliente.nombres', group: 'Cliente' },
  { key: 'cliente_apellidos', label: 'Apellidos del cliente', path: 'cliente.apellidos', group: 'Cliente' },
  { key: 'cliente_dni', label: 'DNI del cliente', path: 'cliente.dni', group: 'Cliente' },
  { key: 'cliente_telefono', label: 'Teléfono del cliente', path: 'cliente.telefono', group: 'Cliente' },
  { key: 'cliente_email', label: 'Email del cliente', path: 'cliente.email', group: 'Cliente' },
  // Promotor (join a public.profiles)
  { key: 'promotor_nombres', label: 'Nombres del promotor', path: 'promotor.first_name', group: 'Promotor' },
  { key: 'promotor_apellidos', label: 'Apellidos del promotor', path: 'promotor.last_name', group: 'Promotor' },
  { key: 'promotor_email', label: 'Email del promotor', path: 'promotor.email', group: 'Promotor' },
];

// promotor_id ya está en * — el enriquecimiento del promotor se hace cliente-side
const VENTAS_SELECT =
  '*, propiedad:propiedades(cuh, tipo, modelo, manzana, lote, ubicacion, area_m2, partida_registral, precio_lista, moneda, estado_fisico, estado_comercial, etapa:etapas(nombre)), cliente:clientes(nombres, apellidos, dni, telefono, email)';

// ==============================================================
// PAGOS
// ==============================================================
const PAGOS_FIELDS: Field[] = [
  // Pago
  { key: 'fecha_deposito', label: 'Fecha del depósito', path: 'fecha_deposito', format: 'date', group: 'Pago' },
  { key: 'tipo', label: 'Tipo de pago', path: 'tipo', group: 'Pago' },
  { key: 'cuota_numero', label: 'Nº de cuota', path: 'cuota_numero', format: 'number', group: 'Pago' },
  { key: 'numero_operacion', label: 'Nº de operación', path: 'numero_operacion', group: 'Pago' },
  { key: 'banco', label: 'Banco del depósito', path: 'banco', group: 'Pago' },
  { key: 'monto', label: 'Monto del pago', path: 'monto', format: 'money', moneda_path: 'moneda', group: 'Pago' },
  { key: 'moneda', label: 'Moneda del pago', path: 'moneda', group: 'Pago' },
  { key: 'estado', label: 'Estado del pago', path: 'estado', group: 'Pago' },
  { key: 'notas', label: 'Notas del pago', path: 'notas', group: 'Pago' },
  { key: 'created_at', label: 'Registrado en (fecha)', path: 'created_at', format: 'datetime', group: 'Pago' },
  // Venta
  { key: 'venta_estado', label: 'Estado de la venta', path: 'venta.estado', group: 'Venta' },
  { key: 'venta_precio', label: 'Precio de la venta', path: 'venta.precio_acordado', format: 'money', moneda_path: 'venta.moneda', group: 'Venta' },
  // Propiedad
  { key: 'propiedad_cuh', label: 'CUH de la propiedad', path: 'venta.propiedad.cuh', group: 'Propiedad' },
  { key: 'propiedad_manzana', label: 'Manzana', path: 'venta.propiedad.manzana', group: 'Propiedad' },
  { key: 'propiedad_lote', label: 'Lote', path: 'venta.propiedad.lote', group: 'Propiedad' },
  { key: 'propiedad_tipo', label: 'Tipo (casa/terreno)', path: 'venta.propiedad.tipo', group: 'Propiedad' },
  { key: 'etapa_nombre', label: 'Etapa de la propiedad', path: 'venta.propiedad.etapa.nombre', group: 'Propiedad' },
  // Cliente (quien pagó)
  { key: 'cliente_nombres', label: 'Nombres del cliente', path: 'venta.cliente.nombres', group: 'Cliente' },
  { key: 'cliente_apellidos', label: 'Apellidos del cliente', path: 'venta.cliente.apellidos', group: 'Cliente' },
  { key: 'cliente_dni', label: 'DNI del cliente', path: 'venta.cliente.dni', group: 'Cliente' },
  { key: 'cliente_telefono', label: 'Teléfono del cliente', path: 'venta.cliente.telefono', group: 'Cliente' },
  { key: 'cliente_email', label: 'Email del cliente', path: 'venta.cliente.email', group: 'Cliente' },
  // Promotor (responsable de la venta)
  { key: 'promotor_nombres', label: 'Nombres del promotor', path: 'venta.promotor.first_name', group: 'Promotor' },
  { key: 'promotor_apellidos', label: 'Apellidos del promotor', path: 'venta.promotor.last_name', group: 'Promotor' },
  { key: 'promotor_email', label: 'Email del promotor', path: 'venta.promotor.email', group: 'Promotor' },
  // Registrado por (quién capturó el pago en el sistema)
  { key: 'registrado_nombres', label: 'Nombres de quien registró', path: 'registrado.first_name', group: 'Registrado por' },
  { key: 'registrado_apellidos', label: 'Apellidos de quien registró', path: 'registrado.last_name', group: 'Registrado por' },
];

const PAGOS_SELECT =
  '*, venta:ventas(promotor_id, estado, precio_acordado, moneda, propiedad:propiedades(cuh, manzana, lote, tipo, etapa:etapas(nombre)), cliente:clientes(nombres, apellidos, dni, telefono, email))';

// ==============================================================
// PROPIEDADES
// ==============================================================
const PROPIEDADES_FIELDS: Field[] = [
  { key: 'cuh', label: 'CUH de la propiedad', path: 'cuh', group: 'Propiedad' },
  { key: 'tipo', label: 'Tipo (casa/terreno)', path: 'tipo', group: 'Propiedad' },
  { key: 'modelo', label: 'Modelo de la propiedad', path: 'modelo', group: 'Propiedad' },
  { key: 'manzana', label: 'Manzana', path: 'manzana', group: 'Propiedad' },
  { key: 'lote', label: 'Lote', path: 'lote', group: 'Propiedad' },
  { key: 'ubicacion', label: 'Ubicación', path: 'ubicacion', group: 'Propiedad' },
  { key: 'area_m2', label: 'Área (m²)', path: 'area_m2', format: 'number', group: 'Propiedad' },
  { key: 'partida_registral', label: 'Partida registral', path: 'partida_registral', group: 'Propiedad' },
  { key: 'precio_lista', label: 'Precio lista', path: 'precio_lista', format: 'money', moneda_path: 'moneda', group: 'Propiedad' },
  { key: 'precio_venta', label: 'Precio de venta', path: 'precio_venta', format: 'money', moneda_path: 'moneda', group: 'Propiedad' },
  { key: 'moneda', label: 'Moneda', path: 'moneda', group: 'Propiedad' },
  { key: 'estado_fisico', label: 'Estado físico', path: 'estado_fisico', group: 'Propiedad' },
  { key: 'estado_comercial', label: 'Estado comercial', path: 'estado_comercial', group: 'Propiedad' },
  { key: 'bloqueada_motivo', label: 'Motivo del bloqueo', path: 'bloqueada_motivo', group: 'Propiedad' },
  { key: 'created_at', label: 'Fecha de creación', path: 'created_at', format: 'datetime', group: 'Propiedad' },
  { key: 'etapa_codigo', label: 'Código de etapa', path: 'etapa.codigo', group: 'Etapa' },
  { key: 'etapa_nombre', label: 'Nombre de etapa', path: 'etapa.nombre', group: 'Etapa' },
];

const PROPIEDADES_SELECT = '*, etapa:etapas(codigo, nombre)';

// ==============================================================
// CUOTAS
// ==============================================================
const CUOTAS_FIELDS: Field[] = [
  // Cuota
  { key: 'numero', label: 'Nº de cuota', path: 'numero', format: 'number', group: 'Cuota' },
  { key: 'fecha_vencimiento', label: 'Fecha de vencimiento', path: 'fecha_vencimiento', format: 'date', group: 'Cuota' },
  { key: 'monto', label: 'Monto de la cuota', path: 'monto', format: 'money', moneda_path: 'moneda', group: 'Cuota' },
  { key: 'monto_pagado', label: 'Monto pagado de la cuota', path: 'monto_pagado', format: 'money', moneda_path: 'moneda', group: 'Cuota' },
  { key: 'estado', label: 'Estado de la cuota', path: 'estado', group: 'Cuota' },
  { key: 'moneda', label: 'Moneda', path: 'moneda', group: 'Cuota' },
  // Venta
  { key: 'venta_estado', label: 'Estado de la venta', path: 'venta.estado', group: 'Venta' },
  { key: 'venta_precio', label: 'Precio acordado de la venta', path: 'venta.precio_acordado', format: 'money', moneda_path: 'venta.moneda', group: 'Venta' },
  // Propiedad
  { key: 'propiedad_cuh', label: 'CUH de la propiedad', path: 'venta.propiedad.cuh', group: 'Propiedad' },
  { key: 'propiedad_manzana', label: 'Manzana', path: 'venta.propiedad.manzana', group: 'Propiedad' },
  { key: 'propiedad_lote', label: 'Lote', path: 'venta.propiedad.lote', group: 'Propiedad' },
  { key: 'propiedad_tipo', label: 'Tipo (casa/terreno)', path: 'venta.propiedad.tipo', group: 'Propiedad' },
  { key: 'etapa_nombre', label: 'Etapa de la propiedad', path: 'venta.propiedad.etapa.nombre', group: 'Propiedad' },
  // Cliente
  { key: 'cliente_nombres', label: 'Nombres del cliente', path: 'venta.cliente.nombres', group: 'Cliente' },
  { key: 'cliente_apellidos', label: 'Apellidos del cliente', path: 'venta.cliente.apellidos', group: 'Cliente' },
  { key: 'cliente_dni', label: 'DNI del cliente', path: 'venta.cliente.dni', group: 'Cliente' },
  { key: 'cliente_telefono', label: 'Teléfono del cliente', path: 'venta.cliente.telefono', group: 'Cliente' },
  { key: 'cliente_email', label: 'Email del cliente', path: 'venta.cliente.email', group: 'Cliente' },
  // Promotor
  { key: 'promotor_nombres', label: 'Nombres del promotor', path: 'venta.promotor.first_name', group: 'Promotor' },
  { key: 'promotor_apellidos', label: 'Apellidos del promotor', path: 'venta.promotor.last_name', group: 'Promotor' },
  { key: 'promotor_email', label: 'Email del promotor', path: 'venta.promotor.email', group: 'Promotor' },
];

const CUOTAS_SELECT =
  '*, venta:ventas(promotor_id, estado, precio_acordado, moneda, propiedad:propiedades(cuh, manzana, lote, tipo, etapa:etapas(nombre)), cliente:clientes(nombres, apellidos, dni, telefono, email))';

export const ENTITIES: Entity[] = [
  { key: 'ventas', label: 'Ventas', desc: 'Reportar sobre ventas con datos de propiedad, cliente y promotor', table: 'ventas', dateField: 'fecha_separacion', select: VENTAS_SELECT, fields: VENTAS_FIELDS },
  { key: 'pagos', label: 'Pagos', desc: 'Pagos registrados (separación, inicial, cuotas) con cliente y promotor', table: 'pagos', dateField: 'fecha_deposito', select: PAGOS_SELECT, fields: PAGOS_FIELDS },
  { key: 'propiedades', label: 'Propiedades', desc: 'Inventario de unidades con etapa', table: 'propiedades', select: PROPIEDADES_SELECT, fields: PROPIEDADES_FIELDS },
  { key: 'cuotas', label: 'Cuotas', desc: 'Cronograma de cuotas con cliente y promotor', table: 'cuotas', dateField: 'fecha_vencimiento', select: CUOTAS_SELECT, fields: CUOTAS_FIELDS },
];

// Colores consistentes por grupo para que el usuario distinga visualmente
export const GROUP_COLORS: Record<string, string> = {
  'Venta': 'bg-indigo-100 text-indigo-800',
  'Propiedad': 'bg-emerald-100 text-emerald-800',
  'Cliente': 'bg-sky-100 text-sky-800',
  'Promotor': 'bg-amber-100 text-amber-800',
  'Pago': 'bg-violet-100 text-violet-800',
  'Cuota': 'bg-rose-100 text-rose-800',
  'Etapa': 'bg-teal-100 text-teal-800',
  'Registrado por': 'bg-slate-100 text-slate-800',
};

export function groupColor(group: string): string {
  return GROUP_COLORS[group] ?? 'bg-slate-100 text-slate-800';
}

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

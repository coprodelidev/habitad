import type { Moneda } from './types';

export const MOTIVOS_RETIRO = [
  { codigo: 'cuotas_atrasadas', label: 'Cuotas atrasadas', penalidad: true },
  { codigo: 'no_cumple_requisitos', label: 'No cumple requisitos', penalidad: true },
  { codigo: 'requisitos_cambio_titular', label: 'No cumple requisitos del cambio de titular', penalidad: false },
  { codigo: 'cambio_ubicacion', label: 'Cambio de ubicación', penalidad: false },
  { codigo: 'inicial_separacion_incompleta', label: 'No completó inicial o separación', penalidad: true },
] as const;

export type MotivoRetiro = typeof MOTIVOS_RETIRO[number]['codigo'];
export const PENALIDAD_RETIRO_SUGERIDA = 3700;

export const TAREAS_RETIRO = [
  { campo: 'carta_solicitada', label: 'Solicitar carta de devolución al cliente' },
  { campo: 'carta_recibida', label: 'Recibir carta de devolución' },
  { campo: 'datos_verificados', label: 'Verificar los datos del cliente' },
  { campo: 'fecha_confirmada', label: 'Confirmar la fecha del retiro' },
  { campo: 'penalidad_revisada', label: 'Revisar la penalidad aplicable' },
  { campo: 'devolucion_gestionada', label: 'Completar la gestión de devolución' },
] as const;

export type TareaRetiro = typeof TAREAS_RETIRO[number]['campo'];

export type Retiro = Record<TareaRetiro, boolean> & {
  id: string;
  venta_id: string;
  motivo: MotivoRetiro;
  aplica_penalidad: boolean;
  penalidad_monto: number;
  penalidad_moneda: Moneda;
  fecha_retiro: string;
  cliente_snapshot: { nombres: string; apellidos: string; dni: string; telefono: string | null; email: string | null; direccion: string | null };
  propiedad_snapshot: { cuh: string; manzana: string | null; lote: string | null };
  completado_at: string | null;
  created_by: string;
  version: number;
};

export interface RetiroObservacion {
  id: string;
  retiro_id: string;
  texto: string;
  autor_nombre: string;
  created_at: string;
  resuelta_at: string | null;
}

export function motivoRetiroLabel(codigo: MotivoRetiro): string {
  return MOTIVOS_RETIRO.find((m) => m.codigo === codigo)?.label ?? codigo;
}

export function tareasPendientes(retiro: Retiro) {
  return TAREAS_RETIRO.filter((t) => !retiro[t.campo]);
}

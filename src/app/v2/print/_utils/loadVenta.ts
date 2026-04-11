import { supabaseV2 } from '@/lib/v2/supabaseV2';
import type { Venta, Propiedad, Cliente, Cuota, Pago } from '@/lib/v2/types';

export interface VentaBundle {
  venta: Venta;
  propiedad: Propiedad;
  cliente: Cliente;
  cuotas: Cuota[];
  pagos: Pago[];
}

export async function loadVentaBundle(id: string): Promise<VentaBundle | null> {
  const v = await supabaseV2.from('ventas').select('*').eq('id', id).maybeSingle();
  if (v.error || !v.data) return null;
  const venta = v.data as Venta;
  const [p, c, ct, pg] = await Promise.all([
    supabaseV2.from('propiedades').select('*').eq('id', venta.propiedad_id).maybeSingle(),
    supabaseV2.from('clientes').select('*').eq('id', venta.cliente_id).maybeSingle(),
    supabaseV2.from('cuotas').select('*').eq('venta_id', id).order('numero'),
    supabaseV2.from('pagos').select('*').eq('venta_id', id).order('fecha_deposito'),
  ]);
  return {
    venta,
    propiedad: (p.data as Propiedad)!,
    cliente: (c.data as Cliente)!,
    cuotas: (ct.data ?? []) as Cuota[],
    pagos: (pg.data ?? []) as Pago[],
  };
}

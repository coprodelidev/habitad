'use client';

import Link from 'next/link';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import type { Propiedad, Venta } from '@/lib/v2/types';
import { formatDateTime, formatMoney, timeRemaining } from '@/lib/v2/format';
import { useEffect, useState } from 'react';
import { isAdmin } from '@/lib/v2/permissions';
import { useV2User } from '@/lib/v2/useV2User';

export function UnidadDetalleModal({
  propiedad,
  venta,
  onClose,
  onChanged,
}: {
  propiedad: Propiedad;
  venta: Venta | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { user } = useV2User();
  const canAdmin = isAdmin(user?.roleCode);
  const [cliente, setCliente] = useState<{ nombres: string; apellidos: string; dni: string } | null>(null);

  useEffect(() => {
    if (venta?.cliente_id) {
      supabaseV2.from('clientes').select('nombres, apellidos, dni').eq('id', venta.cliente_id).maybeSingle()
        .then((res: any) => setCliente(res?.data ?? null));
    }
  }, [venta]);

  const liberar = async () => {
    if (!venta) return;
    if (!confirm('¿Liberar esta unidad y cancelar la venta?')) return;
    await supabaseV2.from('ventas').update({
      estado: 'cancelada',
      fecha_cancelacion: new Date().toISOString(),
      motivo_cancelacion: 'Liberación manual desde plano',
    }).eq('id', venta.id);
    onChanged();
  };

  const desbloquear = async () => {
    await supabaseV2.from('propiedades').update({ estado_fisico: 'libre', bloqueada_motivo: null }).eq('id', propiedad.id);
    onChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-lg font-semibold">Detalle de unidad</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="p-5 text-sm">
          <div className="mb-3 font-mono text-xs text-slate-500">{propiedad.cuh}</div>
          <Row k="Mz / Lt" v={`${propiedad.manzana ?? '—'} / ${propiedad.lote ?? '—'}`} />
          <Row k="Tipo" v={propiedad.tipo} />
          <Row k="Modelo" v={propiedad.modelo ?? '—'} />
          <Row k="Precio" v={formatMoney(propiedad.precio_venta ?? propiedad.precio_lista, propiedad.moneda)} />
          <Row k="Estado físico" v={propiedad.estado_fisico} />
          <Row k="Estado comercial" v={propiedad.estado_comercial} />

          {propiedad.estado_fisico === 'bloqueado' && (
            <div className="mt-3 rounded bg-sky-50 p-3 text-sky-900">
              <strong>Bloqueo:</strong> {propiedad.bloqueada_motivo ?? 'sin motivo'}
              {canAdmin && (
                <button onClick={desbloquear} className="ml-3 rounded bg-sky-600 px-2 py-1 text-xs text-white">Desbloquear</button>
              )}
            </div>
          )}

          {venta && (
            <div className="mt-4 rounded border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Venta activa</div>
              {cliente && (
                <Row k="Cliente" v={`${cliente.nombres} ${cliente.apellidos} · DNI ${cliente.dni}`} />
              )}
              <Row k="Estado" v={venta.estado} />
              {venta.estado === 'separacion' && (
                <>
                  <Row k="Vencimiento" v={formatDateTime(venta.fecha_vencimiento_separacion)} />
                  <Row k="Tiempo restante" v={timeRemaining(venta.fecha_vencimiento_separacion)} />
                </>
              )}
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/v2/ventas/${venta.id}`}
                  className="rounded bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-500"
                >
                  Abrir venta
                </Link>
                {canAdmin && (
                  <button onClick={liberar} className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-500">
                    Liberar unidad
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-slate-500">{k}</span>
      <span className="font-medium text-slate-900 capitalize">{v}</span>
    </div>
  );
}

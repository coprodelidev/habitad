'use client';

import Link from 'next/link';
import { supabasePublic, supabaseV2 } from '@/lib/v2/supabaseV2';
import type { Propiedad, Venta, SaldoVenta } from '@/lib/v2/types';
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
  const [cliente, setCliente] = useState<{ nombres: string; apellidos: string; dni: string; telefono: string | null; email: string | null } | null>(null);
  const [promotor, setPromotor] = useState<{ first_name: string | null; last_name: string | null; email: string | null } | null>(null);
  const [saldo, setSaldo] = useState<SaldoVenta | null>(null);

  useEffect(() => {
    if (venta?.cliente_id) {
      supabaseV2.from('clientes').select('nombres, apellidos, dni, telefono, email').eq('id', venta.cliente_id).maybeSingle()
        .then((res: any) => setCliente(res?.data ?? null));
    }
    if (venta?.id) {
      supabaseV2.from('vw_saldos_venta').select('*').eq('venta_id', venta.id).maybeSingle()
        .then((res: any) => setSaldo(res?.data ?? null));
    }
    if (venta?.promotor_id) {
      supabasePublic.from('profiles').select('first_name, last_name, email').eq('id', venta.promotor_id).maybeSingle()
        .then((res: any) => setPromotor(res?.data ?? null));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="inline-block max-h-[90vh] w-auto min-w-[360px] max-w-md overflow-y-auto rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h2 className="text-base font-semibold">Detalle de unidad</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="p-4 text-sm">
          <div className="mb-2 font-mono text-xs text-slate-500">{propiedad.cuh}</div>
          <div className="space-y-0.5">
            <Row k="Mz / Lt" v={`${propiedad.manzana ?? '—'} / ${propiedad.lote ?? '—'}`} />
            <Row k="Tipo" v={propiedad.tipo} />
            <Row k="Modelo" v={propiedad.modelo ?? '—'} />
            <Row k="Precio" v={formatMoney(propiedad.precio_venta ?? propiedad.precio_lista, propiedad.moneda)} />
            <Row k="Moneda" v={propiedad.moneda} />
            <Row k="Esquina/parque" v={getReferenciaUnidad(propiedad)} />
            <Row k="Estado físico" v={propiedad.estado_fisico} />
            <Row k="Estado comercial" v={propiedad.estado_comercial} />
          </div>

          {propiedad.estado_fisico === 'bloqueado' && (
            <div className="mt-3 rounded bg-sky-50 p-3 text-sky-900">
              <strong>Bloqueo:</strong> {propiedad.bloqueada_motivo ?? 'sin motivo'}
              {canAdmin && (
                <button onClick={desbloquear} className="ml-3 rounded bg-sky-600 px-2 py-1 text-xs text-white">Desbloquear</button>
              )}
            </div>
          )}

          {venta && (
            <div className="mt-4 space-y-3">
              <div className="rounded border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Cliente</div>
                {cliente ? (
                  <>
                    <Row k="Nombre" v={`${cliente.nombres} ${cliente.apellidos}`} />
                    <Row k="DNI" v={cliente.dni} />
                    {cliente.telefono && <Row k="Teléfono" v={cliente.telefono} />}
                    {cliente.email && <Row k="Email" v={cliente.email} />}
                  </>
                ) : (
                  <div className="text-slate-500">Cargando…</div>
                )}
              </div>

              <div className="rounded border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Venta</div>
                <Row k="Estado" v={venta.estado} />
                <Row k="Promotor" v={promotor ? `${promotor.first_name ?? ''} ${promotor.last_name ?? ''}`.trim() || promotor.email : 'â€”'} />
                {venta.estado === 'separacion' && (
                  <>
                    <Row k="Vencimiento" v={formatDateTime(venta.fecha_vencimiento_separacion)} />
                    <Row k="Tiempo restante" v={timeRemaining(venta.fecha_vencimiento_separacion)} />
                  </>
                )}
                {venta.fecha_contrato && <Row k="Contrato emitido" v={formatDateTime(venta.fecha_contrato)} />}
              </div>

              {saldo && (
                <div className="rounded border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Estado de pagos</div>
                  <Row k="Precio acordado" v={formatMoney(saldo.precio_acordado, saldo.moneda)} />
                  <Row k="Total separación" v={formatMoney(saldo.total_separacion, saldo.moneda)} />
                  <Row k="Total inicial" v={formatMoney(saldo.total_inicial, saldo.moneda)} />
                  <Row k="Total cuotas" v={formatMoney(saldo.total_cuotas, saldo.moneda)} />
                  <div className="my-1 border-t border-slate-200" />
                  <Row k="Total pagado" v={formatMoney(saldo.total_pagado, saldo.moneda)} highlight />
                  <Row k="Saldo pendiente" v={formatMoney(saldo.saldo_pendiente, saldo.moneda)} highlight />
                  {saldo.saldo_favor > 0 && <Row k="Saldo a favor" v={formatMoney(saldo.saldo_favor, saldo.moneda)} />}
                </div>
              )}

              <div className="flex gap-2">
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

function Row({ k, v, highlight }: { k: string; v: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex justify-between py-0.5 text-sm">
      <span className="text-slate-500">{k}</span>
      <span className={`capitalize ${highlight ? 'font-semibold text-slate-900' : 'text-slate-800'}`}>{v}</span>
    </div>
  );
}

function getReferenciaUnidad(propiedad: Propiedad): string {
  const adicionales = propiedad.adicionales ?? {};
  const valores = [
    (adicionales as any).esquina ? 'Esquina' : null,
    (adicionales as any).parque ? 'Parque' : null,
  ].filter(Boolean);
  return valores.length ? valores.join(' / ') : 'â€”';
}

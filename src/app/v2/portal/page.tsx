'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseV2, supabasePublic } from '@/lib/v2/supabaseV2';
import { useV2User } from '@/lib/v2/useV2User';
import { isCliente } from '@/lib/v2/permissions';
import { formatDate, formatMoney } from '@/lib/v2/format';
import type { Venta, Propiedad, Cuota, Pago, SaldoVenta } from '@/lib/v2/types';

interface MiVenta {
  venta: Venta;
  propiedad: Propiedad | null;
  saldo: SaldoVenta | null;
  cuotas: Cuota[];
  pagos: Pago[];
}

export default function PortalClientePage() {
  const { user } = useV2User();
  const [ventas, setVentas] = useState<MiVenta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: cli } = await supabasePublic.from('clientes').select('id').eq('auth_user_id', user.id);
      const clienteIds = ((cli ?? []) as { id: string }[]).map((c) => c.id);
      if (clienteIds.length === 0) {
        setVentas([]);
        setLoading(false);
        return;
      }
      const { data: vs } = await supabaseV2.from('ventas').select('*').in('cliente_id', clienteIds);
      const out: MiVenta[] = [];
      for (const v of (vs ?? []) as Venta[]) {
        const [p, s, cts, pgs] = await Promise.all([
          supabaseV2.from('propiedades').select('*').eq('id', v.propiedad_id).maybeSingle(),
          supabaseV2.from('vw_saldos_venta').select('*').eq('venta_id', v.id).maybeSingle(),
          supabaseV2.from('cuotas').select('*').eq('venta_id', v.id).order('numero'),
          supabaseV2.from('pagos').select('*').eq('venta_id', v.id).order('fecha_deposito'),
        ]);
        out.push({
          venta: v,
          propiedad: (p.data ?? null) as Propiedad | null,
          saldo: (s.data ?? null) as SaldoVenta | null,
          cuotas: (cts.data ?? []) as Cuota[],
          pagos: (pgs.data ?? []) as Pago[],
        });
      }
      setVentas(out);
      setLoading(false);
    })();
  }, [user]);

  if (!isCliente(user?.roleCode)) {
    return <div className="rounded bg-yellow-50 p-4 text-sm text-yellow-800">Esta vista es para clientes.</div>;
  }

  if (loading) return <div>Cargando…</div>;
  if (ventas.length === 0) return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Aún no tienes ventas asociadas a tu cuenta.</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Mis ventas</h1>
      {ventas.map(({ venta, propiedad, saldo, cuotas, pagos }) => (
        <div key={venta.id} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="font-mono text-xs text-slate-500">{propiedad?.cuh}</div>
              <h3 className="text-lg font-semibold">
                Mz {propiedad?.manzana ?? '—'} / Lt {propiedad?.lote ?? '—'} · {propiedad?.tipo}
              </h3>
              <div className="text-sm capitalize text-slate-700">Estado: {venta.estado}</div>
            </div>
            <div className="text-right text-sm">
              <div className="text-slate-500">Precio acordado</div>
              <div className="text-lg font-semibold">{formatMoney(venta.precio_acordado, venta.moneda)}</div>
            </div>
          </div>

          {saldo && (
            <div className="mb-4 grid grid-cols-2 gap-2 rounded bg-slate-50 p-3 text-sm md:grid-cols-4">
              <Metric label="Total pagado" value={formatMoney(saldo.total_pagado, venta.moneda)} />
              <Metric label="Saldo pendiente" value={formatMoney(saldo.saldo_pendiente, venta.moneda)} />
              <Metric label="Saldo a favor" value={formatMoney(saldo.saldo_favor, venta.moneda)} />
              <Metric label="Cuotas pagadas" value={`${cuotas.filter((c) => c.estado === 'pagada').length}/${cuotas.length}`} />
            </div>
          )}

          {cuotas.length > 0 && (
            <details className="mb-3">
              <summary className="cursor-pointer text-sm font-medium text-indigo-600">Ver cronograma ({cuotas.length})</summary>
              <table className="mt-2 min-w-full text-xs">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-2 py-1">#</th>
                    <th className="px-2 py-1">Vencimiento</th>
                    <th className="px-2 py-1 text-right">Monto</th>
                    <th className="px-2 py-1 text-right">Pagado</th>
                    <th className="px-2 py-1">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {cuotas.map((c) => (
                    <tr key={c.id} className="border-t border-slate-100">
                      <td className="px-2 py-1">{c.numero}</td>
                      <td className="px-2 py-1">{formatDate(c.fecha_vencimiento)}</td>
                      <td className="px-2 py-1 text-right">{formatMoney(c.monto, c.moneda)}</td>
                      <td className="px-2 py-1 text-right">{formatMoney(c.monto_pagado, c.moneda)}</td>
                      <td className="px-2 py-1 capitalize">{c.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}

          <div className="flex gap-2 text-xs">
            <Link href={`/v2/print/separacion/${venta.id}`} target="_blank" className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-50">
              Hoja separación
            </Link>
            {venta.fecha_contrato && (
              <>
                <Link href={`/v2/print/contrato/${venta.id}`} target="_blank" className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-50">
                  Contrato
                </Link>
                <Link href={`/v2/print/cronograma/${venta.id}`} target="_blank" className="rounded border border-slate-300 px-2 py-1 hover:bg-slate-50">
                  Cronograma
                </Link>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold text-slate-900">{value}</div>
    </div>
  );
}

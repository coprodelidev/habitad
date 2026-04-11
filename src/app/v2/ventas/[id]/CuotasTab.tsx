'use client';

import { useState } from 'react';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import type { Venta, Cuota, Pago } from '@/lib/v2/types';
import { PagoForm } from './PagoForm';
import { formatDate, formatMoney } from '@/lib/v2/format';
import { DocumentDrawer } from '@/components/v2/DocumentDrawer';

export function CuotasTab({
  venta,
  cuotas,
  pagos,
  canOperate,
  canAdmin,
  onChange,
}: {
  venta: Venta;
  cuotas: Cuota[];
  pagos: Pago[];
  canOperate: boolean;
  canAdmin: boolean;
  onChange: () => void;
}) {
  const [showForm, setShowForm] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);

  const anularPago = async (pagoId: string) => {
    if (!confirm('¿Anular este pago? Se revertirá su aplicación a las cuotas y al saldo a favor.')) return;
    const { error } = await supabaseV2.rpc('anular_pago', { p_pago_id: pagoId });
    if (error) setError(error.message);
    else onChange();
  };

  const totalPagado = pagos.filter((p) => p.tipo === 'cuota' && p.estado !== 'anulado').reduce((a, p) => a + Number(p.monto), 0);
  const totalCuotas = cuotas.reduce((a, c) => a + Number(c.monto), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Cuotas</h3>
        {canOperate && (
          <button
            onClick={() => setShowForm(0)}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-500"
          >
            Registrar pago libre
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <Metric label="Total cronograma" value={formatMoney(totalCuotas, venta.moneda)} />
        <Metric label="Pagado en cuotas" value={formatMoney(totalPagado, venta.moneda)} />
        <Metric label="Pendiente" value={formatMoney(Math.max(0, totalCuotas - totalPagado), venta.moneda)} />
      </div>

      {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Vencimiento</th>
              <th className="px-4 py-2 text-right">Monto</th>
              <th className="px-4 py-2 text-right">Pagado</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {cuotas.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{c.numero}</td>
                <td className="px-4 py-2">{formatDate(c.fecha_vencimiento)}</td>
                <td className="px-4 py-2 text-right">{formatMoney(c.monto, c.moneda)}</td>
                <td className="px-4 py-2 text-right">{formatMoney(c.monto_pagado, c.moneda)}</td>
                <td className="px-4 py-2">
                  <EstadoCuotaBadge estado={c.estado} />
                </td>
                <td className="px-4 py-2 text-right">
                  {canOperate && c.estado !== 'pagada' && (
                    <button
                      onClick={() => setShowForm(c.numero)}
                      className="rounded bg-indigo-600 px-2 py-1 text-xs text-white"
                    >
                      Pagar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {cuotas.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Sin cronograma generado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-2 text-xs font-semibold uppercase text-slate-500">
          Pagos registrados
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Cuota</th>
              <th className="px-4 py-2">Nº op.</th>
              <th className="px-4 py-2">Banco</th>
              <th className="px-4 py-2 text-right">Monto</th>
              <th className="px-4 py-2">Voucher</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {pagos.filter((p) => p.tipo === 'cuota').map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{formatDate(p.fecha_deposito)}</td>
                <td className="px-4 py-2">{p.cuota_numero ? `#${p.cuota_numero}` : '—'}</td>
                <td className="px-4 py-2 font-mono">{p.numero_operacion ?? '—'}</td>
                <td className="px-4 py-2">{p.banco ?? '—'}</td>
                <td className="px-4 py-2 text-right">{formatMoney(p.monto, p.moneda)}</td>
                <td className="px-4 py-2">
                  {p.voucher_url ? (
                    <button onClick={() => setViewing(p.voucher_url!)} className="text-indigo-600 hover:underline">Ver</button>
                  ) : '—'}
                </td>
                <td className="px-4 py-2 capitalize">{p.estado}</td>
                <td className="px-4 py-2 text-right">
                  {canAdmin && p.estado !== 'anulado' && (
                    <button onClick={() => anularPago(p.id)} className="text-xs text-red-600 hover:underline">Anular</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm !== null && (
        <PagoForm
          venta={venta}
          tipo="cuota"
          cuotaNumero={showForm || undefined}
          onClose={() => setShowForm(null)}
          onSaved={() => { setShowForm(null); onChange(); }}
        />
      )}
      {viewing && (
        <DocumentDrawer
          bucket="v2-vouchers"
          path={viewing}
          title="Voucher de cuota"
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}

function EstadoCuotaBadge({ estado }: { estado: string }) {
  const c: Record<string, string> = {
    pendiente: 'bg-slate-100 text-slate-700',
    parcial: 'bg-yellow-100 text-yellow-800',
    pagada: 'bg-green-100 text-green-800',
    vencida: 'bg-red-100 text-red-800',
  };
  return <span className={`rounded px-2 py-0.5 text-xs capitalize ${c[estado] ?? c.pendiente}`}>{estado}</span>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-base font-semibold text-slate-900">{value}</div>
    </div>
  );
}

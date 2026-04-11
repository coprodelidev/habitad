'use client';

import { useState } from 'react';
import type { Venta, Pago } from '@/lib/v2/types';
import { PagoForm } from './PagoForm';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { formatDate, formatMoney } from '@/lib/v2/format';
import { DocumentDrawer } from '@/components/v2/DocumentDrawer';

export function InicialTab({
  venta,
  pagos,
  canOperate,
  canAdmin,
  onChange,
}: {
  venta: Venta;
  pagos: Pago[];
  canOperate: boolean;
  canAdmin: boolean;
  onChange: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [objetivo, setObjetivo] = useState(venta.monto_inicial_objetivo?.toString() ?? '');
  const [savingObj, setSavingObj] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);

  const pagosInicial = pagos.filter((p) => p.tipo === 'inicial' && p.estado !== 'anulado');
  const totalInicial = pagosInicial.reduce((a, p) => a + Number(p.monto), 0);
  const objNum = Number(venta.monto_inicial_objetivo ?? 0);
  const pct = objNum > 0 ? Math.min(100, (totalInicial / objNum) * 100) : 0;
  const completa = objNum > 0 && totalInicial >= objNum;

  const guardarObjetivo = async () => {
    setSavingObj(true);
    await supabaseV2.from('ventas').update({ monto_inicial_objetivo: Number(objetivo || 0) }).eq('id', venta.id);
    setSavingObj(false);
    onChange();
  };

  const marcarInicialCompleta = async () => {
    await supabaseV2.from('ventas').update({ fecha_inicial_completa: new Date().toISOString() }).eq('id', venta.id);
    onChange();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Inicial</h3>
        {canOperate && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-500"
          >
            Registrar abono
          </button>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <div className="mb-2 grid grid-cols-1 gap-2 md:grid-cols-3">
          <div>
            <div className="text-xs text-slate-500">Monto objetivo</div>
            <div className="flex gap-2">
              <input
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
                disabled={!canOperate || !!venta.fecha_inicial_completa}
                className="h-9 flex-1 rounded-md border border-slate-300 px-3 text-sm"
                placeholder="0.00"
              />
              {canOperate && !venta.fecha_inicial_completa && (
                <button onClick={guardarObjetivo} disabled={savingObj} className="rounded bg-slate-700 px-3 text-xs text-white">
                  OK
                </button>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Total abonado</div>
            <div className="mt-1 text-lg font-semibold">{formatMoney(totalInicial, venta.moneda)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Límite inicial</div>
            <div className="mt-1">{formatDate(venta.fecha_limite_inicial)}</div>
          </div>
        </div>
        <div className="mt-3 h-2 w-full rounded bg-slate-100">
          <div className={`h-full rounded ${completa ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 text-xs text-slate-500">{pct.toFixed(1)}% completado</div>

        {completa && !venta.fecha_inicial_completa && canOperate && (
          <button onClick={marcarInicialCompleta} className="mt-3 rounded bg-green-600 px-3 py-1.5 text-sm text-white">
            Marcar inicial completa → habilitar contrato
          </button>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-2 text-xs font-semibold uppercase text-slate-500">
          Abonos de inicial
        </div>
        {pagosInicial.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">Sin abonos registrados.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Nº op.</th>
                <th className="px-4 py-2">Banco</th>
                <th className="px-4 py-2 text-right">Monto</th>
                <th className="px-4 py-2">Voucher</th>
              </tr>
            </thead>
            <tbody>
              {pagosInicial.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{formatDate(p.fecha_deposito)}</td>
                  <td className="px-4 py-2 font-mono">{p.numero_operacion ?? '—'}</td>
                  <td className="px-4 py-2">{p.banco ?? '—'}</td>
                  <td className="px-4 py-2 text-right">{formatMoney(p.monto, p.moneda)}</td>
                  <td className="px-4 py-2">
                    {p.voucher_url ? (
                      <button onClick={() => setViewing(p.voucher_url!)} className="text-indigo-600 hover:underline">Ver</button>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <PagoForm
          venta={venta}
          tipo="inicial"
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); onChange(); }}
        />
      )}
      {viewing && (
        <DocumentDrawer
          bucket="v2-vouchers"
          path={viewing}
          title="Voucher de inicial"
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}

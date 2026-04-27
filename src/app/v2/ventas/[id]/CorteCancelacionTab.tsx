'use client';

import { useState } from 'react';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import type { SaldoVenta, Venta, CorteCancelacionForma } from '@/lib/v2/types';
import { formatDateTime, formatMoney } from '@/lib/v2/format';

export function CorteCancelacionTab({
  venta,
  saldos,
  canOperate,
  onChange,
}: {
  venta: Venta;
  saldos: SaldoVenta | null;
  canOperate: boolean;
  onChange: () => void;
}) {
  const [forma, setForma] = useState<CorteCancelacionForma>((venta.corte_cancelacion_forma ?? 'efectivo') as CorteCancelacionForma);
  const [monto, setMonto] = useState(venta.corte_cancelacion_monto?.toString() ?? String(saldos?.saldo_pendiente ?? ''));
  const [notas, setNotas] = useState(venta.corte_cancelacion_notas ?? '');
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setOk(false);
    setError(null);
    const { error } = await supabaseV2.from('ventas').update({
      corte_cancelacion_fecha: new Date().toISOString(),
      corte_cancelacion_forma: forma,
      corte_cancelacion_monto: monto ? Number(monto) : null,
      corte_cancelacion_notas: notas || null,
    }).eq('id', venta.id);
    setSaving(false);
    if (error) setError(error.message);
    else {
      setOk(true);
      onChange();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Corte de cancelacion</h3>
        <p className="text-xs text-slate-500">
          Se usa cuando se define si el cliente cancela el saldo en efectivo o con credito hipotecario.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Metric label="Precio venta" value={formatMoney(venta.precio_acordado, venta.moneda)} />
        <Metric label="Total pagado" value={formatMoney(saldos?.total_pagado ?? 0, venta.moneda)} />
        <Metric label="Saldo pendiente" value={formatMoney(saldos?.saldo_pendiente ?? 0, venta.moneda)} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-600">Forma de cancelacion</label>
            <select
              value={forma}
              onChange={(e) => setForma(e.target.value as CorteCancelacionForma)}
              disabled={!canOperate}
              className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
            >
              <option value="efectivo">Pago en efectivo</option>
              <option value="credito_hipotecario">Credito hipotecario</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600">Monto del corte</label>
            <input
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              disabled={!canOperate}
              className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
              placeholder="0.00"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-slate-600">Notas</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              disabled={!canOperate}
              className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Detalle del acuerdo de cancelacion"
            />
          </div>
        </div>
        {venta.corte_cancelacion_fecha && (
          <div className="mt-3 text-xs text-slate-500">Ultimo corte: {formatDateTime(venta.corte_cancelacion_fecha)}</div>
        )}
        {error && <div className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
        {ok && <div className="mt-3 rounded bg-emerald-50 p-2 text-sm text-emerald-700">Corte guardado.</div>}
        {canOperate && (
          <button
            onClick={save}
            disabled={saving}
            className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar corte'}
          </button>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-base font-semibold text-slate-900">{value}</div>
    </div>
  );
}

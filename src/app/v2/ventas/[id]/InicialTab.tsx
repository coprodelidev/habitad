'use client';

import { useState } from 'react';
import type { Venta, Pago, Propiedad, Moneda } from '@/lib/v2/types';
import { PagoForm } from './PagoForm';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { formatDate, formatMoney } from '@/lib/v2/format';
import { DocumentDrawer } from '@/components/v2/DocumentDrawer';
import { parseAmountInput } from '@/lib/v2/amount';

export function InicialTab({
  venta,
  propiedad,
  pagos,
  canOperate,
  canAdmin,
  onChange,
}: {
  venta: Venta;
  propiedad: Propiedad | null;
  pagos: Pago[];
  canOperate: boolean;
  canAdmin: boolean;
  onChange: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [objetivo, setObjetivo] = useState(venta.monto_inicial_objetivo?.toString() ?? '');
  const [descuentoTipo, setDescuentoTipo] = useState(venta.descuento_tipo ?? '');
  const [descuentoMonto, setDescuentoMonto] = useState(venta.descuento_monto?.toString() ?? '');
  const [descuentoDescripcion, setDescuentoDescripcion] = useState(venta.descuento_descripcion ?? '');
  const [savingObj, setSavingObj] = useState(false);
  const [savingConfirm, setSavingConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);

  const pagosSeparacion = pagos.filter((p) => p.tipo === 'separacion' && p.estado !== 'anulado');
  const pagosInicial = pagos.filter((p) => p.tipo === 'inicial' && p.estado !== 'anulado');
  const pagosHastaInicial = [...pagosSeparacion, ...pagosInicial].sort((a, b) => String(a.fecha_deposito).localeCompare(String(b.fecha_deposito)));
  const totalSeparacion = sumByMoneda(pagosSeparacion);
  const totalInicial = sumByMoneda(pagosInicial);
  const totalHastaInicial = sumByMoneda(pagosHastaInicial);
  const totalHastaInicialVentaMoneda = totalHastaInicial[venta.moneda] ?? 0;
  const objNum = Number(venta.monto_inicial_objetivo ?? 0);
  const esCasa = propiedad?.tipo === 'casa';
  const objetivoLocal = parseAmountInput(objetivo || '0');
  const descuentoLocal = parseAmountInput(descuentoMonto);
  const descuento = esCasa ? (Number.isFinite(descuentoLocal) ? descuentoLocal : Number(venta.descuento_monto ?? 0)) : 0;
  const objetivoActual = Number.isFinite(objetivoLocal) ? objetivoLocal : objNum;
  const pct = objetivoActual > 0 ? Math.min(100, (totalHastaInicialVentaMoneda / objetivoActual) * 100) : 0;
  const completa = objetivoActual > 0 && totalHastaInicialVentaMoneda >= objetivoActual;

  const guardarConfiguracionInicial = async (refresh = true) => {
    setError(null);
    const objetivoNum = parseAmountInput(objetivo || '0');
    const descuentoNum = parseAmountInput(descuentoMonto || '0');
    if (!Number.isFinite(objetivoNum) || objetivoNum < 0) {
      throw new Error('Ingresa un monto objetivo valido.');
    }
    if (esCasa && (!Number.isFinite(descuentoNum) || descuentoNum < 0)) {
      throw new Error('Ingresa un monto de descuento valido.');
    }
    setSavingObj(true);
    const { error: updateError } = await supabaseV2.from('ventas').update({
      monto_inicial_objetivo: objetivoNum,
      descuento_tipo: esCasa ? descuentoTipo || null : null,
      descuento_monto: esCasa ? descuentoNum : 0,
      descuento_descripcion: esCasa ? descuentoDescripcion || null : null,
    }).eq('id', venta.id);
    setSavingObj(false);
    if (updateError) throw updateError;
    if (refresh) onChange();
  };

  const guardarObjetivo = async () => {
    try {
      await guardarConfiguracionInicial();
    } catch (e: any) {
      setSavingObj(false);
      setError(e?.message ?? String(e));
    }
  };

  const abrirRegistroAbono = async () => {
    if (!canOperate || venta.fecha_inicial_completa) return;
    try {
      await guardarConfiguracionInicial(false);
      setShowForm(true);
    } catch (e: any) {
      setSavingObj(false);
      setError(e?.message ?? String(e));
    }
  };

  const marcarInicialCompleta = async () => {
    setSavingConfirm(true);
    setError(null);
    try {
      await guardarConfiguracionInicial(false);
      const { error: updateError } = await supabaseV2
        .from('ventas')
        .update({ fecha_inicial_completa: new Date().toISOString() })
        .eq('id', venta.id);
      if (updateError) throw updateError;
      onChange();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setSavingConfirm(false);
      setSavingObj(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Inicial</h3>
        {canOperate && (
          <button
            onClick={abrirRegistroAbono}
            disabled={savingObj || !!venta.fecha_inicial_completa}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {savingObj ? 'Guardando...' : 'Registrar abono'}
          </button>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <div className="mb-2 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <div className="text-xs text-slate-500">Monto objetivo</div>
            <div className="flex gap-2">
              <input
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
                disabled={!canOperate || !!venta.fecha_inicial_completa}
                className="h-9 flex-1 rounded-md border border-slate-300 px-3 text-sm"
                placeholder="Puede ser mayor al 5%"
              />
              {canOperate && !venta.fecha_inicial_completa && (
                <button onClick={guardarObjetivo} disabled={savingObj} className="rounded bg-slate-700 px-3 text-xs text-white">
                  OK
                </button>
              )}
            </div>
          </div>
          <Metric label="Pago separacion" value={formatBreakdown(totalSeparacion)} />
          <Metric label="Abonado inicial" value={formatBreakdown(totalInicial)} />
          <Metric label="Total hasta inicial" value={formatBreakdown(totalHastaInicial)} />
          <Metric label="Saldo inicial" value={formatMoney(Math.max(0, objetivoActual - totalHastaInicialVentaMoneda), venta.moneda)} />
          {esCasa && <Metric label="Descuento" value={formatMoney(descuento, venta.moneda)} />}
          <Metric label="Limite inicial" value={formatDate(venta.fecha_limite_inicial)} />
        </div>

        {esCasa && <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-slate-600">Tipo descuento</label>
            <select
              value={descuentoTipo}
              onChange={(e) => setDescuentoTipo(e.target.value)}
              disabled={!canOperate || !!venta.fecha_inicial_completa}
              className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
            >
              <option value="">Sin descuento</option>
              <option value="profesores">Profesores</option>
              <option value="personal">Personal</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600">Monto descuento</label>
            <input
              value={descuentoMonto}
              onChange={(e) => setDescuentoMonto(e.target.value)}
              disabled={!canOperate || !!venta.fecha_inicial_completa}
              className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600">Detalle</label>
            <input
              value={descuentoDescripcion}
              onChange={(e) => setDescuentoDescripcion(e.target.value)}
              disabled={!canOperate || !!venta.fecha_inicial_completa}
              className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
              placeholder="Observacion para contrato"
            />
          </div>
        </div>}
        {esCasa && canOperate && !venta.fecha_inicial_completa && (
          <button
            onClick={guardarObjetivo}
            disabled={savingObj}
            className="mt-3 rounded bg-slate-700 px-3 py-1.5 text-xs text-white disabled:opacity-50"
          >
            {savingObj ? 'Guardando...' : 'Guardar objetivo y descuento'}
          </button>
        )}

        <div className="mt-3 h-2 w-full rounded bg-slate-100">
          <div className={`h-full rounded ${completa ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 text-xs text-slate-500">{pct.toFixed(1)}% completado</div>
        {error && <div className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        {completa && !venta.fecha_inicial_completa && canOperate && (
          <button
            onClick={marcarInicialCompleta}
            disabled={savingConfirm || savingObj}
            className="mt-3 rounded bg-green-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {savingConfirm ? 'Confirmando...' : 'Confirmar inicial completa y habilitar contrato'}
          </button>
        )}
      </div>

      <PagosTable
        title="Pagos desde separacion hasta completar inicial"
        empty="Sin pagos de separacion o inicial registrados."
        pagos={pagosHastaInicial}
        onViewVoucher={setViewing}
      />

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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function PagosTable({
  title,
  empty,
  pagos,
  onViewVoucher,
}: {
  title: string;
  empty: string;
  pagos: Pago[];
  onViewVoucher: (url: string) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-2 text-xs font-semibold uppercase text-slate-500">
        {title}
      </div>
      {pagos.length === 0 ? (
        <div className="p-4 text-sm text-slate-500">{empty}</div>
      ) : (
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Nro op.</th>
              <th className="px-4 py-2">Banco</th>
              <th className="px-4 py-2 text-right">Monto</th>
              <th className="px-4 py-2">Voucher</th>
            </tr>
          </thead>
          <tbody>
            {pagos.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{formatDate(p.fecha_deposito)}</td>
                <td className="px-4 py-2 capitalize">{p.tipo}</td>
                <td className="px-4 py-2 font-mono">{p.numero_operacion ?? '-'}</td>
                <td className="px-4 py-2">{p.banco ?? '-'}</td>
                <td className="px-4 py-2 text-right">{formatMoney(p.monto, p.moneda)}</td>
                <td className="px-4 py-2">
                  {p.voucher_url ? (
                    <button onClick={() => onViewVoucher(p.voucher_url!)} className="text-indigo-600 hover:underline">Ver</button>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function sumByMoneda(pagos: Pago[]): Record<Moneda, number> {
  return pagos.reduce<Record<Moneda, number>>((acc, pago) => {
    acc[pago.moneda] = (acc[pago.moneda] ?? 0) + Number(pago.monto);
    return acc;
  }, { PEN: 0, USD: 0 });
}

function formatBreakdown(totals: Record<Moneda, number>): string {
  const parts: string[] = [];
  if (totals.PEN) parts.push(formatMoney(totals.PEN, 'PEN'));
  if (totals.USD) parts.push(formatMoney(totals.USD, 'USD'));
  return parts.length ? parts.join(' / ') : formatMoney(0, 'PEN');
}

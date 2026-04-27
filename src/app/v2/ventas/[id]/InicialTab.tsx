'use client';

import { useState } from 'react';
import type { Venta, Pago, Propiedad, Moneda } from '@/lib/v2/types';
import { PagoForm } from './PagoForm';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { formatDate, formatMoney } from '@/lib/v2/format';
import { DocumentDrawer } from '@/components/v2/DocumentDrawer';

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
  const descuento = esCasa ? Number(venta.descuento_monto ?? 0) : 0;
  const pct = objNum > 0 ? Math.min(100, (totalHastaInicialVentaMoneda / objNum) * 100) : 0;
  const completa = objNum > 0 && totalHastaInicialVentaMoneda >= objNum;

  const guardarObjetivo = async () => {
    setSavingObj(true);
    await supabaseV2.from('ventas').update({
      monto_inicial_objetivo: Number(objetivo || 0),
      descuento_tipo: esCasa ? descuentoTipo || null : null,
      descuento_monto: esCasa && descuentoMonto ? Number(descuentoMonto) : 0,
      descuento_descripcion: esCasa ? descuentoDescripcion || null : null,
    }).eq('id', venta.id);
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
          <Metric label="Saldo inicial" value={formatMoney(Math.max(0, objNum - totalHastaInicialVentaMoneda), venta.moneda)} />
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

        <div className="mt-3 h-2 w-full rounded bg-slate-100">
          <div className={`h-full rounded ${completa ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 text-xs text-slate-500">{pct.toFixed(1)}% completado</div>

        {completa && !venta.fecha_inicial_completa && canOperate && (
          <button onClick={marcarInicialCompleta} className="mt-3 rounded bg-green-600 px-3 py-1.5 text-sm text-white">
            Confirmar inicial completa y habilitar contrato
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

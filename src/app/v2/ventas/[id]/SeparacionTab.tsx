'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Venta, Pago } from '@/lib/v2/types';
import { PagoForm } from './PagoForm';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { formatDate, formatMoney } from '@/lib/v2/format';

export function SeparacionTab({
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
  const [error, setError] = useState<string | null>(null);

  const pagosSeparacion = pagos.filter((p) => p.tipo === 'separacion' && p.estado !== 'anulado');
  const total = pagosSeparacion.reduce((a, p) => a + Number(p.monto), 0);
  const pagado = !!venta.fecha_pago_separacion;

  const confirmarPago = async (pagoId: string) => {
    setError(null);
    const { data: paramMeses } = await supabaseV2.from('parametros').select('valor').eq('clave', 'inicial_meses').maybeSingle();
    const meses = Number(paramMeses?.valor ?? 3);
    const limite = new Date();
    limite.setMonth(limite.getMonth() + meses);
    const { error } = await supabaseV2.from('ventas').update({
      fecha_pago_separacion: new Date().toISOString(),
      fecha_limite_inicial: limite.toISOString(),
      estado: 'inicial',
    }).eq('id', venta.id);
    if (error) setError(error.message);
    else onChange();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Separación</h3>
        <div className="flex gap-2">
          <Link
            href={`/v2/print/separacion/${venta.id}`}
            target="_blank"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Hoja de separación (PDF)
          </Link>
          {canOperate && !pagado && (
            <button
              onClick={() => setShowForm(true)}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-500"
            >
              Registrar pago
            </button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <div className="mb-2 flex justify-between">
          <span className="text-slate-500">Estado</span>
          <span className={`font-medium ${pagado ? 'text-green-700' : 'text-yellow-700'}`}>
            {pagado ? 'Pagada' : 'Pendiente'}
          </span>
        </div>
        <div className="mb-2 flex justify-between">
          <span className="text-slate-500">Vencimiento</span>
          <span>{formatDate(venta.fecha_vencimiento_separacion)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Total abonado</span>
          <span className="font-medium">{formatMoney(total, venta.moneda)}</span>
        </div>
      </div>

      {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-2 text-xs font-semibold uppercase text-slate-500">
          Pagos de separación
        </div>
        {pagosSeparacion.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">Sin pagos registrados.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Nº op.</th>
                <th className="px-4 py-2">Banco</th>
                <th className="px-4 py-2 text-right">Monto</th>
                <th className="px-4 py-2">Voucher</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {pagosSeparacion.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{formatDate(p.fecha_deposito)}</td>
                  <td className="px-4 py-2 font-mono">{p.numero_operacion ?? '—'}</td>
                  <td className="px-4 py-2">{p.banco ?? '—'}</td>
                  <td className="px-4 py-2 text-right">{formatMoney(p.monto, p.moneda)}</td>
                  <td className="px-4 py-2">
                    {p.voucher_url ? (
                      <a href={p.voucher_url} target="_blank" className="text-indigo-600 hover:underline">Ver</a>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {canOperate && !pagado && (
                      <button
                        onClick={() => confirmarPago(p.id)}
                        className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-500"
                      >
                        Confirmar → Inicial
                      </button>
                    )}
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
          tipo="separacion"
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); onChange(); }}
        />
      )}
    </div>
  );
}

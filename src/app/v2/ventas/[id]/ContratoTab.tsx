'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import type { Venta, Propiedad, Cliente, Pago, Cuota } from '@/lib/v2/types';
import { formatDate, formatMoney } from '@/lib/v2/format';

export function ContratoTab({
  venta,
  propiedad,
  cliente,
  pagos,
  cuotas,
  canOperate,
  onChange,
}: {
  venta: Venta;
  propiedad: Propiedad | null;
  cliente: Cliente | null;
  pagos: Pago[];
  cuotas: Cuota[];
  canOperate: boolean;
  onChange: () => void;
}) {
  const [meses, setMeses] = useState(venta.meses_cuotas?.toString() ?? '24');
  const [primeraCuota, setPrimeraCuota] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPagado = pagos
    .filter((p) => p.estado !== 'anulado' && (p.tipo === 'separacion' || p.tipo === 'inicial'))
    .reduce((a, p) => a + Number(p.monto), 0);
  const saldoCuotas = Math.max(0, Number(venta.precio_acordado) - totalPagado);
  const mesesNum = Math.max(1, Number(meses || 0));
  const montoCuota = saldoCuotas / mesesNum;

  const generarContrato = async () => {
    setGenerating(true);
    setError(null);
    try {
      // 1) Crear filas de cuotas
      if (cuotas.length === 0) {
        const rows = Array.from({ length: mesesNum }, (_, i) => {
          const fecha = new Date(primeraCuota);
          fecha.setMonth(fecha.getMonth() + i);
          return {
            venta_id: venta.id,
            numero: i + 1,
            fecha_vencimiento: fecha.toISOString().slice(0, 10),
            monto: Math.round(montoCuota * 100) / 100,
            moneda: venta.moneda,
            estado: 'pendiente' as const,
          };
        });
        const { error: ce } = await supabaseV2.from('cuotas').insert(rows);
        if (ce) throw ce;
      }

      // 2) Actualizar venta
      const { error: ue } = await supabaseV2.from('ventas').update({
        estado: 'cuotas',
        fecha_contrato: new Date().toISOString(),
        meses_cuotas: mesesNum,
      }).eq('id', venta.id);
      if (ue) throw ue;

      onChange();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setGenerating(false);
    }
  };

  const yaEmitido = !!venta.fecha_contrato;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Contrato y Cronograma</h3>

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <div className="mb-3 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Metric label="Precio acordado" value={formatMoney(venta.precio_acordado, venta.moneda)} />
          <Metric label="Pagado (sep+ini)" value={formatMoney(totalPagado, venta.moneda)} />
          <Metric label="Saldo cuotas" value={formatMoney(saldoCuotas, venta.moneda)} />
          <Metric label="Cuota estimada" value={formatMoney(montoCuota, venta.moneda)} />
        </div>

        {!yaEmitido ? (
          <>
            <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-slate-600">Plazo (meses)</label>
                <input type="number" min={1} value={meses} onChange={(e) => setMeses(e.target.value)} className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-600">Primera cuota</label>
                <input type="date" value={primeraCuota} onChange={(e) => setPrimeraCuota(e.target.value)} className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm" />
              </div>
            </div>
            {canOperate && (
              <button
                onClick={generarContrato}
                disabled={generating}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {generating ? 'Generando…' : 'Generar contrato + cronograma'}
              </button>
            )}
            {error && <div className="mt-2 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
          </>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-slate-700">
              Contrato emitido el <strong>{formatDate(venta.fecha_contrato)}</strong> — {venta.meses_cuotas} cuotas mensuales.
            </div>
            <div className="flex gap-2">
              <Link href={`/v2/print/contrato/${venta.id}`} target="_blank" className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm">
                Contrato (PDF)
              </Link>
              <Link href={`/v2/print/cronograma/${venta.id}`} target="_blank" className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm">
                Cronograma (PDF)
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}

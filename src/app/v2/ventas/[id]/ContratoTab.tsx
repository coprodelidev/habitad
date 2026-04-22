'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import type { Venta, Propiedad, Cliente, Pago, Cuota, ModalidadPago } from '@/lib/v2/types';
import { formatDate, formatMoney } from '@/lib/v2/format';

const MODALIDADES: { v: ModalidadPago; label: string; desc: string }[] = [
  { v: 'contado', label: 'Contado', desc: 'Cancelación completa sin cuotas' },
  { v: 'cuotas_sin_interes', label: 'Cuotas SIN interés', desc: 'Financiamiento directo sin intereses' },
  { v: 'cuotas_con_interes', label: 'Cuotas CON interés', desc: 'Cuotas con tasa anual (default 8%)' },
  { v: 'bono_mivivienda', label: 'Con Bono MiVivienda', desc: 'Solo casa. Incluye expediente MiVivienda' },
];

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
  const [modalidad, setModalidad] = useState<ModalidadPago>(venta.modalidad_pago ?? 'cuotas_sin_interes');
  const [tasaInteres, setTasaInteres] = useState(venta.tasa_interes_anual?.toString() ?? '8');
  const [meses, setMeses] = useState(venta.meses_cuotas?.toString() ?? '24');
  const [primeraCuota, setPrimeraCuota] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [bonoMonto, setBonoMonto] = useState(venta.mivivienda_bono_monto?.toString() ?? '');
  const [generating, setGenerating] = useState(false);
  const [savingMod, setSavingMod] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPagado = pagos
    .filter((p) => p.estado !== 'anulado' && (p.tipo === 'separacion' || p.tipo === 'inicial'))
    .reduce((a, p) => a + Number(p.monto), 0);
  const saldoCuotas = Math.max(0, Number(venta.precio_acordado) - totalPagado);
  const mesesNum = Math.max(1, Number(meses || 0));
  const montoCuota = saldoCuotas / mesesNum;
  const esContado = modalidad === 'contado';
  const esBono = modalidad === 'bono_mivivienda';
  const esCasa = propiedad?.tipo === 'casa';

  const yaEmitido = !!venta.fecha_contrato;

  const saveModalidad = async () => {
    setSavingMod(true);
    setError(null);
    const update: any = { modalidad_pago: modalidad };
    if (modalidad === 'cuotas_con_interes') update.tasa_interes_anual = Number(tasaInteres || 8);
    if (modalidad === 'bono_mivivienda') update.mivivienda_bono_monto = bonoMonto ? Number(bonoMonto) : null;
    const { error } = await supabaseV2.from('ventas').update(update).eq('id', venta.id);
    setSavingMod(false);
    if (error) setError(error.message);
    else onChange();
  };

  const generarContrato = async () => {
    setGenerating(true);
    setError(null);
    try {
      // Primero aseguramos que la modalidad esté guardada
      await saveModalidad();

      if (!esContado && cuotas.length === 0) {
        const cuotaBase = Math.round((saldoCuotas / mesesNum) * 100) / 100;
        const totalRedondeado = cuotaBase * (mesesNum - 1);
        const ultimaCuota = Math.round((saldoCuotas - totalRedondeado) * 100) / 100;
        const rows = Array.from({ length: mesesNum }, (_, i) => {
          const fecha = new Date(primeraCuota);
          fecha.setMonth(fecha.getMonth() + i);
          return {
            venta_id: venta.id,
            numero: i + 1,
            fecha_vencimiento: fecha.toISOString().slice(0, 10),
            monto: i === mesesNum - 1 ? ultimaCuota : cuotaBase,
            moneda: venta.moneda,
            estado: 'pendiente' as const,
          };
        });
        const { error: ce } = await supabaseV2.from('cuotas').insert(rows);
        if (ce) throw ce;
      }

      const { error: ue } = await supabaseV2.from('ventas').update({
        estado: esContado ? 'entregada' : 'cuotas',
        fecha_contrato: new Date().toISOString(),
        meses_cuotas: esContado ? null : mesesNum,
      }).eq('id', venta.id);
      if (ue) throw ue;

      onChange();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Contrato y Cronograma</h3>

      {!yaEmitido && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 text-sm font-semibold text-slate-900">1. Elegir modalidad de pago</div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {MODALIDADES.filter((m) => esCasa || m.v !== 'bono_mivivienda').map((m) => (
              <button
                key={m.v}
                onClick={() => setModalidad(m.v)}
                className={`rounded-lg border p-3 text-left transition ${
                  modalidad === m.v ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-sm font-semibold text-slate-900">{m.label}</div>
                <div className="mt-1 text-xs text-slate-500">{m.desc}</div>
              </button>
            ))}
          </div>
          {modalidad === 'cuotas_con_interes' && (
            <div className="mt-3 flex items-center gap-2">
              <label className="text-xs text-slate-600">Tasa anual (%)</label>
              <input type="number" step="0.1" value={tasaInteres} onChange={(e) => setTasaInteres(e.target.value)} className="h-8 w-24 rounded-md border border-slate-300 px-2 text-sm" />
            </div>
          )}
          {modalidad === 'bono_mivivienda' && (
            <div className="mt-3 flex items-center gap-2">
              <label className="text-xs text-slate-600">Monto del Bono (S/)</label>
              <input type="number" step="0.01" value={bonoMonto} onChange={(e) => setBonoMonto(e.target.value)} placeholder="Ej: 34,700" className="h-8 w-40 rounded-md border border-slate-300 px-2 text-sm" />
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <div className="mb-3 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Metric label="Precio acordado" value={formatMoney(venta.precio_acordado, venta.moneda)} />
          <Metric label="Pagado (sep+ini)" value={formatMoney(totalPagado, venta.moneda)} />
          <Metric label="Saldo cuotas" value={formatMoney(saldoCuotas, venta.moneda)} />
          <Metric label="Cuota estimada" value={esContado ? '—' : formatMoney(montoCuota, venta.moneda)} />
        </div>

        {!yaEmitido ? (
          <>
            {!esContado && (
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
            )}
            {canOperate && (
              <button
                onClick={generarContrato}
                disabled={generating}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {generating ? 'Generando…' : 'Generar precontrato + cronograma'}
              </button>
            )}
            {error && <div className="mt-2 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
          </>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-slate-700">
              Contrato emitido el <strong>{formatDate(venta.fecha_contrato)}</strong>
              {venta.modalidad_pago && <span> · Modalidad: <strong>{MODALIDADES.find((m) => m.v === venta.modalidad_pago)?.label}</strong></span>}
              {venta.meses_cuotas && <span> · {venta.meses_cuotas} cuotas</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/v2/print/precontrato/${venta.id}`} target="_blank" className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-500">
                Precontrato (PDF según modalidad)
              </Link>
              <Link href={`/v2/print/cronograma/${venta.id}`} target="_blank" className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm">
                Cronograma (PDF)
              </Link>
              <Link href={`/v2/print/contrato/${venta.id}`} target="_blank" className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600">
                Contrato genérico legacy
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

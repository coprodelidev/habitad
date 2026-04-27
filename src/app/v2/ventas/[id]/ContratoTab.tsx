'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import type { Venta, Propiedad, Cliente, Pago, Cuota, ModalidadPago } from '@/lib/v2/types';
import { formatDate, formatMoney } from '@/lib/v2/format';

const TERRENO_MODALIDADES: { v: ModalidadPago; label: string; desc: string }[] = [
  { v: 'contado', label: 'Terreno al contado', desc: 'Cancelacion completa sin cuotas' },
  { v: 'cuotas_sin_interes', label: 'Terreno cuotas sin interes', desc: 'Financiamiento directo sin intereses' },
  { v: 'cuotas_con_interes', label: 'Terreno cuotas con interes', desc: 'Cuotas con tasa anual' },
];

const VIVIENDA_MODALIDADES: { v: ModalidadPago; label: string; desc: string }[] = [
  { v: 'contado', label: 'Vivienda contado sin bono', desc: 'Cancelacion completa sin bono' },
  { v: 'bono_mivivienda', label: 'Vivienda contado con bono', desc: 'Operacion con Bono MiVivienda' },
  { v: 'cuotas_con_interes', label: 'Vivienda cuotas con bono', desc: 'Cuotas asociadas al proceso con bono' },
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
  const esCasa = propiedad?.tipo === 'casa';
  const modalidades = esCasa ? VIVIENDA_MODALIDADES : TERRENO_MODALIDADES;
  const modalidadInicial = venta.modalidad_pago
    ?? (venta.tipo_separacion === 'terreno_con_interes'
      ? 'cuotas_con_interes'
      : venta.tipo_separacion === 'terreno_sin_interes'
      ? 'cuotas_sin_interes'
      : esCasa
      ? 'bono_mivivienda'
      : 'cuotas_sin_interes');
  const [modalidad, setModalidad] = useState<ModalidadPago>(modalidadInicial);
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
    .filter((p) => p.estado !== 'anulado' && p.moneda === venta.moneda && (p.tipo === 'separacion' || p.tipo === 'inicial'))
    .reduce((a, p) => a + Number(p.monto), 0);
  const descuento = esCasa ? Number(venta.descuento_monto ?? 0) : 0;
  const saldoCuotas = Math.max(0, Number(venta.precio_acordado) - totalPagado - descuento);
  const mesesNum = Math.min(96, Math.max(1, Number(meses || 0)));
  const montoCuota = saldoCuotas / mesesNum;
  const esContado = modalidad === 'contado';
  const esBono = modalidad === 'bono_mivivienda';
  const fechaFinal = !esContado ? calcFechaFinal(primeraCuota, mesesNum) : null;
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
      <h3 className="text-lg font-semibold">Contrato y cronograma</h3>

      {!yaEmitido && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 text-sm font-semibold text-slate-900">1. Elegir modalidad de pago</div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {modalidades.map((m) => (
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
          {modalidad === 'cuotas_con_interes' && !esCasa && (
            <div className="mt-3 flex items-center gap-2">
              <label className="text-xs text-slate-600">Tasa anual (%)</label>
              <input type="number" step="0.1" value={tasaInteres} onChange={(e) => setTasaInteres(e.target.value)} className="h-8 w-24 rounded-md border border-slate-300 px-2 text-sm" />
            </div>
          )}
          {esBono && (
            <div className="mt-3 flex items-center gap-2">
              <label className="text-xs text-slate-600">Monto del bono (S/)</label>
              <input type="number" step="0.01" value={bonoMonto} onChange={(e) => setBonoMonto(e.target.value)} placeholder="Ej: 34700" className="h-8 w-40 rounded-md border border-slate-300 px-2 text-sm" />
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <div className="mb-3 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Metric label="Precio acordado" value={formatMoney(venta.precio_acordado, venta.moneda)} />
          <Metric label="Pagado sep+ini" value={formatMoney(totalPagado, venta.moneda)} />
          <Metric label="Descuento" value={formatMoney(descuento, venta.moneda)} />
          <Metric label="Saldo cuotas" value={formatMoney(saldoCuotas, venta.moneda)} />
          <Metric label="Cuota estimada" value={esContado ? '-' : formatMoney(montoCuota, venta.moneda)} />
        </div>

        {!yaEmitido ? (
          <>
            {!esContado && (
              <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-600">Cantidad de cuotas (maximo 96)</label>
                  <input type="number" min={1} max={96} value={meses} onChange={(e) => setMeses(e.target.value)} className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-600">Mes inicial / primera cuota</label>
                  <input type="date" value={primeraCuota} onChange={(e) => setPrimeraCuota(e.target.value)} className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm" />
                </div>
                <ReadOnly label="Mes final" value={fechaFinal ? formatDate(fechaFinal) : '-'} />
                <ReadOnly label="Saldo a financiar" value={formatMoney(saldoCuotas, venta.moneda)} />
              </div>
            )}
            {canOperate && (
              <button
                onClick={generarContrato}
                disabled={generating}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {generating ? 'Generando...' : 'Generar precontrato y cronograma'}
              </button>
            )}
            {error && <div className="mt-2 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
          </>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-slate-700">
              Contrato emitido el <strong>{formatDate(venta.fecha_contrato)}</strong>
              {venta.modalidad_pago && <span> · Modalidad: <strong>{modalidades.find((m) => m.v === venta.modalidad_pago)?.label}</strong></span>}
              {venta.meses_cuotas && <span> · {venta.meses_cuotas} cuotas</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/v2/print/precontrato/${venta.id}`} target="_blank" className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-500">
                Precontrato segun modalidad
              </Link>
              <Link href={`/v2/print/cronograma/${venta.id}`} target="_blank" className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm">
                Cronograma
              </Link>
              <Link href={`/v2/print/contrato/${venta.id}`} target="_blank" className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600">
                Contrato resumen
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

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-600">{label}</label>
      <div className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
        {value}
      </div>
    </div>
  );
}

function calcFechaFinal(primeraCuota: string, meses: number): Date | null {
  if (!primeraCuota) return null;
  const fecha = new Date(primeraCuota);
  if (Number.isNaN(fecha.getTime())) return null;
  fecha.setMonth(fecha.getMonth() + Math.max(0, meses - 1));
  return fecha;
}

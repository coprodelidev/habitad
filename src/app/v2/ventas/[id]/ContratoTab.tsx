'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import type { Venta, Propiedad, Cliente, Pago, Cuota, ModalidadPago } from '@/lib/v2/types';
import { formatDate, formatMoney } from '@/lib/v2/format';
import { parseAmountInput } from '@/lib/v2/amount';

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
  const [mesesAviso, setMesesAviso] = useState<string | null>(null);

  const totalPagado = pagos
    .filter((p) => p.estado !== 'anulado' && p.moneda === venta.moneda && (p.tipo === 'separacion' || p.tipo === 'inicial'))
    .reduce((a, p) => a + Number(p.monto), 0);
  const descuento = esCasa ? Number(venta.descuento_monto ?? 0) : 0;
  const saldoCuotas = Math.max(0, Number(venta.precio_acordado) - totalPagado - descuento);
  const mesesNum = Math.min(96, Math.max(1, Number(meses || 0)));
  const tasaInteresNum = parseAmountInput(tasaInteres || '0');
  const bonoMontoNum = parseAmountInput(bonoMonto || '0');
  const aplicaInteres = modalidad === 'cuotas_con_interes' && !esCasa;
  const montoCuota = calcularCuotaMensual(saldoCuotas, mesesNum, aplicaInteres ? tasaInteresNum : 0);
  const esContado = modalidad === 'contado';
  const esBono = modalidad === 'bono_mivivienda';
  const fechaFinal = !esContado ? calcFechaFinal(primeraCuota, mesesNum) : null;
  const yaEmitido = !!venta.fecha_contrato;

  const saveModalidad = async () => {
    setSavingMod(true);
    setError(null);
    if (aplicaInteres && (!Number.isFinite(tasaInteresNum) || tasaInteresNum < 0)) {
      setSavingMod(false);
      throw new Error('Ingresa una tasa de interes valida.');
    }
    if (esBono && bonoMonto && (!Number.isFinite(bonoMontoNum) || bonoMontoNum < 0)) {
      setSavingMod(false);
      throw new Error('Ingresa un monto de bono valido.');
    }
    const update: any = { modalidad_pago: modalidad };
    if (modalidad === 'cuotas_con_interes') update.tasa_interes_anual = Number.isFinite(tasaInteresNum) ? tasaInteresNum : 8;
    if (modalidad === 'bono_mivivienda') update.mivivienda_bono_monto = bonoMonto ? bonoMontoNum : null;
    const { error } = await supabaseV2.from('ventas').update(update).eq('id', venta.id);
    setSavingMod(false);
    if (error) throw error;
  };

  const generarContrato = async () => {
    setGenerating(true);
    setError(null);
    try {
      await saveModalidad();

      if (!esContado && cuotas.length === 0) {
        const cuotaBase = Math.round(montoCuota * 100) / 100;
        const totalRedondeado = cuotaBase * (mesesNum - 1);
        const totalCronograma = Math.round((montoCuota * mesesNum) * 100) / 100;
        const ultimaCuota = Math.round((totalCronograma - totalRedondeado) * 100) / 100;
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

  const onMesesChange = (value: string) => {
    if (value === '') {
      setMeses(value);
      setMesesAviso(null);
      return;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    if (parsed > 96) {
      setMeses('96');
      setMesesAviso('Máximo permitido: 96 cuotas (8 años).');
      return;
    }
    if (parsed < 1) {
      setMeses('1');
      setMesesAviso('Mínimo permitido: 1 cuota.');
      return;
    }
    setMeses(String(Math.trunc(parsed)));
    setMesesAviso(null);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Contrato y cronograma</h3>

      <AdicionalCvPanel venta={venta} canOperate={canOperate} onChange={onChange} />

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
                  <input type="number" min={1} max={96} value={meses} onChange={(e) => onMesesChange(e.target.value)} className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm" />
                  {mesesAviso && <div className="mt-1 text-xs text-amber-700">{mesesAviso}</div>}
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

function calcularCuotaMensual(principal: number, meses: number, tasaAnual: number): number {
  if (!(principal > 0) || !(meses > 0)) return 0;
  if (!(tasaAnual > 0)) return principal / meses;
  const tasaMensual = tasaAnual / 100 / 12;
  return principal * (tasaMensual / (1 - Math.pow(1 + tasaMensual, -meses)));
}

function AdicionalCvPanel({ venta, canOperate, onChange }: { venta: Venta; canOperate: boolean; onChange: () => void }) {
  const [valor, setValor] = useState<string>(venta.valor_adicional_cv?.toString() ?? '');
  const [abonos, setAbonos] = useState<string>(venta.abonos_cv?.toString() ?? '');
  const [moneda, setMoneda] = useState<'PEN' | 'USD'>(venta.moneda_adicional ?? 'PEN');
  const [saving, setSaving] = useState(false);
  const num = (s: string) => (s ? Number(s) : 0);
  const saldo = num(valor) - num(abonos);
  const dirty = String(num(valor)) !== String(venta.valor_adicional_cv ?? 0)
             || String(num(abonos)) !== String(venta.abonos_cv ?? 0)
             || moneda !== (venta.moneda_adicional ?? 'PEN');

  const save = async () => {
    setSaving(true);
    await supabaseV2.from('ventas').update({
      valor_adicional_cv: num(valor),
      abonos_cv: num(abonos),
      moneda_adicional: moneda,
    }).eq('id', venta.id);
    setSaving(false);
    onChange();
  };

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-medium text-amber-900">Valor adicional CV (Coprovidig)</span>
        {dirty && canOperate && (
          <button onClick={save} disabled={saving} className="rounded bg-amber-700 px-2 py-0.5 text-xs text-white hover:bg-amber-800 disabled:opacity-50">
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div>
          <label className="mb-1 block text-amber-800">Valor</label>
          <input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} disabled={!canOperate}
            className="h-8 w-full rounded border border-amber-300 bg-white px-2 disabled:bg-amber-100" />
        </div>
        <div>
          <label className="mb-1 block text-amber-800">Abonado</label>
          <input type="number" step="0.01" value={abonos} onChange={(e) => setAbonos(e.target.value)} disabled={!canOperate}
            className="h-8 w-full rounded border border-amber-300 bg-white px-2 disabled:bg-amber-100" />
        </div>
        <div>
          <label className="mb-1 block text-amber-800">Moneda</label>
          <select value={moneda} onChange={(e) => setMoneda(e.target.value as any)} disabled={!canOperate}
            className="h-8 w-full rounded border border-amber-300 bg-white px-2 disabled:bg-amber-100">
            <option value="PEN">PEN</option><option value="USD">USD</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-amber-800">Saldo por pagar</label>
          <div className="h-8 rounded border border-amber-300 bg-white px-2 py-1 font-medium text-amber-900">
            {saldo.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
}

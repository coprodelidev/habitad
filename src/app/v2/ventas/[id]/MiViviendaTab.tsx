'use client';

import { useMemo, useState } from 'react';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import type { Venta } from '@/lib/v2/types';

export function MiViviendaTab({ venta, canOperate, onChange }: { venta: Venta; canOperate: boolean; onChange: () => void }) {
  const [form, setForm] = useState({
    mivivienda_expediente: venta.mivivienda_expediente ?? '',
    mivivienda_fecha_ingreso: venta.mivivienda_fecha_ingreso ?? '',
    mivivienda_fecha_beneficiario: venta.mivivienda_fecha_beneficiario ?? '',
    mivivienda_fecha_caducidad: venta.mivivienda_fecha_caducidad ?? '',
    mivivienda_bono_monto: venta.mivivienda_bono_monto?.toString() ?? '',
    mivivienda_ahorro: venta.mivivienda_ahorro?.toString() ?? '',
    credito_hipotecario_banco: venta.credito_hipotecario_banco ?? '',
    credito_hipotecario_monto: venta.credito_hipotecario_monto?.toString() ?? '',
    credito_hipotecario_fecha_inicio: venta.credito_hipotecario_fecha_inicio ?? '',
    credito_hipotecario_fecha_fin: venta.credito_hipotecario_fecha_fin ?? '',
    // Fase 1 — bloque FMV operativo
    fmv_precio: venta.fmv_precio?.toString() ?? '',
    fmv_bono_real: venta.fmv_bono_real?.toString() ?? '',
    fmv_abono_cliente: venta.fmv_abono_cliente?.toString() ?? '',
    fmv_donacion_coprodeli: venta.fmv_donacion_coprodeli?.toString() ?? '',
    fmv_gastos_administrativos: venta.fmv_gastos_administrativos?.toString() ?? '',
    fmv_origen_bono: venta.fmv_origen_bono ?? '',
    fmv_fecha_desembolso: venta.fmv_fecha_desembolso ?? '',
    fmv_estado_expediente: venta.fmv_estado_expediente ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const num = (s: string) => (s ? Number(s) : 0);
  // Saldo FMV = precio − (bono real + abono cliente + donación)
  const saldoCalculado = useMemo(() => {
    const precio = num(form.fmv_precio);
    if (precio === 0) return null;
    return precio - num(form.fmv_bono_real) - num(form.fmv_abono_cliente) - num(form.fmv_donacion_coprodeli);
  }, [form.fmv_precio, form.fmv_bono_real, form.fmv_abono_cliente, form.fmv_donacion_coprodeli]);

  const save = async () => {
    setSaving(true);
    setError(null);
    setOk(false);
    const payload: any = {
      mivivienda_expediente: form.mivivienda_expediente || null,
      mivivienda_fecha_ingreso: form.mivivienda_fecha_ingreso || null,
      mivivienda_fecha_beneficiario: form.mivivienda_fecha_beneficiario || null,
      mivivienda_fecha_caducidad: form.mivivienda_fecha_caducidad || null,
      mivivienda_bono_monto: form.mivivienda_bono_monto ? Number(form.mivivienda_bono_monto) : null,
      mivivienda_ahorro: form.mivivienda_ahorro ? Number(form.mivivienda_ahorro) : null,
      credito_hipotecario_banco: form.credito_hipotecario_banco || null,
      credito_hipotecario_monto: form.credito_hipotecario_monto ? Number(form.credito_hipotecario_monto) : null,
      credito_hipotecario_fecha_inicio: form.credito_hipotecario_fecha_inicio || null,
      credito_hipotecario_fecha_fin: form.credito_hipotecario_fecha_fin || null,
      // Fase 1 — bloque FMV
      fmv_precio: form.fmv_precio ? Number(form.fmv_precio) : null,
      fmv_bono_real: form.fmv_bono_real ? Number(form.fmv_bono_real) : null,
      fmv_abono_cliente: form.fmv_abono_cliente ? Number(form.fmv_abono_cliente) : null,
      fmv_donacion_coprodeli: form.fmv_donacion_coprodeli ? Number(form.fmv_donacion_coprodeli) : null,
      fmv_gastos_administrativos: form.fmv_gastos_administrativos ? Number(form.fmv_gastos_administrativos) : null,
      fmv_saldo: saldoCalculado,
      fmv_origen_bono: form.fmv_origen_bono || null,
      fmv_fecha_desembolso: form.fmv_fecha_desembolso || null,
      fmv_estado_expediente: form.fmv_estado_expediente || null,
    };
    const { error } = await supabaseV2.from('ventas').update(payload).eq('id', venta.id);
    setSaving(false);
    if (error) setError(error.message);
    else { setOk(true); onChange(); }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Expediente MiVivienda</h3>
        <p className="text-xs text-slate-500">
          Tracking del Bono Familiar Habitacional y del crédito hipotecario para ventas de casa.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h4 className="mb-3 text-sm font-semibold text-slate-900">Expediente MiVivienda</h4>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Código de expediente">
            <input className={inp} value={form.mivivienda_expediente} onChange={(e) => setForm({ ...form, mivivienda_expediente: e.target.value })} disabled={!canOperate} />
          </Field>
          <Field label="Fecha de ingreso">
            <input type="date" className={inp} value={form.mivivienda_fecha_ingreso.slice(0, 10)} onChange={(e) => setForm({ ...form, mivivienda_fecha_ingreso: e.target.value })} disabled={!canOperate} />
          </Field>
          <Field label="Fecha calificado beneficiario">
            <input type="date" className={inp} value={form.mivivienda_fecha_beneficiario.slice(0, 10)} onChange={(e) => setForm({ ...form, mivivienda_fecha_beneficiario: e.target.value })} disabled={!canOperate} />
          </Field>
          <Field label="Fecha de caducidad del bono">
            <input type="date" className={inp} value={form.mivivienda_fecha_caducidad.slice(0, 10)} onChange={(e) => setForm({ ...form, mivivienda_fecha_caducidad: e.target.value })} disabled={!canOperate} />
          </Field>
          <Field label="Monto del Bono (S/)">
            <input type="number" step="0.01" className={inp} value={form.mivivienda_bono_monto} onChange={(e) => setForm({ ...form, mivivienda_bono_monto: e.target.value })} disabled={!canOperate} />
          </Field>
          <Field label="Ahorro del cliente (S/)">
            <input type="number" step="0.01" className={inp} value={form.mivivienda_ahorro} onChange={(e) => setForm({ ...form, mivivienda_ahorro: e.target.value })} disabled={!canOperate} />
          </Field>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-amber-900">Bloque FMV operativo (cuadre Yessenia)</h4>
          {saldoCalculado !== null && (
            <span className={`text-xs font-medium ${Math.abs(saldoCalculado) < 1 ? 'text-emerald-700' : 'text-amber-700'}`}>
              Saldo calculado: {saldoCalculado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="Precio FMV">
            <input type="number" step="0.01" className={inp} value={form.fmv_precio} onChange={(e) => setForm({ ...form, fmv_precio: e.target.value })} disabled={!canOperate} />
          </Field>
          <Field label="Bono FMV real desembolsado">
            <input type="number" step="0.01" className={inp} value={form.fmv_bono_real} onChange={(e) => setForm({ ...form, fmv_bono_real: e.target.value })} disabled={!canOperate} />
          </Field>
          <Field label="Abono cliente FMV">
            <input type="number" step="0.01" className={inp} value={form.fmv_abono_cliente} onChange={(e) => setForm({ ...form, fmv_abono_cliente: e.target.value })} disabled={!canOperate} />
          </Field>
          <Field label="Donación COPRODELI">
            <input type="number" step="0.01" className={inp} value={form.fmv_donacion_coprodeli} onChange={(e) => setForm({ ...form, fmv_donacion_coprodeli: e.target.value })} disabled={!canOperate} />
          </Field>
          <Field label="Gastos administrativos">
            <input type="number" step="0.01" className={inp} value={form.fmv_gastos_administrativos} onChange={(e) => setForm({ ...form, fmv_gastos_administrativos: e.target.value })} disabled={!canOperate} />
          </Field>
          <Field label="Origen del bono">
            <select className={inp} value={form.fmv_origen_bono} onChange={(e) => setForm({ ...form, fmv_origen_bono: e.target.value as any })} disabled={!canOperate}>
              <option value="">—</option>
              <option value="cf">Crédito Financiero</option>
              <option value="recursos_propios">Recursos Propios</option>
            </select>
          </Field>
          <Field label="Fecha desembolso bono">
            <input type="date" className={inp} value={form.fmv_fecha_desembolso.slice(0, 10)} onChange={(e) => setForm({ ...form, fmv_fecha_desembolso: e.target.value })} disabled={!canOperate} />
          </Field>
          <Field label="Estado del expediente">
            <select className={inp} value={form.fmv_estado_expediente} onChange={(e) => setForm({ ...form, fmv_estado_expediente: e.target.value as any })} disabled={!canOperate}>
              <option value="">—</option>
              <option value="pendiente">Pendiente</option>
              <option value="pedir_cf">Pedir CF</option>
              <option value="cf_desembolsado">CF desembolsado</option>
              <option value="beneficiario">Beneficiario</option>
              <option value="caducado">Caducado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h4 className="mb-3 text-sm font-semibold text-slate-900">Crédito hipotecario (opcional)</h4>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Banco financiador">
            <input className={inp} value={form.credito_hipotecario_banco} onChange={(e) => setForm({ ...form, credito_hipotecario_banco: e.target.value })} disabled={!canOperate} />
          </Field>
          <Field label="Monto del crédito (S/)">
            <input type="number" step="0.01" className={inp} value={form.credito_hipotecario_monto} onChange={(e) => setForm({ ...form, credito_hipotecario_monto: e.target.value })} disabled={!canOperate} />
          </Field>
          <Field label="Fecha inicio crédito">
            <input type="date" className={inp} value={form.credito_hipotecario_fecha_inicio.slice(0, 10)} onChange={(e) => setForm({ ...form, credito_hipotecario_fecha_inicio: e.target.value })} disabled={!canOperate} />
          </Field>
          <Field label="Fecha fin crédito">
            <input type="date" className={inp} value={form.credito_hipotecario_fecha_fin.slice(0, 10)} onChange={(e) => setForm({ ...form, credito_hipotecario_fecha_fin: e.target.value })} disabled={!canOperate} />
          </Field>
        </div>
      </div>

      {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {ok && <div className="rounded bg-emerald-50 p-3 text-sm text-emerald-700">Datos MiVivienda guardados.</div>}

      {canOperate && (
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar expediente'}
        </button>
      )}
    </div>
  );
}

const inp = 'h-9 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { supabaseV2, supabasePublic } from '@/lib/v2/supabaseV2';
import type { Venta, Moneda, TipoPago } from '@/lib/v2/types';
import { parseAmountInput } from '@/lib/v2/amount';

interface Props {
  venta: Venta;
  tipo: TipoPago;
  cuotaNumero?: number;
  onClose: () => void;
  onSaved: () => void;
}

export function PagoForm({ venta, tipo, cuotaNumero, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    fecha_deposito: new Date().toISOString().slice(0, 10),
    numero_operacion: '',
    banco: '',
    monto: '',
    moneda: venta.moneda as Moneda,
    notas: '',
  });
  const [voucher, setVoucher] = useState<File | null>(null);
  const [bancos, setBancos] = useState<string[]>(['BANBIF', 'BCP']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const voucherRequired = tipo === 'separacion' || tipo === 'inicial';
  const canSave = !!(
    form.fecha_deposito &&
    form.banco &&
    parseAmountInput(form.monto) > 0 &&
    (!voucherRequired || !!voucher)
  );

  useEffect(() => {
    supabaseV2
      .from('parametros')
      .select('valor')
      .eq('clave', 'bancos_permitidos')
      .maybeSingle()
      .then((res: any) => {
        if (Array.isArray(res?.data?.valor)) {
          const allowed = (res.data.valor as string[])
            .map((b) => b.toUpperCase())
            .filter((b) => b === 'BANBIF' || b === 'BCP');
          setBancos(allowed.length ? allowed : ['BANBIF', 'BCP']);
        }
      });
  }, []);

  const save = async () => {
    setError(null);

    const montoNum = parseAmountInput(form.monto);
    if (!form.fecha_deposito) {
      setError('La fecha de deposito es obligatoria.');
      return;
    }
    if (!form.banco) {
      setError('Selecciona un banco.');
      return;
    }
    if (!(montoNum > 0)) {
      setError('Ingresa un monto valido mayor a 0.');
      return;
    }
    if (voucherRequired && !voucher) {
      setError('El voucher es obligatorio para este tipo de pago.');
      return;
    }

    setSaving(true);
    try {
      let voucherUrl: string | null = null;
      if (voucher) {
        const ext = voucher.name.split('.').pop();
        const path = `${venta.id}/${Date.now()}_${tipo}.${ext}`;
        const up = await supabasePublic.storage.from('v2-vouchers').upload(path, voucher, { upsert: false });
        if (up.error || !up.data) throw up.error ?? new Error('Upload failed');
        voucherUrl = up.data.path;
      }

      const { data: userRes } = await supabasePublic.auth.getUser();
      const payload: any = {
        venta_id: venta.id,
        tipo,
        cuota_numero: cuotaNumero ?? null,
        fecha_deposito: form.fecha_deposito,
        numero_operacion: form.numero_operacion || null,
        banco: form.banco || null,
        monto: montoNum,
        moneda: form.moneda,
        voucher_url: voucherUrl,
        registrado_por: userRes.user?.id ?? null,
        notas: form.notas || null,
      };
      const { data: inserted, error: ierr } = await supabaseV2.from('pagos').insert(payload).select('id').single();
      if (ierr) throw ierr;

      if (tipo === 'cuota' && inserted?.id) {
        await supabaseV2.rpc('aplicar_pago_cuota', { p_pago_id: inserted.id });
      }

      onSaved();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  const title =
    tipo === 'separacion'
      ? 'Pago de separacion'
      : tipo === 'inicial'
      ? 'Abono de inicial'
      : tipo === 'cuota'
      ? `Pago de cuota ${cuotaNumero ? `#${cuotaNumero}` : ''}`
      : 'Registrar pago';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            x
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">
          <Field label="Fecha deposito *">
            <input type="date" className={inp} value={form.fecha_deposito} onChange={(e) => setForm({ ...form, fecha_deposito: e.target.value })} />
          </Field>
          <Field label="Nro operacion">
            <input className={inp} value={form.numero_operacion} onChange={(e) => setForm({ ...form, numero_operacion: e.target.value })} />
          </Field>
          <Field label="Banco *">
            <select className={inp} value={form.banco} onChange={(e) => setForm({ ...form, banco: e.target.value })}>
              <option value="">-</option>
              {bancos.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Moneda">
            <select className={inp} value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value as Moneda })}>
              <option value="USD">USD</option>
              <option value="PEN">PEN</option>
            </select>
          </Field>
          <Field label="Monto *">
            <input
              type="text"
              inputMode="decimal"
              className={inp}
              value={form.monto}
              onChange={(e) => setForm({ ...form, monto: e.target.value })}
              placeholder="Ej: 1500.50 / 1500,50 / 1,500"
            />
          </Field>
          <Field label={`Voucher ${voucherRequired ? '*' : ''}`}>
            <input type="file" accept="image/*,.pdf" onChange={(e) => setVoucher(e.target.files?.[0] ?? null)} className="text-xs" />
          </Field>
          <Field label="Notas" full>
            <textarea className={`${inp} h-20`} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          </Field>
        </div>
        {error && <div className="mx-5 mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <button onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-sm">
            Cancelar
          </button>
          <button onClick={save} disabled={saving || !canSave} className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar pago'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inp = 'h-9 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}

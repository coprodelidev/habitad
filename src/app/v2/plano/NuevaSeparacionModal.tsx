'use client';

import { useState } from 'react';
import { supabaseV2, supabasePublic } from '@/lib/v2/supabaseV2';
import type { Propiedad } from '@/lib/v2/types';
import { formatMoney } from '@/lib/v2/format';

export function NuevaSeparacionModal({
  propiedad,
  onClose,
  onCreated,
}: {
  propiedad: Propiedad;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    dni: '',
    telefono: '',
    email: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const precio = propiedad.precio_venta ?? propiedad.precio_lista;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      // 1) Cliente: upsert por DNI
      let clienteId: string | null = null;
      const existing = await supabaseV2.from('clientes').select('id').eq('dni', form.dni).maybeSingle();
      if (existing.data) {
        clienteId = existing.data.id;
      } else {
        const ins = await supabaseV2.from('clientes').insert({
          nombres: form.nombres,
          apellidos: form.apellidos,
          dni: form.dni,
          telefono: form.telefono || null,
          email: form.email || null,
        }).select('id').single();
        if (ins.error) throw ins.error;
        clienteId = ins.data!.id;
      }

      // 2) Parámetro separacion_horas
      const param = await supabaseV2.from('parametros').select('valor').eq('clave', 'separacion_horas').maybeSingle();
      const horas = Number(param.data?.valor ?? 24);

      const now = new Date();
      const vencimiento = new Date(now.getTime() + horas * 3600 * 1000);

      // 3) Crear la venta en estado 'separacion'
      const { data: userData } = await supabasePublic.auth.getUser();
      const { error: vErr } = await supabaseV2.from('ventas').insert({
        propiedad_id: propiedad.id,
        cliente_id: clienteId,
        promotor_id: userData.user?.id ?? null,
        estado: 'separacion',
        precio_acordado: precio,
        moneda: propiedad.moneda,
        fecha_separacion: now.toISOString(),
        fecha_vencimiento_separacion: vencimiento.toISOString(),
      });
      if (vErr) throw vErr;

      onCreated();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-lg font-semibold">Nueva separación</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="p-5">
          <div className="mb-4 rounded-md bg-slate-50 p-3 text-sm">
            <div className="font-mono text-xs text-slate-500">{propiedad.cuh}</div>
            <div className="mt-1 text-slate-900">
              Mz {propiedad.manzana ?? '—'} / Lt {propiedad.lote ?? '—'} · {propiedad.tipo}
            </div>
            <div className="mt-1 font-medium text-slate-900">{formatMoney(precio, propiedad.moneda)}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombres *">
              <input className={inp} value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} />
            </Field>
            <Field label="Apellidos *">
              <input className={inp} value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} />
            </Field>
            <Field label="DNI *">
              <input className={inp} value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} />
            </Field>
            <Field label="Teléfono">
              <input className={inp} value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </Field>
            <Field label="Correo" full>
              <input type="email" className={inp} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Al guardar se crea una separación válida por <strong>24h</strong>. Si no se registra el pago
            dentro del plazo, la unidad se libera automáticamente.
          </p>
          {error && <div className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
        </div>
        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <button onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
          <button
            onClick={save}
            disabled={saving || !form.nombres || !form.apellidos || !form.dni}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? 'Creando…' : 'Crear separación'}
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

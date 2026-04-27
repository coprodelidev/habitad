'use client';

import { useState, useEffect } from 'react';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import type { Propiedad, Etapa, TipoPropiedad, Moneda } from '@/lib/v2/types';

interface Props {
  propiedad: Propiedad | null;
  etapas: Etapa[];
  onClose: () => void;
  onSaved: () => void;
}

export function PropiedadModal({ propiedad, etapas, onClose, onSaved }: Props) {
  const isEdit = !!propiedad;
  const [form, setForm] = useState({
    cuh: propiedad?.cuh ?? '',
    etapa_id: propiedad?.etapa_id ?? '',
    tipo: (propiedad?.tipo ?? 'terreno') as TipoPropiedad,
    modelo: propiedad?.modelo ?? '',
    partida_registral: propiedad?.partida_registral ?? '',
    manzana: propiedad?.manzana ?? '',
    lote: propiedad?.lote ?? '',
    ubicacion: propiedad?.ubicacion ?? '',
    area_m2: propiedad?.area_m2?.toString() ?? '',
    precio_lista: propiedad?.precio_lista?.toString() ?? '',
    precio_venta: propiedad?.precio_venta?.toString() ?? '',
    moneda: (propiedad?.moneda ?? 'USD') as Moneda,
    esquina: Boolean((propiedad?.adicionales as any)?.esquina),
    parque: Boolean((propiedad?.adicionales as any)?.parque),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const save = async () => {
    setSaving(true);
    setError(null);
    const payload: any = {
      cuh: form.cuh,
      etapa_id: form.etapa_id || null,
      tipo: form.tipo,
      modelo: form.modelo || null,
      partida_registral: form.partida_registral || null,
      manzana: form.manzana || null,
      lote: form.lote || null,
      ubicacion: form.ubicacion || null,
      area_m2: form.area_m2 ? Number(form.area_m2) : null,
      precio_lista: Number(form.precio_lista || 0),
      precio_venta: form.precio_venta ? Number(form.precio_venta) : null,
      moneda: form.moneda,
      adicionales: {
        ...(propiedad?.adicionales ?? {}),
        esquina: form.esquina,
        parque: form.parque,
      },
    };
    const q = isEdit
      ? supabaseV2.from('propiedades').update(payload).eq('id', propiedad!.id)
      : supabaseV2.from('propiedades').insert(payload);
    const { error: err } = await q;
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h2 className="text-base font-semibold text-slate-900">
            {isEdit ? 'Editar propiedad' : 'Nueva propiedad'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">
          <Field label="CUH *">
            <input className={inputCls} value={form.cuh} onChange={(e) => setForm({ ...form, cuh: e.target.value })} />
          </Field>
          <Field label="Etapa">
            <select className={inputCls} value={form.etapa_id} onChange={(e) => setForm({ ...form, etapa_id: e.target.value })}>
              <option value="">—</option>
              {etapas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </Field>
          <Field label="Tipo *">
            <select className={inputCls} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoPropiedad })}>
              <option value="terreno">Terreno</option>
              <option value="casa">Casa</option>
            </select>
          </Field>
          <Field label="Modelo">
            <input className={inputCls} value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} />
          </Field>
          <Field label="Manzana">
            <input className={inputCls} value={form.manzana} onChange={(e) => setForm({ ...form, manzana: e.target.value })} />
          </Field>
          <Field label="Lote">
            <input className={inputCls} value={form.lote} onChange={(e) => setForm({ ...form, lote: e.target.value })} />
          </Field>
          <Field label="Partida registral">
            <input className={inputCls} value={form.partida_registral} onChange={(e) => setForm({ ...form, partida_registral: e.target.value })} />
          </Field>
          <Field label="Área (m²)">
            <input type="number" step="0.01" className={inputCls} value={form.area_m2} onChange={(e) => setForm({ ...form, area_m2: e.target.value })} />
          </Field>
          <Field label="Ubicación" full>
            <input className={inputCls} value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} />
          </Field>
          <Field label="Precio lista *">
            <input type="number" step="0.01" className={inputCls} value={form.precio_lista} onChange={(e) => setForm({ ...form, precio_lista: e.target.value })} />
          </Field>
          <Field label="Precio venta">
            <input type="number" step="0.01" className={inputCls} value={form.precio_venta} onChange={(e) => setForm({ ...form, precio_venta: e.target.value })} />
          </Field>
          <Field label="Moneda">
            <select className={inputCls} value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value as Moneda })}>
              <option value="USD">USD</option>
              <option value="PEN">PEN</option>
            </select>
          </Field>
          <Field label="Ubicacion especial" full>
            <div className="flex gap-4 text-sm text-slate-700">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.esquina} onChange={(e) => setForm({ ...form, esquina: e.target.checked })} />
                Esquina
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.parque} onChange={(e) => setForm({ ...form, parque: e.target.checked })} />
                Parque
              </label>
            </div>
          </Field>
        </div>
        {error && <div className="mx-5 mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <button onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Cancelar</button>
          <button onClick={save} disabled={saving || !form.cuh || !form.precio_lista} className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-50">
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'h-9 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}

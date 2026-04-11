'use client';

import { useEffect, useState } from 'react';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { useV2User } from '@/lib/v2/useV2User';
import { isAdmin } from '@/lib/v2/permissions';
import type { Etapa } from '@/lib/v2/types';

export default function EtapasPage() {
  const { user, loading: loadingUser } = useV2User();
  const [items, setItems] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ codigo: '', nombre: '', descripcion: '' });
  const [saving, setSaving] = useState(false);
  const canAdmin = isAdmin(user?.roleCode);

  const load = async () => {
    setLoading(true);
    const { data } = await supabaseV2.from('etapas').select('*').order('orden');
    setItems((data ?? []) as Etapa[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setSaving(true);
    await supabaseV2.from('etapas').insert({ codigo: form.codigo, nombre: form.nombre, descripcion: form.descripcion || null });
    setForm({ codigo: '', nombre: '', descripcion: '' });
    setSaving(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar etapa?')) return;
    await supabaseV2.from('etapas').delete().eq('id', id);
    load();
  };

  const toggle = async (id: string, activa: boolean) => {
    await supabaseV2.from('etapas').update({ activa }).eq('id', id);
    load();
  };

  if (loadingUser) return <div className="text-slate-500">Cargando…</div>;
  if (!canAdmin) return <div className="rounded bg-yellow-50 p-4 text-sm text-yellow-800">Solo administradores.</div>;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Etapas</h1>
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold">Nueva etapa</h3>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          <input placeholder="Código" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} className="h-9 rounded-md border border-slate-300 px-3 text-sm" />
          <input placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="h-9 rounded-md border border-slate-300 px-3 text-sm" />
          <input placeholder="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="h-9 rounded-md border border-slate-300 px-3 text-sm md:col-span-2" />
        </div>
        <button onClick={create} disabled={!form.codigo || !form.nombre || saving} className="mt-3 rounded bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50">
          {saving ? 'Guardando…' : 'Crear'}
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2">Código</th>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Descripción</th>
              <th className="px-3 py-2">Activa</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-3 py-6 text-center">Cargando…</td></tr>
            ) : items.map((e) => (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="px-3 py-1.5 font-mono">{e.codigo}</td>
                <td className="px-3 py-1.5">{e.nombre}</td>
                <td className="px-3 py-1.5">{e.descripcion ?? '—'}</td>
                <td className="px-3 py-1.5">
                  <input type="checkbox" checked={e.activa} onChange={(ev) => toggle(e.id, ev.target.checked)} />
                </td>
                <td className="px-3 py-1.5 text-right">
                  <button onClick={() => remove(e.id)} className="text-xs text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

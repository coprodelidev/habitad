'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { useV2User } from '@/lib/v2/useV2User';
import { isAdmin } from '@/lib/v2/permissions';
import type { ConceptoCliente } from '@/lib/v2/types';
import { Tag, Plus } from 'lucide-react';

export default function ConceptosClientePage() {
  const { user, loading: loadingUser } = useV2User();
  const canAdmin = isAdmin(user?.roleCode);
  const [items, setItems] = useState<ConceptoCliente[]>([]);
  const [usados, setUsados] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [nuevo, setNuevo] = useState({ codigo: '', descripcion: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabaseV2.from('conceptos_cliente').select('*').order('codigo');
    setItems((data ?? []) as ConceptoCliente[]);
    const { data: counts } = await supabaseV2
      .from('ventas')
      .select('concepto_cliente')
      .not('concepto_cliente', 'is', null);
    const acc: Record<string, number> = {};
    for (const v of (counts ?? []) as any[]) {
      acc[v.concepto_cliente] = (acc[v.concepto_cliente] ?? 0) + 1;
    }
    setUsados(acc);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!nuevo.codigo.trim()) return;
    setSaving(true);
    await supabaseV2.from('conceptos_cliente').insert({
      codigo: nuevo.codigo.trim(),
      descripcion: nuevo.descripcion.trim() || null,
    });
    setNuevo({ codigo: '', descripcion: '' });
    setSaving(false);
    load();
  };

  const toggle = async (c: ConceptoCliente) => {
    await supabaseV2.from('conceptos_cliente').update({ activo: !c.activo }).eq('codigo', c.codigo);
    load();
  };

  if (loadingUser) return <div className="p-6 text-sm text-slate-500">Cargando…</div>;
  if (!canAdmin) return <div className="p-6 text-sm text-red-600">Solo administradores.</div>;

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Tag className="h-5 w-5 text-indigo-600" /> Conceptos de cliente
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Catálogo soft que clasifica el perfil/origen de cada venta. Se llena automáticamente desde el import del CUH (valores nuevos se crean solos).
        </p>
      </div>

      <div className="flex items-end gap-2 rounded-md border border-slate-200 bg-white p-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">Código</label>
          <input className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm" value={nuevo.codigo} onChange={(e) => setNuevo({ ...nuevo, codigo: e.target.value })} placeholder="NUEVO-2027" />
        </div>
        <div className="flex-[2]">
          <label className="mb-1 block text-xs font-medium text-slate-600">Descripción</label>
          <input className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm" value={nuevo.descripcion} onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })} />
        </div>
        <button onClick={add} disabled={saving || !nuevo.codigo.trim()} className="flex h-9 items-center gap-1 rounded-md bg-indigo-600 px-3 text-sm text-white hover:bg-indigo-500 disabled:opacity-50">
          <Plus className="h-4 w-4" /> Agregar
        </button>
      </div>

      <div className="rounded-md border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="px-3 py-2">Código</th><th className="px-3 py-2">Descripción</th><th className="px-3 py-2 text-right">Ventas</th><th className="px-3 py-2 text-center">Activo</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-3 py-4 text-center text-slate-400">Cargando…</td></tr>
            ) : items.map((c) => (
              <tr key={c.codigo} className="border-t border-slate-100">
                <td className="px-3 py-2 font-mono text-xs">{c.codigo}</td>
                <td className="px-3 py-2 text-slate-700">{c.descripcion ?? <span className="italic text-slate-400">—</span>}</td>
                <td className="px-3 py-2 text-right">{usados[c.codigo] ?? 0}</td>
                <td className="px-3 py-2 text-center">
                  <button onClick={() => toggle(c)} className={`rounded px-2 py-0.5 text-xs ${c.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {c.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

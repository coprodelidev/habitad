'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { useV2User } from '@/lib/v2/useV2User';
import { isAdmin } from '@/lib/v2/permissions';
import type { SapCatalogo } from '@/lib/v2/types';
import { Database, Plus, Trash2 } from 'lucide-react';

const TIPOS = ['almacen', 'programa', 'centro_costo', 'grupo_bif', 'partida', 'subpartida'] as const;

export default function CatalogosSapPage() {
  const { user, loading: loadingUser } = useV2User();
  const canAdmin = isAdmin(user?.roleCode);
  const [items, setItems] = useState<SapCatalogo[]>([]);
  const [mappings, setMappings] = useState<Array<{ propiedad_id: string; cuh: string; item_code: string; warehouse_code: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [nuevo, setNuevo] = useState({ tipo: 'partida', clave: '', valor: '', etapa_codigo: '', descripcion: '' });

  const load = useCallback(async () => {
    setLoading(true);
    const cat = await supabaseV2.from('sap_catalogos').select('*').order('tipo').order('clave');
    setItems((cat.data ?? []) as SapCatalogo[]);
    const map = await supabaseV2
      .from('sap_item_mapping')
      .select('propiedad_id, item_code, warehouse_code, propiedades:propiedad_id(cuh)')
      .limit(200);
    setMappings(((map.data ?? []) as any[]).map((m) => ({
      propiedad_id: m.propiedad_id,
      cuh: m.propiedades?.cuh ?? '—',
      item_code: m.item_code,
      warehouse_code: m.warehouse_code,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!nuevo.clave.trim() || !nuevo.valor.trim()) return;
    await supabaseV2.from('sap_catalogos').insert({
      tipo: nuevo.tipo,
      clave: nuevo.clave.trim(),
      valor: nuevo.valor.trim(),
      etapa_codigo: nuevo.etapa_codigo.trim() || null,
      descripcion: nuevo.descripcion.trim() || null,
    });
    setNuevo({ tipo: 'partida', clave: '', valor: '', etapa_codigo: '', descripcion: '' });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar entrada del catálogo?')) return;
    await supabaseV2.from('sap_catalogos').delete().eq('id', id);
    load();
  };

  if (loadingUser) return <div className="p-6 text-sm text-slate-500">Cargando…</div>;
  if (!canAdmin) return <div className="p-6 text-sm text-red-600">Solo administradores.</div>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Database className="h-5 w-5 text-indigo-600" /> Catálogos SAP
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Códigos que alimentan el export hacia SAP Business One: almacén, programa, centro de costo, grupos BIF, partidas y subpartidas por etapa.
        </p>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-3">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Agregar entrada</h2>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-6">
          <select className="h-8 rounded border border-slate-300 px-2 text-sm" value={nuevo.tipo} onChange={(e) => setNuevo({ ...nuevo, tipo: e.target.value })}>
            {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input className="h-8 rounded border border-slate-300 px-2 text-sm" placeholder="Clave" value={nuevo.clave} onChange={(e) => setNuevo({ ...nuevo, clave: e.target.value })} />
          <input className="h-8 rounded border border-slate-300 px-2 text-sm" placeholder="Valor SAP" value={nuevo.valor} onChange={(e) => setNuevo({ ...nuevo, valor: e.target.value })} />
          <input className="h-8 rounded border border-slate-300 px-2 text-sm" placeholder="Etapa (opt)" value={nuevo.etapa_codigo} onChange={(e) => setNuevo({ ...nuevo, etapa_codigo: e.target.value })} />
          <input className="h-8 rounded border border-slate-300 px-2 text-sm" placeholder="Descripción" value={nuevo.descripcion} onChange={(e) => setNuevo({ ...nuevo, descripcion: e.target.value })} />
          <button onClick={add} className="flex h-8 items-center justify-center gap-1 rounded bg-indigo-600 px-3 text-sm text-white hover:bg-indigo-500">
            <Plus className="h-4 w-4" /> Agregar
          </button>
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="px-3 py-2">Tipo</th><th className="px-3 py-2">Clave</th><th className="px-3 py-2">Valor</th><th className="px-3 py-2">Etapa</th><th className="px-3 py-2">Descripción</th><th></th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="px-3 py-4 text-center text-slate-400">Cargando…</td></tr>
              : items.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-3 py-1.5 font-mono text-xs">{c.tipo}</td>
                  <td className="px-3 py-1.5 font-mono text-xs">{c.clave}</td>
                  <td className="px-3 py-1.5">{c.valor}</td>
                  <td className="px-3 py-1.5 text-xs">{c.etapa_codigo ?? '—'}</td>
                  <td className="px-3 py-1.5 text-xs text-slate-600">{c.descripcion ?? '—'}</td>
                  <td className="px-3 py-1.5 text-right">
                    <button onClick={() => remove(c.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-3 py-2">
          <h2 className="text-sm font-semibold text-slate-900">Item mapping (propiedad → SAP)</h2>
          <p className="text-xs text-slate-500">Primeras 200 entradas. El backfill derivó <code>PT</code>+etapa+CUH; editable por unidad si SAP exige código distinto.</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="px-3 py-2">CUH</th><th className="px-3 py-2">Item Code</th><th className="px-3 py-2">Warehouse</th></tr>
          </thead>
          <tbody>
            {mappings.map((m) => (
              <tr key={m.propiedad_id} className="border-t border-slate-100">
                <td className="px-3 py-1 font-mono text-xs">{m.cuh}</td>
                <td className="px-3 py-1 font-mono text-xs">{m.item_code}</td>
                <td className="px-3 py-1 text-xs">{m.warehouse_code}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

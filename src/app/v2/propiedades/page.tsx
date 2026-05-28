'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { useV2User } from '@/lib/v2/useV2User';
import { canWriteProperty } from '@/lib/v2/permissions';
import { formatMoney } from '@/lib/v2/format';
import type { Propiedad, Etapa } from '@/lib/v2/types';
import { PropiedadModal } from './PropiedadModal';
import Link from 'next/link';
import { Plus, Upload, Pencil, Lock, Unlock } from 'lucide-react';

export default function PropiedadesPage() {
  const { user } = useV2User();
  const [items, setItems] = useState<Propiedad[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [etapaFilter, setEtapaFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [editing, setEditing] = useState<Propiedad | null>(null);
  const [creating, setCreating] = useState(false);
  const canWrite = canWriteProperty(user?.roleCode);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [p, e] = await Promise.all([
      supabaseV2.from('propiedades').select('*').order('cuh'),
      supabaseV2.from('etapas').select('*').order('orden'),
    ]);
    if (p.error) setError(p.error.message);
    else setItems((p.data ?? []) as Propiedad[]);
    if (!e.error) setEtapas((e.data ?? []) as Etapa[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (etapaFilter && p.etapa_id !== etapaFilter) return false;
      if (estadoFilter && p.estado_fisico !== estadoFilter) return false;
      if (q) {
        const needle = q.toLowerCase();
        const hay = [p.cuh, p.manzana, p.lote, p.modelo, p.ubicacion].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [items, q, etapaFilter, estadoFilter]);

  const toggleBlock = async (p: Propiedad) => {
    if (!canWrite) return;
    if (p.estado_fisico === 'bloqueado') {
      await supabaseV2.from('propiedades').update({ estado_fisico: 'libre', bloqueada_motivo: null }).eq('id', p.id);
    } else if (p.estado_fisico === 'libre') {
      const motivo = window.prompt('Motivo del bloqueo:') ?? '';
      await supabaseV2.from('propiedades').update({ estado_fisico: 'bloqueado', bloqueada_motivo: motivo }).eq('id', p.id);
    } else {
      alert('Solo se pueden bloquear unidades libres.');
      return;
    }
    await load();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Propiedades</h1>
          <p className="text-sm text-slate-500">Inventario de unidades: {items.length} registros</p>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <Link
              href="/v2/admin/imports"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Upload className="h-4 w-4" /> Importar CUH (XLSX)
            </Link>
            <button
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" /> Nueva
            </button>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar CUH, Mz, Lt, modelo…"
          className="h-9 flex-1 min-w-[240px] rounded-md border border-slate-300 px-3 text-sm"
        />
        <select value={etapaFilter} onChange={(e) => setEtapaFilter(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm">
          <option value="">Todas las etapas</option>
          {etapas.map((e) => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </select>
        <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm">
          <option value="">Todos los estados</option>
          <option value="libre">Libre</option>
          <option value="separado">Separado</option>
          <option value="ocupado">Ocupado</option>
          <option value="bloqueado">Bloqueado</option>
        </select>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">CUH</th>
              <th className="px-4 py-2">Etapa</th>
              <th className="px-4 py-2">Mz/Lt</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Modelo</th>
              <th className="px-4 py-2">Área</th>
              <th className="px-4 py-2">Precio</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-6 text-center text-slate-500">Cargando…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-6 text-center text-slate-500">Sin registros</td></tr>
            ) : filtered.map((p) => {
              const etapa = etapas.find((e) => e.id === p.etapa_id);
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-mono text-xs text-slate-700">{p.cuh}</td>
                  <td className="px-4 py-2">{etapa?.nombre ?? '—'}</td>
                  <td className="px-4 py-2">{p.manzana ?? '—'}/{p.lote ?? '—'}</td>
                  <td className="px-4 py-2 capitalize">{p.tipo}</td>
                  <td className="px-4 py-2">{p.modelo ?? '—'}</td>
                  <td className="px-4 py-2">{p.area_m2 ? `${p.area_m2} m²` : '—'}</td>
                  <td className="px-4 py-2">{formatMoney(p.precio_venta ?? p.precio_lista, p.moneda)}</td>
                  <td className="px-4 py-2">
                    <EstadoBadge estado={p.estado_fisico} />
                  </td>
                  <td className="px-4 py-2 text-right">
                    {canWrite && (
                      <div className="inline-flex gap-2">
                        <button onClick={() => setEditing(p)} className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => toggleBlock(p)} className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
                          {p.estado_fisico === 'bloqueado' ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <PropiedadModal
          propiedad={editing}
          etapas={etapas}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const colors: Record<string, string> = {
    libre: 'bg-green-100 text-green-800',
    separado: 'bg-yellow-100 text-yellow-800',
    ocupado: 'bg-red-100 text-red-800',
    bloqueado: 'bg-sky-100 text-sky-800',
  };
  return <span className={`inline-block rounded px-2 py-0.5 text-xs capitalize ${colors[estado] ?? 'bg-slate-100 text-slate-700'}`}>{estado}</span>;
}

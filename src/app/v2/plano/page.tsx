'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { useV2User } from '@/lib/v2/useV2User';
import { isStaff } from '@/lib/v2/permissions';
import type { Propiedad, Etapa, Venta } from '@/lib/v2/types';
import { construirPlanoOperativo, cargarTodasLasFilas, type EstadoOperativo, type TipoPlano, type UnidadOperativa } from '@/lib/v2/planoCatalogo';
import { NuevaSeparacionModal } from './NuevaSeparacionModal';
import { UnidadDetalleModal } from './UnidadDetalleModal';
import { formatMoney } from '@/lib/v2/format';

const COLORES: Record<EstadoOperativo, string> = {
  libre: 'bg-emerald-600 text-white hover:bg-emerald-700',
  separado: 'bg-amber-400 text-slate-900 hover:bg-amber-500',
  ocupado: 'bg-red-600 text-white hover:bg-red-700',
};

export default function PlanoPage() {
  const { user } = useV2User();
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [props, setProps] = useState<Propiedad[]>([]);
  const [ventasActivas, setVentasActivas] = useState<Record<string, Venta>>({});
  const [activeEtapa, setActiveEtapa] = useState('all');
  const [tipoFiltro, setTipoFiltro] = useState<'all' | TipoPlano>('all');
  const [estadoFiltro, setEstadoFiltro] = useState<'all' | EstadoOperativo>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Propiedad | null>(null);
  const [creatingSep, setCreatingSep] = useState<Propiedad | null>(null);
  const canOperate = isStaff(user?.roleCode);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [e, p, v] = await Promise.all([
        cargarTodasLasFilas<Etapa>((from, to) => supabaseV2.from('etapas').select('*').order('id').range(from, to)),
        cargarTodasLasFilas<Propiedad>((from, to) => supabaseV2.from('propiedades').select('*').order('id').range(from, to)),
        cargarTodasLasFilas<Venta>((from, to) => supabaseV2.from('ventas').select('*').in('estado', ['separacion', 'inicial', 'cuotas']).order('id').range(from, to)),
      ]);
      setEtapas(e); setProps(p);
      setVentasActivas(Object.fromEntries(v.map((venta) => [venta.propiedad_id, venta])));
    } catch (err) { setError((err as Error).message ?? 'No se pudo cargar el plano.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const unidades = useMemo(() => construirPlanoOperativo(props, etapas), [props, etapas]);
  const etapasCatalogo = useMemo(() => [...new Set(unidades.map((u) => u.etapa).filter(Boolean))], [unidades]);
  const base = useMemo(() => unidades.filter((u) => {
    if (activeEtapa !== 'all' && u.etapa !== activeEtapa) return false;
    if (tipoFiltro !== 'all' && u.tipo !== tipoFiltro) return false;
    return true;
  }), [unidades, activeEtapa, tipoFiltro]);
  const filtered = useMemo(() => base.filter((u) => estadoFiltro === 'all' || u.estado === estadoFiltro), [base, estadoFiltro]);
  const grupos = useMemo(() => {
    const result = new Map<string, { etapa: string; manzana: string; unidades: UnidadOperativa[] }>();
    for (const u of filtered) {
      const key = `${u.etapa}-${u.manzana}`;
      const grupo = result.get(key) ?? { etapa: u.etapa, manzana: u.manzana, unidades: [] };
      grupo.unidades.push(u); result.set(key, grupo);
    }
    return [...result.entries()];
  }, [filtered]);

  const handleClick = (u: UnidadOperativa) => {
    if (!u.propiedad) return;
    if (!canOperate || u.estado !== 'libre') setSelected(u.propiedad);
    else setCreatingSep(u.propiedad);
  };
  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-semibold text-slate-900">Plano de San Fernando</h1><p className="mt-1 text-sm text-slate-500">Distribución por etapa, manzana y lote. </p></div>
        <button onClick={load} disabled={loading} className="rounded-md border bg-white px-3 py-2 text-sm disabled:opacity-50">Actualizar</button>
      </header>
      <div className="flex flex-wrap gap-2" aria-label="Tipo de ubicación">
        {([{ key: 'all', label: 'Todas' }, { key: 'casa', label: 'Casas' }, { key: 'terreno', label: 'Terrenos' }] as const).map((t) => <button key={t.key} onClick={() => setTipoFiltro(t.key)} aria-pressed={tipoFiltro === t.key} className={`rounded-md border px-3 py-2 text-sm ${tipoFiltro === t.key ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>{t.label} ({unidades.filter((u) => t.key === 'all' || u.tipo === t.key).length.toLocaleString('es-PE')})</button>)}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-medium text-slate-600">Etapa<select value={activeEtapa} onChange={(e) => setActiveEtapa(e.target.value)} className="mt-1 block h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"><option value="all">Todas las etapas</option>{etapasCatalogo.map((etapa) => <option key={etapa} value={etapa}>Etapa {etapa} ({unidades.filter((u) => u.etapa === etapa).length})</option>)}</select></label>
      </div>
      {!loading && !error && <>
        <div className="flex flex-wrap gap-2" aria-label="Disponibilidad">
          {([{ key: 'libre', label: 'Libres', color: 'bg-emerald-600' }, { key: 'separado', label: 'Separadas', color: 'bg-amber-400' }, { key: 'ocupado', label: 'Ocupadas', color: 'bg-red-600' }] as const).map((e) => (
            <button key={e.key} onClick={() => setEstadoFiltro((actual) => actual === e.key ? 'all' : e.key)} aria-pressed={estadoFiltro === e.key} className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${estadoFiltro === e.key ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>
              <span className={`h-3 w-3 rounded ${e.color}`} />{e.label} {base.filter((u) => u.estado === e.key).length}
            </button>
          ))}
          {estadoFiltro !== 'all' && <button onClick={() => setEstadoFiltro('all')} className="text-xs text-indigo-600">Ver todas</button>}
        </div>
        <p className="text-sm text-slate-500">{filtered.length.toLocaleString('es-PE')} ubicaciones con los filtros seleccionados</p>
      </>}
      {error ? <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error} <button onClick={load} className="ml-2 underline">Reintentar</button></div> : loading ? <p className="text-slate-500">Cargando todas las ubicaciones…</p> : filtered.length === 0 ? <div className="rounded-lg border border-dashed p-8 text-center text-slate-500">No hay ubicaciones con estos filtros.</div> : <div className="space-y-5">{grupos.map(([key, grupo]) => <section key={key} className="rounded-lg border border-slate-200 bg-white p-3"><h2 className="mb-3 text-sm font-semibold text-slate-800">Etapa {grupo.etapa} · Manzana {grupo.manzana}<span className="ml-2 text-xs font-normal text-slate-500">{grupo.unidades.length} ubicaciones</span></h2><div className="grid grid-cols-[repeat(auto-fill,100px)] gap-2">{grupo.unidades.map((u) => {
        const p = u.propiedad;
        const venta = p ? ventasActivas[p.id] : undefined;
        return <button key={p.id} onClick={() => handleClick(u)} className={`flex min-h-[76px] min-w-0 flex-col items-center justify-center rounded-md px-1.5 py-2 text-center shadow-sm transition disabled:cursor-default ${COLORES[u.estado]}`} title={`${u.codigo} - ${u.tipo === 'casa' ? 'Casa' : 'Terreno'} - ${u.modelo}`}>
          <span className="max-w-full break-words text-[11px] font-medium leading-tight">Mz {u.manzana} - Lt {u.lote}</span>
          {p && <span className="mt-1 max-w-full break-words text-[11px] font-semibold leading-tight">{formatMoney(p.precio_venta ?? p.precio_lista, p.moneda)}</span>}
          <span className="mt-1 max-w-full break-words text-[9px] leading-tight opacity-80">{u.modelo}</span>
          {venta && u.estado === 'separado' && <span className="mt-0.5 text-[10px] font-bold">⏱ {shortDuration(venta.fecha_vencimiento_separacion)}</span>}
        </button>;
      })}</div></section>)}</div>}
      {selected && <UnidadDetalleModal propiedad={selected} venta={ventasActivas[selected.id] ?? null} onClose={() => setSelected(null)} onChanged={() => { setSelected(null); load(); }} />}
      {creatingSep && <NuevaSeparacionModal propiedad={creatingSep} onClose={() => setCreatingSep(null)} onCreated={() => { setCreatingSep(null); load(); }} />}
    </div>
  );
}

function shortDuration(venc: string): string {
  const ms = new Date(venc).getTime() - Date.now();
  if (ms <= 0) return 'venció';
  return `${Math.floor(ms / 3600000)}h${Math.floor((ms % 3600000) / 60000)}m`;
}

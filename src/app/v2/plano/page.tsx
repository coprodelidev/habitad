'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { useV2User } from '@/lib/v2/useV2User';
import { isStaff, isAdmin } from '@/lib/v2/permissions';
import type { Propiedad, Etapa, Venta, EstadoFisico, TipoPropiedad } from '@/lib/v2/types';
import { NuevaSeparacionModal } from './NuevaSeparacionModal';
import { UnidadDetalleModal } from './UnidadDetalleModal';
import { formatMoney } from '@/lib/v2/format';

type TipoFiltro = 'all' | TipoPropiedad;
type EstadoFiltro = 'all' | EstadoFisico;

export default function PlanoPage() {
  const { user } = useV2User();
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [props, setProps] = useState<Propiedad[]>([]);
  const [ventasActivas, setVentasActivas] = useState<Record<string, Venta>>({});
  const [activeEtapa, setActiveEtapa] = useState<string>('all');
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>('all');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Propiedad | null>(null);
  const [creatingSep, setCreatingSep] = useState<Propiedad | null>(null);

  const canOperate = isStaff(user?.roleCode);
  const canBlock = isAdmin(user?.roleCode);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [e, p, v] = await Promise.all([
      supabaseV2.from('etapas').select('*').order('orden'),
      supabaseV2.from('propiedades').select('*').order('cuh'),
      supabaseV2.from('ventas').select('*').in('estado', ['separacion', 'inicial', 'cuotas']),
    ]);
    if (e.error || p.error || v.error) {
      setError(e.error?.message || p.error?.message || v.error?.message || 'Error');
      setLoading(false);
      return;
    }
    setEtapas((e.data ?? []) as Etapa[]);
    setProps((p.data ?? []) as Propiedad[]);
    const vMap: Record<string, Venta> = {};
    for (const vt of (v.data ?? []) as Venta[]) {
      vMap[vt.propiedad_id] = vt;
    }
    setVentasActivas(vMap);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Base: filtrado por etapa + tipo (vivienda/terreno). Alimenta los contadores.
  const base = useMemo(() => {
    return props.filter((p) => {
      if (activeEtapa !== 'all' && p.etapa_id !== activeEtapa) return false;
      if (tipoFiltro !== 'all' && p.tipo !== tipoFiltro) return false;
      return true;
    });
  }, [props, activeEtapa, tipoFiltro]);

  const counts = useMemo(() => {
    const c = { libre: 0, separado: 0, ocupado: 0, bloqueado: 0 };
    for (const p of base) c[p.estado_fisico]++;
    return c;
  }, [base]);

  // Lo que se dibuja: base + filtro de estado (Libres/Separadas/Ocupadas/Bloqueadas).
  const filtered = useMemo(() => {
    if (estadoFiltro === 'all') return base;
    return base.filter((p) => p.estado_fisico === estadoFiltro);
  }, [base, estadoFiltro]);

  const toggleEstado = (e: EstadoFisico) => setEstadoFiltro((cur) => (cur === e ? 'all' : e));

  const handleClick = (p: Propiedad) => {
    if (!canOperate) {
      setSelected(p);
      return;
    }
    if (p.estado_fisico === 'libre') setCreatingSep(p);
    else setSelected(p);
  };

  const handleRightClick = async (e: React.MouseEvent, p: Propiedad) => {
    e.preventDefault();
    if (!canBlock) return;
    if (p.estado_fisico === 'libre') {
      const motivo = window.prompt('Motivo del bloqueo (queda en auditoría):') ?? '';
      if (!motivo) return;
      const { error: updateError } = await supabaseV2.from('propiedades').update({ estado_fisico: 'bloqueado', bloqueada_motivo: motivo }).eq('id', p.id);
      if (updateError) { setError(updateError.message); return; }
      load();
    } else if (p.estado_fisico === 'bloqueado') {
      if (!confirm('¿Desbloquear esta unidad?')) return;
      const { error: updateError } = await supabaseV2.from('propiedades').update({ estado_fisico: 'libre', bloqueada_motivo: null }).eq('id', p.id);
      if (updateError) { setError(updateError.message); return; }
      load();
    }
  };

  return (
    <div>
      <header className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Plano</h1>
          <p className="text-sm text-slate-500">Click en una unidad para operar sobre ella.</p>
        </div>
        <div className="flex gap-3 text-xs">
          <Legend color="bg-emerald-600" label="Libres" count={counts.libre} active={estadoFiltro === 'libre'} onClick={() => toggleEstado('libre')} />
          <Legend color="bg-amber-400" label="Separadas" count={counts.separado} active={estadoFiltro === 'separado'} onClick={() => toggleEstado('separado')} />
          <Legend color="bg-red-600" label="Ocupadas" count={counts.ocupado} active={estadoFiltro === 'ocupado'} onClick={() => toggleEstado('ocupado')} />
          <Legend color="bg-sky-600" label="Bloqueadas" count={counts.bloqueado} active={estadoFiltro === 'bloqueado'} onClick={() => toggleEstado('bloqueado')} />
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-end gap-4">
        {/* Filtro de etapa: desplegable */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Etapa</label>
          <select
            value={activeEtapa}
            onChange={(e) => setActiveEtapa(e.target.value)}
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">Todas las etapas ({props.length})</option>
            {etapas.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
        </div>

        {/* Filtro de tipo: Vivienda / Terreno */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Tipo</label>
          <div className="flex gap-1">
            <TipoBtn label="Todos" active={tipoFiltro === 'all'} onClick={() => setTipoFiltro('all')} />
            <TipoBtn label="Vivienda" active={tipoFiltro === 'casa'} onClick={() => setTipoFiltro('casa')} />
            <TipoBtn label="Terreno" active={tipoFiltro === 'terreno'} onClick={() => setTipoFiltro('terreno')} />
          </div>
        </div>

        {estadoFiltro !== 'all' && (
          <button
            onClick={() => setEstadoFiltro('all')}
            className="h-9 self-end rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-600 hover:bg-slate-50"
          >
            Quitar filtro de estado ✕
          </button>
        )}
      </div>

      {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="text-slate-500">Cargando plano…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          {base.length === 0
            ? <>No hay unidades con estos filtros. Crea alguna desde <span className="font-medium">Propiedades</span> o importa un Excel.</>
            : 'No hay unidades en ese estado con los filtros actuales.'}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,100px)] gap-2">
          {filtered.map((p) => {
            const color =
              p.estado_fisico === 'libre' ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : p.estado_fisico === 'separado' ? 'bg-amber-400 hover:bg-amber-500 text-slate-900'
              : p.estado_fisico === 'ocupado' ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-sky-600 hover:bg-sky-700 text-white';
            const venta = ventasActivas[p.id];
            return (
              <button
                key={p.id}
                onClick={() => handleClick(p)}
                onContextMenu={(e) => handleRightClick(e, p)}
                className={`relative flex min-h-[68px] min-w-0 flex-col items-center justify-center rounded-md px-1.5 py-2 font-medium shadow-sm transition ${color}`}
                title={`${p.cuh} — ${p.manzana ?? ''}/${p.lote ?? ''}${canBlock ? ' (click derecho: bloquear/desbloquear)' : ''}`}
              >
                <span className="max-w-full break-words text-center text-[11px] leading-tight opacity-90">Mz {p.manzana ?? '—'}/Lt {p.lote ?? '—'}</span>
                <span className="mt-1 max-w-full break-words text-center text-[11px] font-semibold leading-tight">{formatMoney(p.precio_venta ?? p.precio_lista, p.moneda)}</span>
                {venta && p.estado_fisico === 'separado' && (
                  <span className="mt-0.5 text-[10px] font-bold">⏱ {shortDuration(venta.fecha_vencimiento_separacion)}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <UnidadDetalleModal
          propiedad={selected}
          venta={ventasActivas[selected.id] ?? null}
          onClose={() => setSelected(null)}
          onChanged={() => { setSelected(null); load(); }}
        />
      )}
      {creatingSep && (
        <NuevaSeparacionModal
          propiedad={creatingSep}
          onClose={() => setCreatingSep(null)}
          onCreated={() => { setCreatingSep(null); load(); }}
        />
      )}
    </div>
  );
}

function Legend({ color, label, count, active, onClick }: { color: string; label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Filtrar por ${label.toLowerCase()}`}
      className={`flex items-center gap-1.5 rounded-md border px-2 py-1 transition ${active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
    >
      <span className={`inline-block h-3 w-3 rounded ${color}`} /> {label} {count}
    </button>
  );
}

function TipoBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded-md px-3 text-sm transition ${active ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
    >
      {label}
    </button>
  );
}

function shortDuration(venc: string): string {
  const ms = new Date(venc).getTime() - Date.now();
  if (ms <= 0) return 'venció';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h${m}m`;
}

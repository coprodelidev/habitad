'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { useV2User } from '@/lib/v2/useV2User';
import { isStaff, isAdmin } from '@/lib/v2/permissions';
import type { Propiedad, Etapa, Venta } from '@/lib/v2/types';
import { NuevaSeparacionModal } from './NuevaSeparacionModal';
import { UnidadDetalleModal } from './UnidadDetalleModal';
import { formatMoney } from '@/lib/v2/format';

export default function PlanoPage() {
  const { user } = useV2User();
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [props, setProps] = useState<Propiedad[]>([]);
  const [ventasActivas, setVentasActivas] = useState<Record<string, Venta>>({});
  const [activeEtapa, setActiveEtapa] = useState<string>('all');
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

  const filtered = useMemo(() => {
    if (activeEtapa === 'all') return props;
    return props.filter((p) => p.etapa_id === activeEtapa);
  }, [props, activeEtapa]);

  const counts = useMemo(() => {
    const c = { libre: 0, separado: 0, ocupado: 0, bloqueado: 0 };
    for (const p of filtered) c[p.estado_fisico]++;
    return c;
  }, [filtered]);

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
      await supabaseV2.from('propiedades').update({ estado_fisico: 'bloqueado', bloqueada_motivo: motivo }).eq('id', p.id);
      load();
    } else if (p.estado_fisico === 'bloqueado') {
      if (!confirm('¿Desbloquear esta unidad?')) return;
      await supabaseV2.from('propiedades').update({ estado_fisico: 'libre', bloqueada_motivo: null }).eq('id', p.id);
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
        <div className="flex gap-4 text-xs">
          <Legend color="bg-green-500" label={`Libres ${counts.libre}`} />
          <Legend color="bg-yellow-400" label={`Separadas ${counts.separado}`} />
          <Legend color="bg-red-500" label={`Ocupadas ${counts.ocupado}`} />
          <Legend color="bg-sky-500" label={`Bloqueadas ${counts.bloqueado}`} />
        </div>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveEtapa('all')}
          className={`rounded-md px-3 py-1.5 text-sm ${activeEtapa === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-300'}`}
        >
          Todas ({props.length})
        </button>
        {etapas.map((e) => (
          <button
            key={e.id}
            onClick={() => setActiveEtapa(e.id)}
            className={`rounded-md px-3 py-1.5 text-sm ${activeEtapa === e.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-300'}`}
          >
            {e.nombre}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="text-slate-500">Cargando plano…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          No hay unidades en esta etapa. Crea alguna desde <span className="font-medium">Propiedades</span> o importa un Excel.
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-3">
          {filtered.map((p) => {
            const color =
              p.estado_fisico === 'libre' ? 'bg-green-500 hover:bg-green-600'
              : p.estado_fisico === 'separado' ? 'bg-yellow-400 hover:bg-yellow-500 text-slate-900'
              : p.estado_fisico === 'ocupado' ? 'bg-red-500 hover:bg-red-600'
              : 'bg-sky-500 hover:bg-sky-600';
            const venta = ventasActivas[p.id];
            return (
              <button
                key={p.id}
                onClick={() => handleClick(p)}
                onContextMenu={(e) => handleRightClick(e, p)}
                className={`relative flex min-h-[96px] flex-col items-center justify-center rounded-lg p-3 text-white shadow transition ${color}`}
                title={`${p.cuh} — ${p.manzana ?? ''}/${p.lote ?? ''}${canBlock ? ' (click derecho: bloquear/desbloquear)' : ''}`}
              >
                <span className="text-xs opacity-80">{p.manzana ?? '—'}/{p.lote ?? '—'}</span>
                <span className="mt-0.5 font-mono text-xs">{p.cuh}</span>
                <span className="mt-1 text-[11px] opacity-90">{formatMoney(p.precio_venta ?? p.precio_lista, p.moneda)}</span>
                {venta && p.estado_fisico === 'separado' && (
                  <span className="mt-0.5 text-[10px] font-medium">⏱ {shortDuration(venta.fecha_vencimiento_separacion)}</span>
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

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded ${color}`} /> {label}
    </div>
  );
}

function shortDuration(venc: string): string {
  const ms = new Date(venc).getTime() - Date.now();
  if (ms <= 0) return 'venció';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h${m}m`;
}

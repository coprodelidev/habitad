'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js';

type Cuh = {
  id: string;
  etapa: number;
  codigo_cuh: string;
  modelo: string;
  precio_cuh: number;
  partida: string;
  manzana: number;
  lote: number;
  ubicacion: string | null;
  area_lote: number | null;
  precio_promotor: number | null;
};

type Cliente = {
  id: string;
  country_code: string;
  phone_number: string;
  email: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  full_phone: string | null;
  created_at: string;
  tipo: 'cliente' | 'interesado' | string;
};

type EtapaGroup = { etapa: number; manzanas: ManzanaGroup[] };
type ManzanaGroup = { manzana: number; rows: Cuh[]; minArea: number; maxArea: number };

export default function StockPlan() {
  const [data, setData] = useState<Cuh[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [etapaOpen, setEtapaOpen] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Cuh | null>(null);

  useEffect(() => {
    const client = supabase as unknown as SupabaseClient;
    client
      .from('cuh')
      .select('*')
      .then(({ data, error }: { data: Cuh[] | null; error: any }) => {
        if (!error && data) setData(data);
      });
    client
      .from('clientes')
      .select('*')
      .then(({ data, error }: { data: Cliente[] | null; error: any }) => {
        if (!error && data) setClients(data);
      });
  }, []);

  const grupos = useMemo<EtapaGroup[]>(() => {
    const byEtapa = new Map<number, Cuh[]>();
    for (const r of data) {
      const arr = byEtapa.get(r.etapa) ?? [];
      arr.push(r);
      byEtapa.set(r.etapa, arr);
    }
    const result: EtapaGroup[] = [];
    for (const [etapa, rows] of Array.from(byEtapa.entries()).sort((a, b) => a[0] - b[0])) {
      const byMZ = new Map<number, Cuh[]>();
      for (const r of rows) {
        const arr = byMZ.get(r.manzana) ?? [];
        arr.push(r);
        byMZ.set(r.manzana, arr);
      }
      const manzanas: ManzanaGroup[] = Array.from(byMZ.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([manzana, mzRows]) => {
          const numericAreas = mzRows.map(x => (x.area_lote ?? 0)).filter((n) => Number.isFinite(n));
          const minArea = numericAreas.length ? Math.min(...numericAreas) : 0;
          const maxArea = numericAreas.length ? Math.max(...numericAreas) : 0;
          const rowsSorted = [...mzRows].sort((a, b) => a.lote - b.lote);
          return { manzana, rows: rowsSorted, minArea, maxArea };
        });
      result.push({ etapa, manzanas });
    }
    return result;
  }, [data]);

  function toggleEtapa(et: number) {
    setEtapaOpen(prev => {
      const n = new Set(prev);
      if (n.has(et)) n.delete(et);
      else n.add(et);
      return n;
    });
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Plano de Stock</h1>
        <div className="text-sm text-gray-600">{data.length} propiedades</div>
      </header>

      <Legend />

      <div className="space-y-4">
        {grupos.map((g) => (
          <section key={g.etapa} className="rounded-lg border bg-white shadow-sm">
            <button
              onClick={() => toggleEtapa(g.etapa)}
              className="flex w-full items-center justify-between rounded-t-lg px-4 py-3 text-left hover:bg-gray-50"
              aria-expanded={etapaOpen.has(g.etapa)}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                  {g.etapa}
                </span>
                <h2 className="text-sm font-semibold">Etapa {g.etapa}</h2>
              </div>
              <span className="text-xs text-gray-500">{g.manzanas.length} manzanas</span>
            </button>

            <div className={etapaOpen.has(g.etapa) ? 'block' : 'hidden'}>
              <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                {g.manzanas.map((mz) => (
                  <ManzanaBlock key={`${g.etapa}-${mz.manzana}`} grupo={mz} onSelect={setSelected} />
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      {selected && (
        <FichaModal
          imgSrc="/images/slider2.jpg"
          cuh={selected}
          clients={clients}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function ManzanaBlock({ grupo, onSelect }: { grupo: ManzanaGroup; onSelect: (r: Cuh) => void }) {
  const { manzana, rows, minArea, maxArea } = grupo;
  const base = 80;
  const cols = 12;

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold">Manzana {manzana}</div>
        <div className="text-xs text-gray-500">{rows.length} lotes</div>
      </div>

      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(${base}px, 1fr))`,
          gridAutoRows: `${base}px`,
          gridAutoFlow: 'dense',
        }}
      >
        {rows.map((r) => {
          const { colSpan, rowSpan } = spanFromArea(r.area_lote, minArea, maxArea, cols);
          const { card, badge } = modelStyle(r.modelo);
          const esquina = isCorner(r);

          return (
            <button
              key={`${r.etapa}-${r.manzana}-${r.lote}-${r.codigo_cuh}`}
              onClick={() => onSelect(r)}
              className={[
                'group relative flex flex-col overflow-hidden rounded-xl border p-2 text-left shadow-sm transition',
                'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/40',
                card,
                esquina ? 'ring-1 ring-amber-500' : '',
              ].join(' ')}
              style={{ gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}` }}
              title={`ET ${r.etapa} · MZ ${r.manzana} · LT ${r.lote} · ${r.modelo}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-mono text-sm">{r.codigo_cuh}</div>
                  <div className="truncate text-xs opacity-80">{r.modelo}</div>
                </div>
                {esquina && (
                  <span className="rounded bg-amber-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                    ESQUINA
                  </span>
                )}
              </div>

              <div className="mt-auto flex items-center justify-between">
                <div className={['rounded px-1.5 py-0.5 text-[10px] font-semibold', badge].join(' ')}>
                  MZ {r.manzana} · LT {r.lote}
                </div>
                <div className="text-sm font-semibold tabular-nums">{money(r.precio_cuh)}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FichaModal({
  imgSrc,
  cuh,
  clients,
  onClose,
}: {
  imgSrc: string;
  cuh: Cuh;
  clients: Cliente[];
  onClose: () => void;
}) {
  const [mode, setMode] = useState<'details' | 'select'>('details');
  const [search, setSearch] = useState('');
  const filtered = clients.filter(c => {
    const text = `${c.primer_nombre} ${c.primer_apellido} ${c.email} ${c.full_phone ?? ''}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  async function handleLink(client: Cliente) {
    const payload = {
      promotor_id: 'bd693628-4a47-4176-8689-8f8ced52d469',
      cliente_id: client.id,
      cuh_id: cuh.id,
      estado: 'reservado',
    };
    await (supabase.from('reservas') as any).insert(payload);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-[320px,1fr]">
          <div className="relative aspect-[4/3] md:aspect-auto md:h-full">
            <Image src={imgSrc} alt="Propiedad" fill className="object-cover" priority />
          </div>
          <div className="flex flex-col p-4">
            {mode === 'details' ? (
              <>
                <div className="mb-1 text-xs text-gray-500">Etapa {cuh.etapa}</div>
                <h3 className="text-lg font-semibold">
                  {cuh.codigo_cuh} · {cuh.modelo}
                </h3>
                <div className="mt-1 text-sm text-gray-700">
                  MZ {cuh.manzana} · LT {cuh.lote} {cuh.ubicacion ? `· ${cuh.ubicacion}` : ''}
                </div>
                <div className="mt-3 text-xl font-bold">{money(cuh.precio_cuh)}</div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <Info label="Partida" value={cuh.partida} mono />
                  <Info label="Área (m²)" value={cuh.area_lote ?? '—'} />
                  <Info label="Precio promotor" value={cuh.precio_promotor != null ? money(cuh.precio_promotor) : '—'} />
                  <Info label="Ubicación" value={cuh.ubicacion ?? '—'} />
                </div>

                <div className="mt-auto flex items-center justify-end gap-2 pt-5">
                  <button
                    onClick={onClose}
                    className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => setMode('select')}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Separar
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold">Seleccionar Cliente</h3>
                <input
                  className="mt-2 border px-3 py-2 rounded-lg"
                  placeholder="Buscar cliente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="mt-3 overflow-y-auto max-h-60">
                  {filtered.map(c => (
                    <div key={c.id} className="flex justify-between items-center border-b py-2">
                      <span>{c.primer_nombre} {c.primer_apellido} ({c.email})</span>
                      <button
                        onClick={() => handleLink(c)}
                        className="bg-green-600 text-white px-3 py-1 rounded"
                      >
                        Seleccionar
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-auto flex justify-end pt-5">
                  <button
                    onClick={() => setMode('details')}
                    className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Volver
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="rounded-lg border bg-gray-50 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
      <div className={['mt-0.5 text-sm', mono ? 'font-mono' : ''].join(' ')}>{value}</div>
    </div>
  );
}

function Legend() {
  const samples = ['ACACIA', 'SAUCE', 'OTRO'];
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white p-3 text-[11px] text-gray-700">
      <span className="font-semibold">Leyenda:</span>
      <span className="inline-flex items-center gap-1">
        <i className="inline-block h-3 w-3 rounded border border-amber-500" /> ESQUINA
      </span>
      {samples.map((m) => {
        const { card } = modelStyle(m);
        return (
          <span key={m} className="inline-flex items-center gap-1">
            <i className={['inline-block h-3 w-5 rounded border', card].join(' ')} />
            {m}
          </span>
        );
      })}
      <span className="inline-flex items-center gap-1">
        <i className="inline-block h-3 w-3 rounded border bg-white" /> Interior
      </span>
    </div>
  );
}

function isCorner(r: Cuh): boolean {
  return (r.ubicacion ?? '').toUpperCase().includes('ESQUINA');
}

function money(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function modelStyle(modelo: string): { card: string; badge: string } {
  const m = modelo.toUpperCase();
  if (m.includes('ACACIA')) {
    return { card: 'border-emerald-200 bg-emerald-50', badge: 'bg-emerald-100 text-emerald-800' };
  }
  if (m.includes('SAUCE')) {
    return { card: 'border-sky-200 bg-sky-50', badge: 'bg-sky-100 text-sky-800' };
  }
  return { card: 'border-gray-200 bg-gray-50', badge: 'bg-gray-100 text-gray-800' };
}

function spanFromArea(
  area: number | null,
  minArea: number,
  maxArea: number,
  gridCols: number
): { colSpan: number; rowSpan: number } {
  if (area == null || !Number.isFinite(area) || maxArea <= minArea) {
    const span = 3;
    return clampSpan(span, span, gridCols);
  }

  const rel = (area - minArea) / (maxArea - minArea);
  let span: 2 | 3 | 4;
  if (rel < 0.33) span = 2;
  else if (rel < 0.66) span = 3;
  else span = 4;

  return clampSpan(span, span, gridCols);
}

function clampSpan(col: number, row: number, gridCols: number): { colSpan: number; rowSpan: number } {
  const colSpan = Math.max(2, Math.min(col, Math.max(2, gridCols)));
  const rowSpan = Math.max(2, row);
  return { colSpan, rowSpan };
}
'use client';

import { useEffect, useRef, useState } from 'react';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import type { Ubigeo } from '@/lib/v2/types';
import { Search, X } from 'lucide-react';

interface Props {
  value: string | null | undefined;
  onChange: (cod: string | null, ubigeo: Ubigeo | null) => void;
  placeholder?: string;
}

// Normaliza para comparar sin tildes ni mayúsculas (ej. "áncash" == "ancash").
function norm(s: string): string {
  return (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

// Ordena los resultados por relevancia: coincidencia exacta de distrito primero,
// luego prefijo de distrito, provincia, departamento, y por último "contiene".
// Así, al teclear "Ica" sale Ica/Ica/Ica arriba en vez de Tarica, Ticapampa, etc.
function rankUbigeos(rows: Ubigeo[], q: string): Ubigeo[] {
  const nq = norm(q);
  const score = (u: Ubigeo): number => {
    const d = norm(u.distrito), p = norm(u.provincia), dep = norm(u.departamento);
    if (d === nq) return 0;
    if (d.startsWith(nq)) return 1;
    if (p === nq) return 2;
    if (dep === nq) return 3;
    if (p.startsWith(nq)) return 4;
    if (dep.startsWith(nq)) return 5;
    if (d.includes(nq)) return 6;
    return 7;
  };
  return [...rows].sort((a, b) => {
    const sa = score(a), sb = score(b);
    if (sa !== sb) return sa - sb;
    return norm(a.distrito).localeCompare(norm(b.distrito));
  });
}

export function UbigeoAutocomplete({ value, onChange, placeholder }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Ubigeo[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Ubigeo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<any>(null);

  // Resolver el código inicial → obtener objeto Ubigeo
  useEffect(() => {
    if (!value) { setSelected(null); return; }
    if (selected?.codigo === value) return;
    supabaseV2.from('ubigeos').select('*').eq('codigo', value).maybeSingle()
      .then((res: any) => setSelected((res?.data ?? null) as Ubigeo | null));
  }, [value]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Búsqueda server-side con debounce
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      let queryBuilder = supabaseV2.from('ubigeos').select('*');
      if (q) {
        // Buscar en 3 campos (distrito, provincia, departamento) + código exacto.
        // Límite alto + ranking client-side: si solo trajéramos 40 ordenados por
        // código, "Ica" (11xxxx) quedaba fuera por culpa de los muchos distritos
        // que CONTIENEN "ica" en departamentos previos (Tarica, Ticapampa, etc.).
        queryBuilder = queryBuilder.or(
          `distrito.ilike.*${q}*,provincia.ilike.*${q}*,departamento.ilike.*${q}*,codigo.ilike.${q}*`
        ).limit(300);
      } else {
        queryBuilder = queryBuilder.order('departamento').order('provincia').order('distrito').limit(40);
      }
      const res: any = await queryBuilder;
      const rows = (res?.data ?? []) as Ubigeo[];
      setResults(q ? rankUbigeos(rows, q).slice(0, 40) : rows);
      setLoading(false);
    }, 180);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, open]);

  const pick = (u: Ubigeo) => {
    setSelected(u);
    setQuery('');
    setOpen(false);
    onChange(u.codigo, u);
  };

  const clear = () => {
    setSelected(null);
    setQuery('');
    onChange(null, null);
  };

  return (
    <div ref={containerRef} className="relative">
      {selected ? (
        <div className="flex h-9 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm">
          <div className="truncate">
            <span className="font-medium text-slate-900">{selected.distrito}</span>
            <span className="text-slate-500"> · {selected.provincia}, {selected.departamento}</span>
            <span className="ml-2 font-mono text-xs text-slate-400">{selected.codigo}</span>
          </div>
          <button onClick={clear} className="text-slate-400 hover:text-red-600" title="Quitar">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder ?? 'Buscar distrito, provincia o departamento…'}
            className="h-9 w-full rounded-md border border-slate-300 pl-7 pr-2 text-sm"
          />
        </div>
      )}

      {open && !selected && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {loading && (
            <div className="px-3 py-2 text-xs text-slate-500">Buscando…</div>
          )}
          {!loading && results.length === 0 && query && (
            <div className="px-3 py-2 text-xs text-slate-500">Sin coincidencias para «{query}»</div>
          )}
          {!loading && results.length === 0 && !query && (
            <div className="px-3 py-2 text-xs text-slate-500">Empieza a teclear…</div>
          )}
          {!loading && results.map((u) => (
            <button
              key={u.codigo}
              type="button"
              onClick={() => pick(u)}
              className="flex w-full items-start gap-2 border-b border-slate-100 px-3 py-2 text-left text-xs last:border-0 hover:bg-indigo-50"
            >
              <span className="mt-0.5 font-mono text-[10px] text-slate-400">{u.codigo}</span>
              <span className="flex-1">
                <span className="font-medium text-slate-900">{u.distrito}</span>
                <span className="block text-slate-500">{u.provincia} · {u.departamento}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

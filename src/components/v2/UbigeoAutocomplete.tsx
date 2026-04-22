'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import type { Ubigeo } from '@/lib/v2/types';
import { Check, Search, X } from 'lucide-react';

interface Props {
  value: string | null | undefined;
  onChange: (cod: string | null, ubigeo: Ubigeo | null) => void;
  placeholder?: string;
}

export function UbigeoAutocomplete({ value, onChange, placeholder }: Props) {
  const [all, setAll] = useState<Ubigeo[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Ubigeo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cargar catálogo entero una sola vez (1.8k filas, ~80KB — aceptable para autocomplete instantáneo)
  useEffect(() => {
    supabaseV2.from('ubigeos').select('*').order('departamento').order('provincia').order('distrito')
      .then((res: any) => setAll((res?.data ?? []) as Ubigeo[]));
  }, []);

  // Sincronizar el valor externo con el objeto
  useEffect(() => {
    if (value && all.length > 0) {
      const found = all.find((u) => u.codigo === value) ?? null;
      setSelected(found);
    } else if (!value) {
      setSelected(null);
    }
  }, [value, all]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all.slice(0, 40);
    return all.filter((u) =>
      u.distrito.toLowerCase().includes(q) ||
      u.provincia.toLowerCase().includes(q) ||
      u.departamento.toLowerCase().includes(q) ||
      u.codigo.startsWith(q)
    ).slice(0, 40);
  }, [query, all]);

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
          <button onClick={clear} className="text-slate-400 hover:text-red-600">
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

      {open && !selected && results.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {results.map((u) => (
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
      {open && !selected && results.length === 0 && query && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-lg">
          Sin coincidencias
        </div>
      )}
    </div>
  );
}

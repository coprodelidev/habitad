'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { useV2User } from '@/lib/v2/useV2User';
import { isStaff } from '@/lib/v2/permissions';
import { Users, Plus, Search } from 'lucide-react';
import type { Cliente } from '@/lib/v2/types';

export default function ClientesPage() {
  const { user, loading: loadingUser } = useV2User();
  const canStaff = isStaff(user?.roleCode);
  const [items, setItems] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    // Hasta 2000 clientes; scoping por RLS para promotor (solo los suyos).
    const { data } = await supabaseV2.from('clientes').select('*').order('apellidos').limit(2000);
    setItems((data ?? []) as Cliente[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const needle = q.toLowerCase();
    return items.filter((c) =>
      [c.dni, c.nombres, c.apellidos, c.apellido_paterno, c.apellido_materno, c.email, c.telefono]
        .filter(Boolean).join(' ').toLowerCase().includes(needle)
    );
  }, [items, q]);

  if (loadingUser) return <div className="p-6 text-sm text-slate-500">Cargando…</div>;
  if (!canStaff) return <div className="p-6 text-sm text-red-600">Solo personal interno.</div>;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Users className="h-5 w-5 text-indigo-600" /> Clientes
          </h1>
          <p className="mt-1 text-sm text-slate-600">{items.length} clientes cargados</p>
        </div>
        <Link
          href="/v2/clientes/nuevo"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" /> Nuevo cliente
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar DNI, nombre, apellido, email, teléfono…"
          className="h-10 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">DNI</th>
              <th className="px-3 py-2">Apellidos</th>
              <th className="px-3 py-2">Nombres</th>
              <th className="px-3 py-2">Teléfono</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Ubigeo</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-slate-400">Cargando…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-center text-slate-400">Sin resultados.</td></tr>
            ) : (
              filtered.slice(0, 500).map((c) => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-1.5 font-mono text-xs">{c.dni}</td>
                  <td className="px-3 py-1.5">{c.apellidos}</td>
                  <td className="px-3 py-1.5">{c.nombres}</td>
                  <td className="px-3 py-1.5">{c.telefono ?? '—'}</td>
                  <td className="px-3 py-1.5">{c.email ?? '—'}</td>
                  <td className="px-3 py-1.5 font-mono text-xs">{c.ubigeo_cod ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {filtered.length > 500 && (
          <div className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
            Mostrando los primeros 500 de {filtered.length} resultados. Refiná la búsqueda para ver más.
          </div>
        )}
      </div>
    </div>
  );
}

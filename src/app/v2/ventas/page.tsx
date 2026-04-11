'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { formatDate, formatMoney } from '@/lib/v2/format';
import type { Venta, Propiedad, Cliente } from '@/lib/v2/types';

interface VentaRow extends Venta {
  propiedad?: Propiedad | null;
  cliente?: Cliente | null;
}

export default function VentasPage() {
  const [rows, setRows] = useState<VentaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabaseV2
        .from('ventas')
        .select('*, propiedad:propiedades(*), cliente:clientes(*)')
        .order('fecha_separacion', { ascending: false });
      if (error) setError(error.message);
      else setRows((data ?? []) as VentaRow[]);
      setLoading(false);
    })();
  }, []);

  const filtered = rows.filter((r) => {
    if (estadoFilter && r.estado !== estadoFilter) return false;
    if (q) {
      const hay = `${r.propiedad?.cuh ?? ''} ${r.cliente?.dni ?? ''} ${r.cliente?.nombres ?? ''} ${r.cliente?.apellidos ?? ''}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-2xl font-semibold text-slate-900">Ventas</h1>
        <p className="text-sm text-slate-500">{rows.length} registros</p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por CUH, DNI o cliente…"
          className="h-9 flex-1 min-w-[240px] rounded-md border border-slate-300 px-3 text-sm"
        />
        <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm">
          <option value="">Todos los estados</option>
          <option value="separacion">Separación</option>
          <option value="inicial">Inicial</option>
          <option value="cuotas">Cuotas</option>
          <option value="cancelada">Cancelada</option>
          <option value="entregada">Entregada</option>
        </select>
      </div>

      {error && <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">CUH</th>
              <th className="px-4 py-2">Cliente</th>
              <th className="px-4 py-2">DNI</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Precio</th>
              <th className="px-4 py-2">Fecha sep.</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">Cargando…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">Sin registros</td></tr>
            ) : filtered.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs">{v.propiedad?.cuh ?? '—'}</td>
                <td className="px-4 py-2">{v.cliente ? `${v.cliente.nombres} ${v.cliente.apellidos}` : '—'}</td>
                <td className="px-4 py-2">{v.cliente?.dni ?? '—'}</td>
                <td className="px-4 py-2 capitalize">{v.estado}</td>
                <td className="px-4 py-2">{formatMoney(v.precio_acordado, v.moneda)}</td>
                <td className="px-4 py-2">{formatDate(v.fecha_separacion)}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/v2/ventas/${v.id}`} className="text-indigo-600 hover:underline">Abrir</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

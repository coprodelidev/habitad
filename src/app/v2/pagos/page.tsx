'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { formatDate, formatMoney } from '@/lib/v2/format';
import { useV2User } from '@/lib/v2/useV2User';
import { isAdmin } from '@/lib/v2/permissions';

interface PagoRow {
  id: string;
  venta_id: string;
  tipo: string;
  cuota_numero: number | null;
  fecha_deposito: string;
  numero_operacion: string | null;
  banco: string | null;
  monto: number;
  moneda: 'PEN' | 'USD';
  estado: string;
  venta?: {
    id: string;
    propiedad?: { cuh: string; manzana: string | null; lote: string | null; etapa?: { nombre: string } | null } | null;
    cliente?: { nombres: string; apellidos: string; dni: string } | null;
  } | null;
}

export default function PagosPage() {
  const { user } = useV2User();
  const canImport = isAdmin(user?.roleCode);
  const [rows, setRows] = useState<PagoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tipoFilter, setTipoFilter] = useState('');
  const [q, setQ] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabaseV2
        .from('pagos')
        .select('*, venta:ventas(id, propiedad:propiedades(cuh, manzana, lote, etapa:etapas(nombre)), cliente:clientes(nombres, apellidos, dni))')
        .order('fecha_deposito', { ascending: false })
        .limit(500);
      if (desde) query = query.gte('fecha_deposito', desde);
      if (hasta) query = query.lte('fecha_deposito', hasta);
      if (tipoFilter) query = query.eq('tipo', tipoFilter);
      const { data, error } = await query;
      if (error) setError(error.message);
      else setRows((data ?? []) as PagoRow[]);
      setLoading(false);
    })();
  }, [tipoFilter, desde, hasta]);

  const filtered = rows.filter((r) => {
    if (!q) return true;
    const hay = `${r.venta?.propiedad?.cuh ?? ''} ${r.venta?.cliente?.dni ?? ''} ${r.venta?.cliente?.nombres ?? ''} ${r.venta?.cliente?.apellidos ?? ''} ${r.numero_operacion ?? ''}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const totalUSD = filtered.filter((r) => r.moneda === 'USD' && r.estado !== 'anulado').reduce((a, p) => a + Number(p.monto), 0);
  const totalPEN = filtered.filter((r) => r.moneda === 'PEN' && r.estado !== 'anulado').reduce((a, p) => a + Number(p.monto), 0);

  return (
    <div>
      <header className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Pagos</h1>
          <p className="text-sm text-slate-500">Vista global de pagos registrados</p>
        </div>
        {canImport && (
          <Link href="/v2/pagos/importar" className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500">
            Importar reporte bancario
          </Link>
        )}
      </header>

      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-5">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className="h-9 rounded-md border border-slate-300 px-3 text-sm md:col-span-2" />
        <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm">
          <option value="">Todos los tipos</option>
          <option value="separacion">Separación</option>
          <option value="inicial">Inicial</option>
          <option value="cuota">Cuota</option>
        </select>
        <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm" />
        <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm" />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
        <Metric label="Recaudación USD" value={formatMoney(totalUSD, 'USD')} />
        <Metric label="Recaudación PEN" value={formatMoney(totalPEN, 'PEN')} />
        <Metric label="Pagos listados" value={filtered.length.toString()} />
      </div>

      {error && <div className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">CUH</th>
              <th className="px-3 py-2">Mz/Lt</th>
              <th className="px-3 py-2">Etapa</th>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">DNI</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Nº op.</th>
              <th className="px-3 py-2">Banco</th>
              <th className="px-3 py-2 text-right">Monto</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} className="px-3 py-6 text-center text-slate-500">Cargando…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={12} className="px-3 py-6 text-center text-slate-500">Sin pagos</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-1.5">{formatDate(p.fecha_deposito)}</td>
                <td className="px-3 py-1.5 font-mono text-xs">{p.venta?.propiedad?.cuh ?? '—'}</td>
                <td className="px-3 py-1.5">{p.venta?.propiedad ? `${p.venta.propiedad.manzana ?? '—'}/${p.venta.propiedad.lote ?? '—'}` : '—'}</td>
                <td className="px-3 py-1.5">{p.venta?.propiedad?.etapa?.nombre ?? '—'}</td>
                <td className="px-3 py-1.5">{p.venta?.cliente ? `${p.venta.cliente.nombres} ${p.venta.cliente.apellidos}` : '—'}</td>
                <td className="px-3 py-1.5">{p.venta?.cliente?.dni ?? '—'}</td>
                <td className="px-3 py-1.5 capitalize">{p.tipo}{p.cuota_numero ? ` #${p.cuota_numero}` : ''}</td>
                <td className="px-3 py-1.5 font-mono">{p.numero_operacion ?? '—'}</td>
                <td className="px-3 py-1.5">{p.banco ?? '—'}</td>
                <td className="px-3 py-1.5 text-right">{formatMoney(p.monto, p.moneda)}</td>
                <td className="px-3 py-1.5 capitalize">{p.estado}</td>
                <td className="px-3 py-1.5">
                  <Link href={`/v2/ventas/${p.venta_id}`} className="text-xs text-indigo-600 hover:underline">Ver venta</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}

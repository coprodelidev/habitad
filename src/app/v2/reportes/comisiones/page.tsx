'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { supabaseV2, supabasePublic } from '@/lib/v2/supabaseV2';
import { useV2User } from '@/lib/v2/useV2User';
import { isStaff, isAdmin } from '@/lib/v2/permissions';
import { Percent, Download } from 'lucide-react';

interface FilaComision {
  venta_id: string;
  promotor_id: string | null;
  promotor_nombre: string | null;
  cuh: string | null;
  estado: string;
  concepto_cliente: string | null;
  precio_acordado: number;
  valor_adicional_cv: number | null;
  comision_calculada: number;
}

export default function ReporteComisionesPage() {
  const { user, loading: loadingUser } = useV2User();
  const canStaff = isStaff(user?.roleCode);
  const esAdmin = isAdmin(user?.roleCode);
  const [filas, setFilas] = useState<FilaComision[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [filtroConcepto, setFiltroConcepto] = useState<string>('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let query: any = supabaseV2.from('vw_comisiones_promotor').select('*').limit(2000);
    if (!esAdmin) {
      // Promotor y supervisores: scoping por promotor_id propio
      query = query.eq('promotor_id', user.id);
    }
    const { data } = await query;
    setFilas((data ?? []) as FilaComision[]);
    setLoading(false);
  }, [user, esAdmin]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return filas.filter((r) => {
      if (filtroEstado && r.estado !== filtroEstado) return false;
      if (filtroConcepto && r.concepto_cliente !== filtroConcepto) return false;
      return true;
    });
  }, [filas, filtroEstado, filtroConcepto]);

  const totales = useMemo(() => {
    let comision = 0;
    let precio = 0;
    let adicional = 0;
    for (const r of filtered) {
      comision += Number(r.comision_calculada ?? 0);
      precio += Number(r.precio_acordado ?? 0);
      adicional += Number(r.valor_adicional_cv ?? 0);
    }
    return { comision, precio, adicional, ventas: filtered.length };
  }, [filtered]);

  const estados = useMemo(() => Array.from(new Set(filas.map((r) => r.estado))).sort(), [filas]);
  const conceptos = useMemo(() => Array.from(new Set(filas.map((r) => r.concepto_cliente).filter(Boolean))).sort() as string[], [filas]);

  const exportXlsx = () => {
    const rows = filtered.map((r) => ({
      CUH: r.cuh ?? '',
      Promotor: r.promotor_nombre ?? '',
      Estado: r.estado,
      Concepto: r.concepto_cliente ?? '',
      Precio: Number(r.precio_acordado ?? 0),
      Adicional_CV: Number(r.valor_adicional_cv ?? 0),
      Comision: Number(r.comision_calculada ?? 0),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Comisiones');
    XLSX.writeFile(wb, `comisiones_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (loadingUser) return <div className="p-6 text-sm text-slate-500">Cargando…</div>;
  if (!canStaff) return <div className="p-6 text-sm text-red-600">Solo personal interno.</div>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Percent className="h-5 w-5 text-indigo-600" />
          {esAdmin ? 'Comisiones por avance' : 'Mis comisiones'}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {esAdmin
            ? 'Todas las ventas con su comisión calculada según escala de hitos.'
            : 'Tus ventas con comisión calculada según el avance (separación/contrato/cancelación/beneficiario).'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Ventas" value={totales.ventas.toString()} />
        <Tile label="Precio total" value={totales.precio.toLocaleString('es-PE', { minimumFractionDigits: 2 })} />
        <Tile label="Adicional CV" value={totales.adicional.toLocaleString('es-PE', { minimumFractionDigits: 2 })} />
        <Tile label="Comisión total" value={totales.comision.toLocaleString('es-PE', { minimumFractionDigits: 2 })} tone="indigo" />
      </div>

      <div className="flex flex-wrap items-end gap-2 rounded-md border border-slate-200 bg-white p-3 text-sm">
        <div>
          <label className="mb-1 block text-xs text-slate-600">Estado</label>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="h-8 rounded border border-slate-300 px-2 text-sm">
            <option value="">Todos</option>
            {estados.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-600">Concepto</label>
          <select value={filtroConcepto} onChange={(e) => setFiltroConcepto(e.target.value)} className="h-8 rounded border border-slate-300 px-2 text-sm">
            <option value="">Todos</option>
            {conceptos.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button onClick={exportXlsx} disabled={filtered.length === 0} className="ml-auto flex h-8 items-center gap-1 rounded bg-indigo-600 px-3 text-sm text-white hover:bg-indigo-500 disabled:opacity-50">
          <Download className="h-4 w-4" /> Exportar XLSX
        </button>
      </div>

      <div className="rounded-md border border-slate-200 bg-white">
        <div className="max-h-[600px] overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-2 py-1">CUH</th>
                {esAdmin && <th className="px-2 py-1">Promotor</th>}
                <th className="px-2 py-1">Estado</th>
                <th className="px-2 py-1">Concepto</th>
                <th className="px-2 py-1 text-right">Precio</th>
                <th className="px-2 py-1 text-right">Adicional CV</th>
                <th className="px-2 py-1 text-right">Comisión</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={esAdmin ? 7 : 6} className="py-4 text-center text-slate-400">Cargando…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={esAdmin ? 7 : 6} className="py-4 text-center text-slate-400">Sin datos para los filtros aplicados.</td></tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.venta_id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-2 py-1 font-mono">{r.cuh ?? '—'}</td>
                    {esAdmin && <td className="px-2 py-1">{r.promotor_nombre ?? <span className="text-amber-600">sin asignar</span>}</td>}
                    <td className="px-2 py-1 capitalize">{r.estado}</td>
                    <td className="px-2 py-1">{r.concepto_cliente ?? '—'}</td>
                    <td className="px-2 py-1 text-right">{Number(r.precio_acordado).toLocaleString('es-PE')}</td>
                    <td className="px-2 py-1 text-right">{Number(r.valor_adicional_cv ?? 0).toLocaleString('es-PE')}</td>
                    <td className="px-2 py-1 text-right font-medium">{Number(r.comision_calculada).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: 'indigo' }) {
  const bg = tone === 'indigo' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200';
  return (
    <div className={`rounded-md p-3 ${bg}`}>
      <div className="text-xs opacity-80">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { formatDate, formatMoney } from '@/lib/v2/format';

type Reporte = 'general' | 'ventas_mes' | 'por_cliente' | 'por_promotor' | 'por_situacion';

export default function ReportesPage() {
  const [reporte, setReporte] = useState<Reporte>('general');
  const [desde, setDesde] = useState(firstOfMonth());
  const [hasta, setHasta] = useState(today());
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      if (reporte === 'general') {
        const { data, error } = await supabaseV2
          .from('pagos')
          .select('fecha_deposito, numero_operacion, monto, moneda, tipo, estado, banco, venta:ventas(id, precio_acordado, promotor_id, cliente:clientes(nombres, apellidos, dni), propiedad:propiedades(cuh))')
          .gte('fecha_deposito', desde)
          .lte('fecha_deposito', hasta)
          .order('fecha_deposito');
        if (error) throw error;
        setRows(data ?? []);
      } else if (reporte === 'ventas_mes') {
        const { data, error } = await supabaseV2
          .from('ventas')
          .select('fecha_separacion, estado, precio_acordado, moneda, propiedad:propiedades(cuh, tipo), cliente:clientes(nombres, apellidos, dni)')
          .gte('fecha_separacion', desde)
          .lte('fecha_separacion', hasta + 'T23:59:59')
          .order('fecha_separacion');
        if (error) throw error;
        setRows(data ?? []);
      } else if (reporte === 'por_cliente') {
        const { data, error } = await supabaseV2
          .from('vw_saldos_venta')
          .select('*');
        if (error) throw error;
        setRows(data ?? []);
      } else if (reporte === 'por_promotor') {
        const { data, error } = await supabaseV2
          .from('ventas')
          .select('promotor_id, estado, precio_acordado, moneda')
          .gte('fecha_separacion', desde)
          .lte('fecha_separacion', hasta + 'T23:59:59');
        if (error) throw error;
        const grouped: Record<string, { ventas: number; total: number }> = {};
        for (const v of (data ?? []) as any[]) {
          const k = v.promotor_id ?? 'sin_promotor';
          if (!grouped[k]) grouped[k] = { ventas: 0, total: 0 };
          grouped[k].ventas++;
          grouped[k].total += Number(v.precio_acordado);
        }
        setRows(Object.entries(grouped).map(([promotor_id, v]) => ({ promotor_id, ...v })));
      } else if (reporte === 'por_situacion') {
        const { data, error } = await supabaseV2
          .from('propiedades')
          .select('tipo, estado_fisico, estado_comercial, precio_lista, moneda');
        if (error) throw error;
        const grouped: Record<string, { count: number; total: number }> = {};
        for (const p of (data ?? []) as any[]) {
          const k = `${p.tipo}_${p.estado_fisico}`;
          if (!grouped[k]) grouped[k] = { count: 0, total: 0 };
          grouped[k].count++;
          grouped[k].total += Number(p.precio_lista);
        }
        setRows(Object.entries(grouped).map(([k, v]) => {
          const [tipo, estado] = k.split('_');
          return { tipo, estado, ...v };
        }));
      }
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [reporte]);

  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(rows.map((r) => flat(r)));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, reporte);
    XLSX.writeFile(wb, `reporte_${reporte}_${today()}.xlsx`);
  };

  const exportarPDF = () => {
    // Genera una ventana imprimible con la tabla actual; el usuario elige "Guardar como PDF"
    const w = window.open('', '_blank');
    if (!w) return;
    const title = `Reporte ${reporte} — ${today()}`;
    const tableHtml = document.querySelector('[data-report-table]')?.innerHTML ?? '';
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
      <style>
        body { font-family: -apple-system, sans-serif; font-size: 12px; padding: 24px; }
        h1 { font-size: 16px; margin: 0 0 12px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; }
        thead { background: #f1f5f9; }
        .meta { color: #64748b; margin-bottom: 12px; font-size: 11px; }
      </style>
    </head><body>
      <h1>${title}</h1>
      <div class="meta">${desde ? 'Desde: ' + desde : ''} ${hasta ? '· Hasta: ' + hasta : ''} · ${rows.length} filas</div>
      ${tableHtml}
      <script>window.onload=()=>{setTimeout(()=>window.print(),300)}</script>
    </body></html>`);
    w.document.close();
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Reportes</h1>
      <p className="mb-4 text-sm text-slate-500">Rango de fechas + exportación a Excel</p>

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs text-slate-600">Reporte</label>
          <select value={reporte} onChange={(e) => setReporte(e.target.value as Reporte)} className="h-9 rounded-md border border-slate-300 px-3 text-sm">
            <option value="general">General (pagos)</option>
            <option value="ventas_mes">Ventas por mes</option>
            <option value="por_cliente">Pagos por cliente (saldos)</option>
            <option value="por_promotor">Por promotor</option>
            <option value="por_situacion">Por situación y tipo</option>
          </select>
        </div>
        {['general', 'ventas_mes', 'por_promotor'].includes(reporte) && (
          <>
            <div>
              <label className="mb-1 block text-xs text-slate-600">Desde</label>
              <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-600">Hasta</label>
              <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm" />
            </div>
          </>
        )}
        <button onClick={cargar} className="h-9 rounded-md bg-indigo-600 px-4 text-sm text-white hover:bg-indigo-500">
          Consultar
        </button>
        <button onClick={exportarExcel} disabled={rows.length === 0} className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm hover:bg-slate-50 disabled:opacity-50">
          Exportar Excel
        </button>
        <button onClick={exportarPDF} disabled={rows.length === 0} className="h-9 rounded-md border border-slate-300 bg-white px-4 text-sm hover:bg-slate-50 disabled:opacity-50">
          Exportar PDF
        </button>
      </div>

      {error && <div className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white" data-report-table>
        <ReporteTable reporte={reporte} rows={rows} loading={loading} />
      </div>
    </div>
  );
}

function ReporteTable({ reporte, rows, loading }: { reporte: Reporte; rows: any[]; loading: boolean }) {
  if (loading) return <div className="p-6 text-center text-sm text-slate-500">Cargando…</div>;
  if (rows.length === 0) return <div className="p-6 text-center text-sm text-slate-500">Sin datos</div>;

  if (reporte === 'general') {
    return (
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500">
          <tr>
            <th className="px-3 py-2">Fecha</th>
            <th className="px-3 py-2">CUH</th>
            <th className="px-3 py-2">DNI</th>
            <th className="px-3 py-2">Cliente</th>
            <th className="px-3 py-2">Nº op.</th>
            <th className="px-3 py-2">Banco</th>
            <th className="px-3 py-2">Tipo</th>
            <th className="px-3 py-2 text-right">Monto</th>
            <th className="px-3 py-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-100">
              <td className="px-3 py-1.5">{formatDate(r.fecha_deposito)}</td>
              <td className="px-3 py-1.5 font-mono text-xs">{r.venta?.propiedad?.cuh}</td>
              <td className="px-3 py-1.5">{r.venta?.cliente?.dni}</td>
              <td className="px-3 py-1.5">{r.venta?.cliente ? `${r.venta.cliente.nombres} ${r.venta.cliente.apellidos}` : '—'}</td>
              <td className="px-3 py-1.5 font-mono">{r.numero_operacion ?? '—'}</td>
              <td className="px-3 py-1.5">{r.banco ?? '—'}</td>
              <td className="px-3 py-1.5 capitalize">{r.tipo}</td>
              <td className="px-3 py-1.5 text-right">{formatMoney(r.monto, r.moneda)}</td>
              <td className="px-3 py-1.5 capitalize">{r.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (reporte === 'ventas_mes') {
    return (
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500">
          <tr>
            <th className="px-3 py-2">Fecha separación</th>
            <th className="px-3 py-2">CUH</th>
            <th className="px-3 py-2">Tipo</th>
            <th className="px-3 py-2">Cliente</th>
            <th className="px-3 py-2">DNI</th>
            <th className="px-3 py-2">Estado</th>
            <th className="px-3 py-2 text-right">Precio</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-100">
              <td className="px-3 py-1.5">{formatDate(r.fecha_separacion)}</td>
              <td className="px-3 py-1.5 font-mono text-xs">{r.propiedad?.cuh}</td>
              <td className="px-3 py-1.5 capitalize">{r.propiedad?.tipo}</td>
              <td className="px-3 py-1.5">{r.cliente ? `${r.cliente.nombres} ${r.cliente.apellidos}` : '—'}</td>
              <td className="px-3 py-1.5">{r.cliente?.dni}</td>
              <td className="px-3 py-1.5 capitalize">{r.estado}</td>
              <td className="px-3 py-1.5 text-right">{formatMoney(r.precio_acordado, r.moneda)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (reporte === 'por_cliente') {
    return (
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500">
          <tr>
            <th className="px-3 py-2">Venta</th>
            <th className="px-3 py-2">Estado</th>
            <th className="px-3 py-2 text-right">Precio</th>
            <th className="px-3 py-2 text-right">Separación</th>
            <th className="px-3 py-2 text-right">Inicial</th>
            <th className="px-3 py-2 text-right">Cuotas</th>
            <th className="px-3 py-2 text-right">Total pagado</th>
            <th className="px-3 py-2 text-right">Saldo pendiente</th>
            <th className="px-3 py-2 text-right">Saldo a favor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-100">
              <td className="px-3 py-1.5 font-mono text-xs">{r.venta_id.slice(0, 8)}…</td>
              <td className="px-3 py-1.5 capitalize">{r.estado_venta}</td>
              <td className="px-3 py-1.5 text-right">{formatMoney(r.precio_acordado, r.moneda)}</td>
              <td className="px-3 py-1.5 text-right">{formatMoney(r.total_separacion, r.moneda)}</td>
              <td className="px-3 py-1.5 text-right">{formatMoney(r.total_inicial, r.moneda)}</td>
              <td className="px-3 py-1.5 text-right">{formatMoney(r.total_cuotas, r.moneda)}</td>
              <td className="px-3 py-1.5 text-right font-semibold">{formatMoney(r.total_pagado, r.moneda)}</td>
              <td className="px-3 py-1.5 text-right">{formatMoney(r.saldo_pendiente, r.moneda)}</td>
              <td className="px-3 py-1.5 text-right">{formatMoney(r.saldo_favor, r.moneda)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (reporte === 'por_promotor') {
    return (
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500">
          <tr><th className="px-3 py-2">Promotor</th><th className="px-3 py-2 text-right">Ventas</th><th className="px-3 py-2 text-right">Total</th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-100">
              <td className="px-3 py-1.5 font-mono text-xs">{r.promotor_id}</td>
              <td className="px-3 py-1.5 text-right">{r.ventas}</td>
              <td className="px-3 py-1.5 text-right">{r.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (reporte === 'por_situacion') {
    return (
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-500">
          <tr><th className="px-3 py-2">Tipo</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2 text-right">Unidades</th><th className="px-3 py-2 text-right">Valor</th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-slate-100">
              <td className="px-3 py-1.5 capitalize">{r.tipo}</td>
              <td className="px-3 py-1.5 capitalize">{r.estado}</td>
              <td className="px-3 py-1.5 text-right">{r.count}</td>
              <td className="px-3 py-1.5 text-right">{r.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return null;
}

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function flat(obj: any): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const walk = (val: any, prefix = '') => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      for (const k of Object.keys(val)) walk(val[k], prefix ? `${prefix}_${k}` : k);
    } else {
      out[prefix] = val;
    }
  };
  walk(obj);
  return out;
}

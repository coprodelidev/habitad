'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { useV2User } from '@/lib/v2/useV2User';
import { isAdmin } from '@/lib/v2/permissions';
import type { ComisionEscala } from '@/lib/v2/types';
import { Percent } from 'lucide-react';

interface VistaComision {
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

export default function ComisionesPage() {
  const { user, loading: loadingUser } = useV2User();
  const canAdmin = isAdmin(user?.roleCode);
  const [escala, setEscala] = useState<ComisionEscala[]>([]);
  const [resumen, setResumen] = useState<VistaComision[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroPromotor, setFiltroPromotor] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [e, r] = await Promise.all([
      supabaseV2.from('comision_escala').select('*').order('porcentaje'),
      supabaseV2.from('vw_comisiones_promotor').select('*').limit(500),
    ]);
    setEscala((e.data ?? []) as ComisionEscala[]);
    setResumen((r.data ?? []) as VistaComision[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updatePct = async (hito: string, pct: number) => {
    await supabaseV2.from('comision_escala').update({ porcentaje: pct }).eq('hito', hito);
    load();
  };

  const filtered = resumen.filter((r) =>
    !filtroPromotor || (r.promotor_nombre ?? '').toLowerCase().includes(filtroPromotor.toLowerCase())
  );

  const totalComision = filtered.reduce((s, r) => s + Number(r.comision_calculada ?? 0), 0);

  if (loadingUser) return <div className="p-6 text-sm text-slate-500">Cargando…</div>;
  if (!canAdmin) return <div className="p-6 text-sm text-red-600">Solo administradores.</div>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Percent className="h-5 w-5 text-indigo-600" /> Comisiones por avance
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Base de cálculo: <code>(precio + valor_adicional_cv) × 2% × % avance</code>. Los hitos derivan del estado y concepto de la venta.
        </p>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Escala</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {escala.map((e) => (
            <div key={e.hito} className="rounded border border-slate-200 p-3">
              <div className="text-xs font-mono text-slate-500">{e.hito}</div>
              <div className="text-xs text-slate-600">{e.descripcion}</div>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={e.porcentaje}
                onChange={(ev) => updatePct(e.hito, Number(ev.target.value))}
                className="mt-2 h-8 w-20 rounded border border-slate-300 px-2 text-sm"
              />
              <span className="ml-1 text-sm text-slate-500">%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Resumen por venta (primeros 500)</h2>
          <input
            type="text"
            placeholder="Filtrar promotor…"
            className="h-8 w-56 rounded border border-slate-300 px-2 text-sm"
            value={filtroPromotor}
            onChange={(e) => setFiltroPromotor(e.target.value)}
          />
        </div>
        <div className="mb-3 text-xs text-slate-600">
          Total comisión filtrada: <strong>{totalComision.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong>
        </div>
        <div className="max-h-[500px] overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-2 py-1">CUH</th>
                <th className="px-2 py-1">Promotor</th>
                <th className="px-2 py-1">Estado</th>
                <th className="px-2 py-1">Concepto</th>
                <th className="px-2 py-1 text-right">Precio</th>
                <th className="px-2 py-1 text-right">Adicional</th>
                <th className="px-2 py-1 text-right">Comisión</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-4 text-center text-slate-400">Cargando…</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.venta_id} className="border-t border-slate-100">
                  <td className="px-2 py-1 font-mono">{r.cuh ?? '—'}</td>
                  <td className="px-2 py-1">{r.promotor_nombre ?? <span className="text-amber-600">sin asignar</span>}</td>
                  <td className="px-2 py-1">{r.estado}</td>
                  <td className="px-2 py-1">{r.concepto_cliente ?? '—'}</td>
                  <td className="px-2 py-1 text-right">{Number(r.precio_acordado).toLocaleString('es-PE')}</td>
                  <td className="px-2 py-1 text-right">{Number(r.valor_adicional_cv ?? 0).toLocaleString('es-PE')}</td>
                  <td className="px-2 py-1 text-right font-medium">{Number(r.comision_calculada).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { useV2User } from '@/lib/v2/useV2User';
import { isAdmin } from '@/lib/v2/permissions';
import { formatDate } from '@/lib/v2/format';

interface TC { fecha: string; compra: number; venta: number; fuente: string; }

export default function TipoCambioPage() {
  const { user } = useV2User();
  const [rows, setRows] = useState<TC[]>([]);
  const [form, setForm] = useState({ fecha: new Date().toISOString().slice(0, 10), compra: '', venta: '' });
  const [loading, setLoading] = useState(true);
  const canAdmin = isAdmin(user?.roleCode);

  const load = async () => {
    setLoading(true);
    const { data } = await supabaseV2.from('tipo_cambio_sbs').select('*').order('fecha', { ascending: false }).limit(60);
    setRows((data ?? []) as TC[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    await supabaseV2.from('tipo_cambio_sbs').upsert({
      fecha: form.fecha,
      compra: Number(form.compra),
      venta: Number(form.venta),
      fuente: 'manual',
    }, { onConflict: 'fecha' });
    load();
  };

  if (!canAdmin) return <div className="rounded bg-yellow-50 p-4 text-sm text-yellow-800">Solo administradores.</div>;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Tipo de cambio SBS</h1>
      <p className="mb-4 text-sm text-slate-500">
        Ingreso manual por ahora. La automatización contra la SBS quedará implementada en fase 2.
      </p>

      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold">Nuevo registro</h3>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="h-9 rounded-md border border-slate-300 px-3 text-sm" />
          <input type="number" step="0.0001" placeholder="Compra" value={form.compra} onChange={(e) => setForm({ ...form, compra: e.target.value })} className="h-9 rounded-md border border-slate-300 px-3 text-sm" />
          <input type="number" step="0.0001" placeholder="Venta" value={form.venta} onChange={(e) => setForm({ ...form, venta: e.target.value })} className="h-9 rounded-md border border-slate-300 px-3 text-sm" />
          <button onClick={save} disabled={!form.compra || !form.venta} className="h-9 rounded-md bg-indigo-600 px-4 text-sm text-white disabled:opacity-50">
            Guardar
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2 text-right">Compra</th>
              <th className="px-3 py-2 text-right">Venta</th>
              <th className="px-3 py-2">Fuente</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-3 py-6 text-center">Cargando…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-500">Sin registros</td></tr>
            ) : rows.map((r) => (
              <tr key={r.fecha} className="border-t border-slate-100">
                <td className="px-3 py-1.5">{formatDate(r.fecha)}</td>
                <td className="px-3 py-1.5 text-right">{Number(r.compra).toFixed(4)}</td>
                <td className="px-3 py-1.5 text-right">{Number(r.venta).toFixed(4)}</td>
                <td className="px-3 py-1.5 text-xs text-slate-500">{r.fuente}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

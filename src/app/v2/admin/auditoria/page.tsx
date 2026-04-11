'use client';

import { useEffect, useState } from 'react';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { useV2User } from '@/lib/v2/useV2User';
import { isAdmin } from '@/lib/v2/permissions';
import { formatDateTime } from '@/lib/v2/format';

interface Audit {
  id: number;
  tabla: string;
  fila_id: string;
  operacion: 'INSERT' | 'UPDATE' | 'DELETE';
  usuario_id: string | null;
  cambios: any;
  created_at: string;
}

export default function AuditoriaPage() {
  const { user } = useV2User();
  const [rows, setRows] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabla, setTabla] = useState('');
  const [op, setOp] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const canAdmin = isAdmin(user?.roleCode);

  const load = async () => {
    setLoading(true);
    let q = supabaseV2.from('auditoria').select('*').order('created_at', { ascending: false }).limit(500);
    if (tabla) q = q.eq('tabla', tabla);
    if (op) q = q.eq('operacion', op);
    const { data } = await q;
    setRows((data ?? []) as Audit[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [tabla, op]);

  if (!canAdmin) return <div className="rounded bg-yellow-50 p-4 text-sm text-yellow-800">Solo administradores.</div>;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Auditoría</h1>
      <div className="mb-4 flex gap-2">
        <select value={tabla} onChange={(e) => setTabla(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm">
          <option value="">Todas las tablas</option>
          <option value="propiedades">propiedades</option>
          <option value="clientes">clientes</option>
          <option value="ventas">ventas</option>
          <option value="pagos">pagos</option>
          <option value="cuotas">cuotas</option>
          <option value="saldos_favor">saldos_favor</option>
          <option value="documentos">documentos</option>
        </select>
        <select value={op} onChange={(e) => setOp(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm">
          <option value="">Todas las operaciones</option>
          <option value="INSERT">INSERT</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Tabla</th>
              <th className="px-3 py-2">Operación</th>
              <th className="px-3 py-2">Fila</th>
              <th className="px-3 py-2">Usuario</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-3 py-6 text-center">Cargando…</td></tr>
            ) : rows.map((r) => (
              <>
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-3 py-1.5 text-xs">{formatDateTime(r.created_at)}</td>
                  <td className="px-3 py-1.5 font-mono text-xs">{r.tabla}</td>
                  <td className="px-3 py-1.5">{r.operacion}</td>
                  <td className="px-3 py-1.5 font-mono text-xs">{r.fila_id.slice(0, 8)}…</td>
                  <td className="px-3 py-1.5 font-mono text-xs">{r.usuario_id?.slice(0, 8) ?? '—'}</td>
                  <td className="px-3 py-1.5">
                    <button onClick={() => setExpanded(expanded === r.id ? null : r.id)} className="text-xs text-indigo-600 hover:underline">
                      {expanded === r.id ? 'Ocultar' : 'Ver'}
                    </button>
                  </td>
                </tr>
                {expanded === r.id && (
                  <tr key={`${r.id}-exp`}>
                    <td colSpan={6} className="bg-slate-50 p-3">
                      <pre className="max-h-64 overflow-auto rounded bg-white p-2 text-xs">{JSON.stringify(r.cambios, null, 2)}</pre>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

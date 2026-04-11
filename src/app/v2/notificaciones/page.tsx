'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { formatDateTime } from '@/lib/v2/format';

interface Notif {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string | null;
  venta_id: string | null;
  leida: boolean;
  created_at: string;
}

export default function NotificacionesPage() {
  const [rows, setRows] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todas' | 'no_leidas'>('no_leidas');

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabaseV2.from('notificaciones').select('*').order('created_at', { ascending: false }).limit(200);
    if (filter === 'no_leidas') q = q.eq('leida', false);
    const { data } = await q;
    setRows((data ?? []) as Notif[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const marcarLeida = async (id: string) => {
    await supabaseV2.from('notificaciones').update({ leida: true }).eq('id', id);
    load();
  };

  const marcarTodas = async () => {
    const ids = rows.filter((r) => !r.leida).map((r) => r.id);
    if (ids.length === 0) return;
    await supabaseV2.from('notificaciones').update({ leida: true }).in('id', ids);
    load();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Notificaciones</h1>
          <p className="text-sm text-slate-500">{rows.length} {filter === 'no_leidas' ? 'sin leer' : 'en total'}</p>
        </div>
        <div className="flex gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="h-9 rounded-md border border-slate-300 px-3 text-sm">
            <option value="no_leidas">Solo no leídas</option>
            <option value="todas">Todas</option>
          </select>
          <button onClick={marcarTodas} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50">
            Marcar todas como leídas
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500">Cargando…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          No hay notificaciones.
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((n) => (
            <div
              key={n.id}
              className={`rounded-lg border p-4 ${n.leida ? 'border-slate-200 bg-white' : 'border-indigo-300 bg-indigo-50'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-xs uppercase text-slate-700">{n.tipo}</span>
                    <span className="text-sm font-semibold text-slate-900">{n.titulo}</span>
                  </div>
                  {n.mensaje && <p className="mt-1 text-sm text-slate-700">{n.mensaje}</p>}
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                    <span>{formatDateTime(n.created_at)}</span>
                    {n.venta_id && (
                      <Link href={`/v2/ventas/${n.venta_id}`} className="text-indigo-600 hover:underline">
                        Abrir venta →
                      </Link>
                    )}
                  </div>
                </div>
                {!n.leida && (
                  <button
                    onClick={() => marcarLeida(n.id)}
                    className="rounded bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-500"
                  >
                    Marcar leída
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

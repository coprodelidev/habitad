'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { formatDateTime } from '@/lib/v2/format';
import { useV2User } from '@/lib/v2/useV2User';

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
  const { user } = useV2User();
  const [rows, setRows] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todas' | 'no_leidas'>('no_leidas');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    let q = supabaseV2.from('notificaciones').select('*').eq('usuario_id', user.id).order('created_at', { ascending: false }).limit(200);
    if (filter === 'no_leidas') q = q.eq('leida', false);
    try {
      const { data, error: queryError } = await q;
      if (queryError) throw queryError;
      setError(null);
      setRows((data ?? []) as Notif[]);
    } catch (err) {
      setError((err as { message?: string }).message ?? 'No se pudieron cargar las notificaciones.');
    } finally { setLoading(false); }
  }, [filter, user]);

  useEffect(() => {
    load();
    const timer = setInterval(() => load(true), 30000);
    return () => clearInterval(timer);
  }, [load]);

  const marcarLeida = async (id: string) => {
    await marcar([id]);
  };

  const marcarTodas = async () => {
    const ids = rows.filter((r) => !r.leida).map((r) => r.id);
    if (ids.length === 0) return;
    await marcar(ids);
  };

  const marcar = async (ids: string[]) => {
    if (!user || busy) return;
    setBusy(true); setError(null);
    try {
      const result = await supabaseV2.from('notificaciones').update({ leida: true }).eq('usuario_id', user.id).in('id', ids);
      if (result.error) throw result.error;
      window.dispatchEvent(new Event('v2-notificaciones-cambiadas'));
      await load();
    } catch (err) { setError((err as { message?: string }).message ?? 'No se pudo marcar la notificación.'); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Notificaciones</h1>
          <p className="text-sm text-slate-500">{rows.length} {filter === 'no_leidas' ? 'sin leer' : 'en total'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="h-9 rounded-md border border-slate-300 px-3 text-sm">
            <option value="no_leidas">Solo no leídas</option>
            <option value="todas">Todas</option>
          </select>
          <button disabled={busy} onClick={marcarTodas} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50">
            Marcar todas como leídas
          </button>
        </div>
      </div>

      {error && <p role="alert" className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
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
                      <Link href={n.tipo === 'retiro_pendiente' || n.tipo === 'retiro_observacion' ? `/v2/retirados/${n.venta_id}` : `/v2/ventas/${n.venta_id}`} className="text-indigo-600 hover:underline">
                        {n.tipo === 'retiro_pendiente' || n.tipo === 'retiro_observacion' ? 'Abrir retiro →' : 'Abrir venta →'}
                      </Link>
                    )}
                  </div>
                </div>
                {!n.leida && (
                  <button
                    onClick={() => marcarLeida(n.id)}
                    disabled={busy}
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

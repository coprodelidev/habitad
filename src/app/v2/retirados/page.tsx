'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { UserMinus, Search } from 'lucide-react';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { useV2User } from '@/lib/v2/useV2User';
import { isStaff, isAuditor } from '@/lib/v2/permissions';
import { formatDateTime, formatMoney } from '@/lib/v2/format';
import { MOTIVOS_RETIRO, motivoRetiroLabel, tareasPendientes, type Retiro, type RetiroObservacion } from '@/lib/v2/retiros';

type RetiroFila = Retiro & { observaciones: Pick<RetiroObservacion, 'id' | 'resuelta_at'>[] };
const PAGE_SIZE = 25;

export default function RetiradosPage() {
  const { user, loading: userLoading } = useV2User();
  const canRead = isStaff(user?.roleCode) || isAuditor(user?.roleCode);
  const [rows, setRows] = useState<RetiroFila[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [estado, setEstado] = useState('pendientes');
  const [motivo, setMotivo] = useState('');
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => { setQuery(search.trim()); setPage(0); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    let request = supabaseV2.from('retiros').select('*, observaciones:retiro_observaciones(id,resuelta_at)', { count: 'exact' })
      .order('fecha_retiro', { ascending: false }).order('id').range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (estado === 'pendientes') request = request.is('completado_at', null);
    if (estado === 'completados') request = request.not('completado_at', 'is', null);
    if (motivo) request = request.eq('motivo', motivo);
    if (query) {
      const value = query.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      request = request.or(['cliente_snapshot->>nombres', 'cliente_snapshot->>apellidos', 'cliente_snapshot->>dni', 'propiedad_snapshot->>cuh']
        .map((field) => `${field}.ilike."%${value}%"`).join(','));
    }
    return await request;
  }, [estado, motivo, page, query]);

  useEffect(() => {
    if (!canRead) return;
    let active = true;
    setLoading(true);
    setError(null);
    load().then((result) => {
      if (!active) return;
      if (result.error) setError(result.error.code === 'PGRST205' ? 'Retirados requiere activar sus tablas en Supabase. Falta aplicar la migración 20260918_v2_retirados.sql; después pulse Actualizar.' : result.error.message);
      else { setRows(result.data ?? []); setCount(result.count ?? 0); }
    }).catch(() => { if (active) setError('No se pudieron cargar los retiros. Intente nuevamente.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [canRead, load, refresh]);

  if (userLoading) return <p className="text-slate-500">Cargando…</p>;
  if (!canRead) return <p role="alert">No tiene acceso a Retirados.</p>;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900"><UserMinus className="h-6 w-6" /> Retirados</h1>
          <p className="mt-1 text-sm text-slate-500">Seguimiento de cartas de devolución, datos del cliente, penalidades y observaciones.</p>
        </div>
        <button onClick={() => setRefresh((n) => n + 1)} className="rounded-md border bg-white px-3 py-2 text-sm">Actualizar</button>
      </header>
      <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-950">Recuerde solicitar la carta de devolución y revisar los datos, la fecha y la penalidad de cada cliente. Abra un expediente para marcar las tareas cumplidas.</div>
      <div className="flex flex-wrap gap-3">
        <label className="relative min-w-60 flex-1"><span className="sr-only">Buscar por nombre, apellido, DNI o CUH</span><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nombre, apellido, DNI o CUH" className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm" />
        </label>
        <select aria-label="Estado del trámite" value={estado} onChange={(e) => { setEstado(e.target.value); setPage(0); }} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="pendientes">Trámites pendientes</option><option value="completados">Trámites completados</option><option value="todos">Todos los trámites</option>
        </select>
        <select aria-label="Motivo del retiro" value={motivo} onChange={(e) => { setMotivo(e.target.value); setPage(0); }} className="max-w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="">Todos los motivos</option>{MOTIVOS_RETIRO.map((m) => <option key={m.codigo} value={m.codigo}>{m.label}</option>)}
        </select>
      </div>
      {error ? <p role="alert" className="rounded-md bg-red-50 p-3 text-red-700">{error}</p> : loading ? <p className="text-slate-500">Cargando retiros…</p> : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-slate-500">No hay retiros con estos filtros. Al confirmar una liberación desde el plano, el expediente aparecerá aquí.</div>
      ) : <>
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Cliente / ubicación', 'Fecha de retiro', 'Motivo / penalidad', 'Seguimiento', ''].map((label, i) => <th key={i} scope="col" className="px-4 py-3">{label || <span className="sr-only">Acciones</span>}</th>)}</tr></thead>
            <tbody className="divide-y">{rows.map((r) => {
              const pendientes = tareasPendientes(r).length;
              const observaciones = r.observaciones.filter((o) => !o.resuelta_at).length;
              return <tr key={r.id} className="align-top">
                <td className="px-4 py-3"><p className="font-medium text-slate-900">{r.cliente_snapshot.nombres} {r.cliente_snapshot.apellidos}</p><p className="text-xs text-slate-500">DNI {r.cliente_snapshot.dni}</p><p className="mt-1 text-xs">Mz {r.propiedad_snapshot.manzana ?? '—'} - Lt {r.propiedad_snapshot.lote ?? '—'} · {r.propiedad_snapshot.cuh}</p></td>
                <td className="whitespace-nowrap px-4 py-3 text-xs">{formatDateTime(r.fecha_retiro)}</td>
                <td className="px-4 py-3"><p>{motivoRetiroLabel(r.motivo)}</p><p className={`mt-1 text-xs font-semibold ${r.aplica_penalidad ? 'text-amber-700' : 'text-emerald-700'}`}>{r.aplica_penalidad ? formatMoney(r.penalidad_monto, r.penalidad_moneda) : 'Sin penalidad'}</p></td>
                <td className="px-4 py-3"><span className={`whitespace-nowrap rounded-full px-2 py-1 text-xs ${r.completado_at ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{r.completado_at ? 'Completado' : `${6 - pendientes}/6 tareas`}</span>{observaciones > 0 && <p className="mt-2 text-xs text-red-700">{observaciones} observación(es) pendiente(s)</p>}</td>
                <td className="px-4 py-3"><Link href={`/v2/retirados/${r.venta_id}`} className="whitespace-nowrap font-medium text-indigo-600 hover:underline">Abrir expediente →</Link></td>
              </tr>;
            })}</tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-2 text-sm text-slate-500"><span>{count} retiro(s) · Página {page + 1} de {Math.max(1, Math.ceil(count / PAGE_SIZE))}</span><div className="flex gap-2"><button disabled={page === 0} onClick={() => setPage((n) => n - 1)} className="rounded border px-3 py-1 disabled:opacity-40">Anterior</button><button disabled={(page + 1) * PAGE_SIZE >= count} onClick={() => setPage((n) => n + 1)} className="rounded border px-3 py-1 disabled:opacity-40">Siguiente</button></div></div>
      </>}
    </div>
  );
}

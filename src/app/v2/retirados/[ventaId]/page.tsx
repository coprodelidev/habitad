'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { useV2User } from '@/lib/v2/useV2User';
import { isStaff, isAuditor } from '@/lib/v2/permissions';
import { formatDateTime, formatMoney } from '@/lib/v2/format';
import { TAREAS_RETIRO, motivoRetiroLabel, tareasPendientes, type Retiro, type RetiroObservacion, type TareaRetiro } from '@/lib/v2/retiros';

type Expediente = Retiro & { observaciones: RetiroObservacion[] };

export default function RetiroDetailPage() {
  const { ventaId } = useParams<{ ventaId: string }>();
  const { user, loading: userLoading } = useV2User();
  const canWrite = isStaff(user?.roleCode);
  const canRead = canWrite || isAuditor(user?.roleCode);
  const [retiro, setRetiro] = useState<Expediente | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [texto, setTexto] = useState('');

  const load = useCallback(async () => {
    const result = await supabaseV2.from('retiros').select('*, observaciones:retiro_observaciones(*)').eq('venta_id', ventaId).maybeSingle();
    if (result.error) throw result.error;
    return result.data as Expediente | null;
  }, [ventaId]);

  useEffect(() => {
    if (!canRead) return;
    let active = true;
    setLoading(true);
    setError(null);
    load().then((data) => { if (active) setRetiro(data); })
      .catch((err) => { if (active) setError(err.message ?? 'No se pudo cargar el expediente.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [canRead, load]);

  const mutate = async (fn: string, args: Record<string, unknown>, success: string): Promise<boolean> => {
    if (submitting.current) return false;
    submitting.current = true;
    setBusy(true);
    setError(null);
    setNotice(null);
    let saved = false;
    try {
      const result = await supabaseV2.rpc(fn, args);
      if (result.error) throw result.error;
      saved = true;
      setRetiro(await load());
      setNotice(success);
    } catch (err) {
      setError(saved ? 'El cambio se guardó, pero no se pudo actualizar la vista. Pulse Actualizar.' : ((err as { message?: string }).message ?? 'No se pudo guardar el cambio.'));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
    return saved;
  };

  const toggle = (campo: TareaRetiro, completado: boolean) => {
    if (retiro) void mutate('actualizar_tarea_retiro', { p_id: retiro.id, p_campo: campo, p_completado: completado, p_version: retiro.version }, 'Seguimiento guardado.');
  };

  const refresh = async () => {
    setBusy(true); setError(null);
    try { setRetiro(await load()); } catch { setError('No se pudo actualizar el expediente.'); } finally { setBusy(false); }
  };

  if (userLoading || (canRead && loading)) return <p className="text-slate-500">Cargando expediente…</p>;
  if (!canRead) return <p role="alert">No tiene acceso a Retirados.</p>;
  if (!retiro) return <div className="space-y-3"><Link href="/v2/retirados" className="text-indigo-600">← Retirados</Link><p role="alert">{error ?? 'No se encontró este retiro o no tiene acceso.'}</p><button onClick={refresh} disabled={busy} className="rounded border px-3 py-2">Reintentar</button></div>;
  const pendientes = tareasPendientes(retiro);
  const observaciones = [...retiro.observaciones].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const abiertas = observaciones.filter((o) => !o.resuelta_at).length;

  return (
    <div className="space-y-5">
      <Link href="/v2/retirados" className="text-sm text-slate-500 hover:text-slate-800">← Retirados</Link>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-semibold text-slate-900">{retiro.cliente_snapshot.nombres} {retiro.cliente_snapshot.apellidos}</h1><p className="mt-1 text-sm text-slate-500">Expediente de retiro · Mz {retiro.propiedad_snapshot.manzana ?? '—'}/Lt {retiro.propiedad_snapshot.lote ?? '—'} · {retiro.propiedad_snapshot.cuh}</p></div>
        <div className="flex flex-wrap items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-medium ${retiro.completado_at ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{retiro.completado_at ? 'Trámite completado' : 'Trámite pendiente'}</span><button disabled={busy} onClick={refresh} className="rounded-md border bg-white px-3 py-2 text-sm disabled:opacity-50">Actualizar</button></div>
      </header>
      {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      {!canWrite && <p className="text-sm text-slate-500">Vista de solo lectura.</p>}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-lg border bg-white p-5">
          <h2 className="mb-4 font-semibold">Datos del retiro</h2>
          <dl className="space-y-3 text-sm">
            <Info label="DNI" value={retiro.cliente_snapshot.dni} />
            <Info label="Teléfono" value={retiro.cliente_snapshot.telefono ?? 'Sin registrar'} />
            <Info label="Correo" value={retiro.cliente_snapshot.email ?? 'Sin registrar'} />
            <Info label="Dirección" value={retiro.cliente_snapshot.direccion ?? 'Sin registrar'} />
            <Info label="Fecha del retiro" value={formatDateTime(retiro.fecha_retiro)} />
            <Info label="Motivo" value={motivoRetiroLabel(retiro.motivo)} />
            <Info label="Penalidad" value={retiro.aplica_penalidad ? formatMoney(retiro.penalidad_monto, retiro.penalidad_moneda) : 'Sin penalidad · S/ 0.00'} />
            {retiro.completado_at && <Info label="Gestión completada" value={formatDateTime(retiro.completado_at)} />}
          </dl>
          <p className="mt-4 text-xs text-slate-500">Datos conservados al momento del retiro. La fecha corresponde a la liberación confirmada.</p>
          <Link href={`/v2/ventas/${retiro.venta_id}`} className="mt-4 inline-block text-sm text-indigo-600 hover:underline">Consultar venta y pagos →</Link>
        </section>
        <section className="rounded-lg border bg-white p-5">
          <h2 className="font-semibold">Seguimiento de devolución</h2>
          <p className="mt-1 text-sm text-slate-500">{6 - pendientes.length} de 6 tareas cumplidas</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Tareas cumplidas" aria-valuemin={0} aria-valuemax={6} aria-valuenow={6 - pendientes.length}><div className="h-full bg-indigo-600 transition-all" style={{ width: `${(6 - pendientes.length) / 6 * 100}%` }} /></div>
          <div className="mt-4 space-y-3">{TAREAS_RETIRO.map((t) => <label key={t.campo} className="flex items-start gap-3 text-sm"><input type="checkbox" checked={retiro[t.campo]} disabled={!canWrite || busy} onChange={(e) => toggle(t.campo, e.target.checked)} className="mt-0.5 h-4 w-4 accent-indigo-600" /><span className={retiro[t.campo] ? 'text-slate-500' : 'text-slate-900'}>{t.campo === 'penalidad_revisada' && !retiro.aplica_penalidad ? 'Confirmar que no corresponde penalidad' : t.label}</span></label>)}</div>
          {!retiro.completado_at && <p className="mt-4 rounded bg-amber-50 p-3 text-xs text-amber-900">Para completar la gestión, marque las primeras cinco tareas y resuelva las observaciones pendientes. Marcar un check registra el seguimiento; no ejecuta pagos ni devoluciones.</p>}
        </section>
      </div>
      <section className="rounded-lg border bg-white p-5">
        <h2 className="font-semibold">Observaciones del cliente <span className="ml-2 text-sm font-normal text-slate-500">{abiertas} pendiente(s)</span></h2>
        {canWrite && <form className="mt-3 space-y-2" onSubmit={async (e) => {
          e.preventDefault();
          if (!texto.trim()) return;
          if (await mutate('agregar_observacion_retiro', { p_id: retiro.id, p_texto: texto.trim() }, 'Observación registrada y notificación enviada al equipo.')) setTexto('');
        }}>
          <label htmlFor="observacion" className="text-sm text-slate-600">Nueva observación</label>
          <textarea id="observacion" value={texto} onChange={(e) => setTexto(e.target.value)} disabled={busy} maxLength={2000} required rows={3} placeholder="Documentos faltantes, datos por corregir u otros pendientes del cliente…" className="block w-full rounded-md border border-slate-300 p-3 text-sm" />
          <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">Se notificará al equipo y al promotor asignado. Una nueva observación reabre un trámite completado.</p><button disabled={busy || !texto.trim()} className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50">Registrar observación</button></div>
        </form>}
        <div className="mt-5 space-y-3">{observaciones.length === 0 ? <p className="text-sm text-slate-500">No hay observaciones registradas.</p> : observaciones.map((o) => <article key={o.id} className={`rounded-md border p-3 ${o.resuelta_at ? 'border-slate-200 bg-slate-50' : 'border-amber-200 bg-amber-50'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-slate-500">{o.autor_nombre} · {formatDateTime(o.created_at)}</p><span className="text-xs font-medium">{o.resuelta_at ? `Resuelta · ${formatDateTime(o.resuelta_at)}` : 'Pendiente'}</span></div>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-800">{o.texto}</p>
          {!o.resuelta_at && canWrite && <button disabled={busy} onClick={() => void mutate('resolver_observacion_retiro', { p_id: o.id }, 'Observación marcada como resuelta.')} className="mt-3 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs disabled:opacity-50">Marcar como resuelta</button>}
        </article>)}</div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="flex flex-wrap justify-between gap-x-4 gap-y-1"><dt className="text-slate-500">{label}</dt><dd className="break-words font-medium text-slate-900">{value}</dd></div>;
}

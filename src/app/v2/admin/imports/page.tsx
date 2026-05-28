'use client';

import { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { supabasePublic, supabaseV2 } from '@/lib/v2/supabaseV2';
import { useV2User } from '@/lib/v2/useV2User';
import { isAdmin } from '@/lib/v2/permissions';
import {
  COLUMN_MAP,
  HEADER_ROW_INDEX,
  DATA_FIRST_ROW,
  rowToStaging,
} from '@/lib/v2/cuhCsvMapping';
import { Upload, Database, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Progress {
  phase: 'idle' | 'parsing' | 'uploading' | 'promoting' | 'done' | 'error';
  message: string;
  uploaded: number;
  total: number;
  result?: {
    total_filas: number;
    propiedades_creadas: number;
    clientes_creados: number;
    ventas_creadas: number;
    warnings: number;
    errores: number;
  };
  error?: string;
}

interface BatchStats {
  total: number;
  pending: number;
  promoted: number;
  warning: number;
  error: number;
}

const CHUNK = 500;

function newBatchId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

async function getToken(): Promise<string | null> {
  const { data } = await (supabasePublic.auth as any).getSession();
  return data.session?.access_token ?? null;
}

export default function ImportsPage() {
  const { user, loading: loadingUser } = useV2User();
  const canAdmin = isAdmin(user?.roleCode);
  const [progress, setProgress] = useState<Progress>({ phase: 'idle', message: '', uploaded: 0, total: 0 });
  const [batchId, setBatchId] = useState<string | null>(null);
  const [stats, setStats] = useState<BatchStats | null>(null);
  const [errorSample, setErrorSample] = useState<Array<{ row_num: number; cuh: string | null; error: string }>>([]);

  const refreshStats = useCallback(async (batch: string) => {
    const { data } = await supabaseV2
      .from('import_cuh_staging')
      .select('status')
      .eq('import_batch_id', batch);
    if (!data) return;
    const s: BatchStats = { total: data.length, pending: 0, promoted: 0, warning: 0, error: 0 };
    for (const r of data as any[]) {
      const k = r.status as keyof BatchStats;
      if (k in s && k !== 'total') (s as any)[k]++;
    }
    setStats(s);

    const { data: errs } = await supabaseV2
      .from('import_cuh_staging')
      .select('row_num, cuh, error')
      .eq('import_batch_id', batch)
      .eq('status', 'error')
      .limit(20);
    setErrorSample((errs as any) ?? []);
  }, []);

  const handleFile = useCallback(async (file: File) => {
    if (!canAdmin) return;
    setProgress({ phase: 'parsing', message: `Leyendo "${file.name}"…`, uploaded: 0, total: 0 });
    setStats(null);
    setErrorSample([]);

    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    if (!wb.Sheets['unificado']) {
      setProgress({ phase: 'error', message: '', uploaded: 0, total: 0, error: 'No se encontró hoja "unificado"' });
      return;
    }
    const sheet = wb.Sheets['unificado'];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null, blankrows: false });

    const headers = rows[HEADER_ROW_INDEX] as unknown[];
    const expectedCuh = String(headers?.[3] ?? '').toUpperCase();
    if (expectedCuh !== 'CUH') {
      setProgress({
        phase: 'error', message: '', uploaded: 0, total: 0,
        error: `Header inesperado en col 3 fila ${HEADER_ROW_INDEX + 1}: "${expectedCuh}" (esperaba "CUH")`,
      });
      return;
    }

    const dataRows = rows.slice(DATA_FIRST_ROW);
    const mapped = dataRows
      .map((r, i) => ({ idx: DATA_FIRST_ROW + i + 1, row: r }))
      .filter(({ row }) => row && row.some((c) => c !== null && c !== undefined && String(c).trim() !== ''))
      .map(({ idx, row }) => rowToStaging(row, idx));

    const batch = newBatchId();
    setBatchId(batch);
    setProgress({ phase: 'uploading', message: 'Subiendo a staging…', uploaded: 0, total: mapped.length });

    const token = await getToken();
    if (!token) {
      setProgress({ phase: 'error', message: '', uploaded: 0, total: 0, error: 'sesión no encontrada' });
      return;
    }

    let uploaded = 0;
    for (let i = 0; i < mapped.length; i += CHUNK) {
      const chunk = mapped.slice(i, i + CHUNK);
      const res = await fetch('/api/v2/imports/cuh-xlsx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ batch_id: batch, rows: chunk }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setProgress({ phase: 'error', message: '', uploaded, total: mapped.length, error: body.error ?? `HTTP ${res.status}` });
        return;
      }
      uploaded += chunk.length;
      setProgress({ phase: 'uploading', message: `Subiendo… ${uploaded}/${mapped.length}`, uploaded, total: mapped.length });
    }

    setProgress({ phase: 'idle', message: `Subidas ${uploaded} filas. Lista para promover.`, uploaded, total: mapped.length });
    await refreshStats(batch);
  }, [canAdmin, refreshStats]);

  const handlePromote = useCallback(async () => {
    if (!batchId) return;
    const token = await getToken();
    if (!token) return;
    setProgress((p) => ({ ...p, phase: 'promoting', message: 'Promoviendo a propiedades / clientes / ventas…' }));
    const res = await fetch('/api/v2/imports/promote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ batch_id: batchId }),
    });
    const body = await res.json();
    if (!res.ok) {
      setProgress((p) => ({ ...p, phase: 'error', error: body.error ?? `HTTP ${res.status}` }));
      return;
    }
    setProgress((p) => ({ ...p, phase: 'done', message: 'Promote completo', result: body.result }));
    await refreshStats(batchId);
  }, [batchId, refreshStats]);

  if (loadingUser) return <div className="p-6 text-sm text-slate-500">Cargando…</div>;
  if (!canAdmin) return <div className="p-6 text-sm text-red-600">Solo administradores pueden importar.</div>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Importar CUH operativo</h1>
        <p className="mt-1 text-sm text-slate-600">
          Subí el XLSX maestro (hoja <code>unificado</code>) — el browser parsea las {COLUMN_MAP.length}+ columnas y las sube en chunks de {CHUNK}.
          Luego promové el batch para insertar etapas, propiedades, clientes y ventas en v2.
        </p>
      </div>

      <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <Upload className="mx-auto h-10 w-10 text-slate-400" />
        <label className="mt-2 inline-block cursor-pointer rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
          Seleccionar XLSX
          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            disabled={progress.phase === 'parsing' || progress.phase === 'uploading' || progress.phase === 'promoting'}
          />
        </label>
        <p className="mt-2 text-xs text-slate-500">Hoja esperada: <code>unificado</code>. Headers en fila 5 (índice 4).</p>
      </div>

      {progress.phase !== 'idle' || progress.message ? (
        <div className={`rounded-md border p-4 text-sm ${progress.phase === 'error' ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center gap-2">
            {progress.phase === 'error' ? <AlertCircle className="h-4 w-4 text-red-600" /> :
             progress.phase === 'done' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> :
             <Database className="h-4 w-4 text-slate-600" />}
            <span className="font-medium">{progress.phase}</span>
          </div>
          <p className="mt-1 text-slate-700">{progress.error ?? progress.message}</p>
          {progress.total > 0 && progress.phase === 'uploading' && (
            <div className="mt-2 h-2 w-full overflow-hidden rounded bg-slate-100">
              <div className="h-full bg-indigo-500" style={{ width: `${(progress.uploaded / progress.total) * 100}%` }} />
            </div>
          )}
        </div>
      ) : null}

      {batchId && stats && (
        <div className="rounded-md border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Batch</div>
              <code className="text-xs">{batchId}</code>
            </div>
            <button
              onClick={handlePromote}
              disabled={progress.phase === 'promoting' || stats.pending === 0}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50"
            >
              {progress.phase === 'promoting' ? 'Promoviendo…' : `Promover ${stats.pending} pendientes`}
            </button>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-3 text-center text-xs">
            <Stat label="Total" value={stats.total} />
            <Stat label="Pending" value={stats.pending} tone="amber" />
            <Stat label="Promoted" value={stats.promoted} tone="green" />
            <Stat label="Warning" value={stats.warning} tone="amber" />
            <Stat label="Error" value={stats.error} tone="red" />
          </div>
        </div>
      )}

      {progress.result && (
        <div className="rounded-md border border-green-300 bg-green-50 p-4 text-sm">
          <div className="font-medium text-green-900">Resultado del promote</div>
          <ul className="mt-1 grid grid-cols-2 gap-x-6 gap-y-1 text-green-800">
            <li>Filas procesadas: <strong>{progress.result.total_filas}</strong></li>
            <li>Propiedades creadas: <strong>{progress.result.propiedades_creadas}</strong></li>
            <li>Clientes creados: <strong>{progress.result.clientes_creados}</strong></li>
            <li>Ventas creadas: <strong>{progress.result.ventas_creadas}</strong></li>
            <li>Warnings: <strong>{progress.result.warnings}</strong></li>
            <li>Errores: <strong>{progress.result.errores}</strong></li>
          </ul>
        </div>
      )}

      {errorSample.length > 0 && (
        <div className="rounded-md border border-red-200 bg-white p-4">
          <div className="text-sm font-medium text-red-700">Muestra de errores (máx 20)</div>
          <table className="mt-2 w-full text-xs">
            <thead className="text-left text-slate-500">
              <tr><th className="py-1">Fila</th><th className="py-1">CUH</th><th className="py-1">Error</th></tr>
            </thead>
            <tbody>
              {errorSample.map((e, i) => (
                <tr key={i} className="border-t border-slate-100"><td className="py-1">{e.row_num}</td><td className="py-1">{e.cuh ?? '—'}</td><td className="py-1 text-red-600">{e.error}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'amber' | 'green' | 'red' }) {
  const colors = tone === 'amber' ? 'bg-amber-50 text-amber-800' :
                 tone === 'green' ? 'bg-green-50 text-green-800' :
                 tone === 'red' ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-800';
  return (
    <div className={`rounded-md px-3 py-2 ${colors}`}>
      <div className="text-base font-semibold">{value}</div>
      <div className="opacity-70">{label}</div>
    </div>
  );
}

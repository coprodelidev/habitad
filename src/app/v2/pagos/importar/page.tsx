'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabaseV2, supabasePublic } from '@/lib/v2/supabaseV2';
import { useV2User } from '@/lib/v2/useV2User';
import { isAdmin } from '@/lib/v2/permissions';
import { formatDate, formatMoney } from '@/lib/v2/format';

// NOTA — Matching pendiente
// El algoritmo de matching (nº operación ↔ pago esperado) se definirá cuando
// el cliente entregue un archivo real del banco. Por ahora: preview + upload.

interface Fila {
  fecha?: string;
  monto?: number;
  moneda?: 'PEN' | 'USD';
  glosa?: string;
  numero_operacion?: string;
  raw: Record<string, unknown>;
}

export default function ImportarReporteBancarioPage() {
  const { user } = useV2User();
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Fila[]>([]);
  const [saving, setSaving] = useState(false);
  const [reporteId, setReporteId] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});

  const canImport = isAdmin(user?.roleCode);
  if (!canImport) {
    return <div className="rounded bg-yellow-50 p-4 text-sm text-yellow-800">Solo administradores pueden importar reportes bancarios.</div>;
  }

  const handleFile = async (f: File) => {
    setFile(f);
    const isExcel = /\.(xlsx|xls|csv)$/i.test(f.name);
    if (isExcel) {
      const data = new Uint8Array(await f.arrayBuffer());
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<any>(sheet, { defval: null });
      setRows(json.map((r) => ({
        fecha: r.fecha ?? r.Fecha ?? r.FECHA,
        monto: Number(r.monto ?? r.Monto ?? r.MONTO ?? r.importe ?? 0) || undefined,
        moneda: (r.moneda ?? r.Moneda ?? 'USD').toString().toUpperCase() === 'PEN' ? 'PEN' : 'USD',
        glosa: r.glosa ?? r.Glosa ?? r.descripcion ?? r.Descripcion ?? '',
        numero_operacion: r.operacion ?? r.Operacion ?? r.numero_operacion ?? r['N° Operación'] ?? r.nro_operacion ?? undefined,
        raw: r,
      })));
    } else {
      // PDF no parseable en cliente de momento — lo subimos igual y se registra
      setRows([]);
    }
  };

  const procesar = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const path = `${Date.now()}_${file.name}`;
      const up = await supabasePublic.storage.from('v2-reportes-banco').upload(path, file, { upsert: false });
      if (up.error || !up.data) throw up.error ?? new Error('Upload failed');

      const { data: userRes } = await supabasePublic.auth.getUser();
      const format = file.name.toLowerCase().endsWith('.csv') ? 'csv'
        : file.name.toLowerCase().endsWith('.pdf') ? 'pdf'
        : 'excel';

      const ins = await supabaseV2.from('reportes_bancarios').insert({
        nombre_archivo: file.name,
        url: up.data.path,
        formato: format,
        total_filas: rows.length,
        matcheadas: 0,
        pendientes: rows.length,
        subido_por: userRes.user?.id ?? null,
      }).select('id').single();
      if (ins.error) throw ins.error;
      setReporteId(ins.data!.id);

      if (rows.length > 0) {
        const filasInsert = rows.map((r) => ({
          reporte_id: ins.data!.id,
          fila_original: r.raw,
          fecha: r.fecha ?? null,
          monto: r.monto ?? null,
          moneda: r.moneda ?? null,
          glosa: r.glosa ?? null,
          numero_operacion: r.numero_operacion ?? null,
          estado: 'pendiente',
        }));
        await supabaseV2.from('reporte_bancario_filas').insert(filasInsert);

        // Intento de matching simple por nº de operación
        const opList = rows.map((r) => r.numero_operacion).filter(Boolean) as string[];
        if (opList.length > 0) {
          const pagos = await supabaseV2.from('pagos').select('id, numero_operacion').in('numero_operacion', opList);
          const map: Record<string, string> = {};
          for (const p of (pagos.data ?? []) as { id: string; numero_operacion: string }[]) {
            map[p.numero_operacion] = p.id;
          }
          setMatches(map);
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const matchedCount = Object.keys(matches).length;

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Importar reporte bancario</h1>
      <p className="mb-4 text-sm text-slate-500">
        Excel, CSV o PDF. El matching automático pago ↔ cliente se basará en el nº de operación; los
        detalles finales se cerrarán cuando tengamos un archivo real del banco.
      </p>

      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
        <input
          type="file"
          accept=".xlsx,.xls,.csv,.pdf"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="block w-full text-sm"
        />
        {file && (
          <div className="mt-3 text-sm text-slate-600">
            <strong>{file.name}</strong> · {(file.size / 1024).toFixed(1)} KB · {rows.length} filas parseadas
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <div className="mb-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Nº op.</th>
                <th className="px-3 py-2">Monto</th>
                <th className="px-3 py-2">Glosa</th>
                <th className="px-3 py-2">Match</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 100).map((r, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-3 py-1">{r.fecha ? formatDate(r.fecha) : '—'}</td>
                  <td className="px-3 py-1 font-mono">{r.numero_operacion ?? '—'}</td>
                  <td className="px-3 py-1">{r.monto ? formatMoney(r.monto, r.moneda ?? 'USD') : '—'}</td>
                  <td className="px-3 py-1 text-slate-600">{r.glosa}</td>
                  <td className="px-3 py-1">
                    {r.numero_operacion && matches[r.numero_operacion]
                      ? <span className="text-green-700">✓ pago encontrado</span>
                      : <span className="text-slate-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 100 && <div className="px-3 py-2 text-xs text-slate-500">… y {rows.length - 100} más</div>}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={procesar}
          disabled={!file || saving}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving ? 'Subiendo…' : 'Subir y procesar'}
        </button>
        {reporteId && (
          <span className="text-sm text-green-700">
            ✓ Reporte registrado ({matchedCount} coincidencias por Nº operación)
          </span>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { upsertCuh } from './cuhServices';

type CuhRow = {
  etapa: number;
  codigo_cuh: string;
  modelo: string;
  precio_cuh: number;
  partida: string;
  manzana: number;
  lote: number;
  ubicacion?: string | null;
  area_lote?: number | null;
  precio_promotor?: number | null;
};

type PreviewRow = CuhRow & { _row?: number; _errors?: string[] };

const REQUIRED: (keyof CuhRow)[] = ['etapa', 'codigo_cuh', 'modelo', 'precio_cuh', 'partida', 'manzana', 'lote'];
const WANTED = [...REQUIRED, 'ubicacion', 'area_lote', 'precio_promotor'] as (keyof CuhRow)[];

// ========================= utils =========================

function norm(s: any): string {
  if (s == null) return '';
  let t = String(s)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\w\s.\-]/g, ' ')
    .toLowerCase()
    .trim();
  t = t.replace(/^\d+\s+/, '');
  t = t.replace(/\s+/g, ' ');
  return t;
}

function buildHeaderMap(headerRow: any[]): Record<number, keyof CuhRow> {
  const map: Record<number, keyof CuhRow> = {};
  headerRow.forEach((h, i) => {
    const n = norm(h);
    if (!n || n === 'cf' || n.includes('no tocar')) return;
    if (n.includes('etapa')) map[i] = 'etapa';
    else if ((n.includes('codigo') && n.includes('cuh')) || n === 'cuh' || n === 'codigo cuh' || n === 'codigo')
      map[i] = 'codigo_cuh';
    else if (n.includes('modelo') || n === 'model o' || n === 'model' || n === 'modelo')
      map[i] = 'modelo';
    else if ((n.includes('precio') && n.includes('cuh')) || n === 'precio cuh' || n === 'precio')
      map[i] = 'precio_cuh';
    else if (n === 'partida' || n.includes('partida'))
      map[i] = 'partida';
    else if (n === 'mz' || n.includes('manzana'))
      map[i] = 'manzana';
    else if ((n === 'lt') || (n.includes('lote') && !n.includes('area')))
      map[i] = 'lote';
    else if (n.includes('esq') || n.includes('parq') || n.includes('ubicacion') || n.includes('esquina'))
      map[i] = 'ubicacion';
    else if ((n.includes('area') && n.includes('lote')) || n === 'area lote' || n === 'area')
      map[i] = 'area_lote';
    else if (n.includes('precio') && n.includes('promotor'))
      map[i] = 'precio_promotor';
  });
  return map;
}

function isJunkRow(cells: any[]): boolean {
  const tokens = cells.map(norm).filter(Boolean);
  if (!tokens.length) return true;
  const allCF = tokens.every(t => t === 'cf');
  const anyNoTocar = tokens.some(t => t.includes('no tocar'));
  const looksIdOnly = tokens.length === 1 && /^\d+$/.test(tokens[0]);
  return allCF || anyNoTocar || looksIdOnly;
}

function findHeaderIndex(matrix: any[][]): { idx: number; map: Record<number, keyof CuhRow> } | null {
  for (let i = 0; i < matrix.length; i++) {
    const row = matrix[i];
    if (!row || isJunkRow(row)) continue;
    const map = buildHeaderMap(row);
    const found = Object.values(map);
    const ok = found.includes('codigo_cuh') && found.includes('precio_cuh') && found.length >= 4;
    if (ok) return { idx: i, map };
  }
  return null;
}

function parseMoney(v: any): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  let s = String(v).trim().replace(/[^\d,.\-]/g, '');
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  let dec = '.';
  if (lastComma > -1 && lastDot > -1) dec = lastComma > lastDot ? ',' : '.';
  else if (lastComma > -1) dec = ',';
  if (dec === ',') {
    s = s.replace(/\./g, '').replace(',', '.');
  } else {
    s = s.replace(/,/g, '');
  }
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function parseIntish(v: any): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? Math.trunc(v) : null;
  const s = String(v).replace(/[^\d\-]/g, '');
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function isValidRow(r: PreviewRow): boolean {
  return REQUIRED.every((k) => {
    const v = r[k];
    if (typeof v === 'number') return Number.isFinite(v);
    return !!v;
  });
}

function safeText(v: any): string {
  if (v == null) return '';
  const s = String(v).trim();
  if (!s || s.toLowerCase() === 'cf' || s.toLowerCase().includes('no tocar')) return '';
  return s;
}

// ========================= componente =========================

export default function CUHImport() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [badRows, setBadRows] = useState<PreviewRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const hasData = rows.length > 0 || badRows.length > 0;

  async function handleFile(file: File) {
    setMessage(null);
    setRows([]);
    setBadRows([]);
    setFileName(file.name);

    if (file.name.startsWith('~$')) {
      setMessage({ text: 'Archivo temporal de Excel detectado. Cierra Excel y sube el archivo original.', type: 'error' });
      return;
    }

    const ext = file.name.toLowerCase().split('.').pop();
    let matrix: any[][] = [];

    try {
      if (ext === 'csv') {
        const text = await file.text();
        const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
        if (parsed.errors.length) throw new Error(parsed.errors[0].message);
        matrix = parsed.data as any[][];
      } else {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        matrix = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' }) as any[][];
      }
    } catch (e: any) {
      setMessage({ text: `No pude leer el archivo: ${e?.message || e}`, type: 'error' });
      return;
    }

    const found = findHeaderIndex(matrix);
    if (!found) {
      setMessage({ text: 'No se encontró una fila de encabezados reconocible.', type: 'error' });
      return;
    }

    const { idx: headerIdx, map: headerMap } = found;
    const good: PreviewRow[] = [];
    const bad: PreviewRow[] = [];

    for (let r = headerIdx + 1; r < matrix.length; r++) {
      const row = matrix[r];
      if (!row || isJunkRow(row) || row.every((c: any) => String(c || '').trim() === '')) continue;

      const obj: PreviewRow = {
        etapa: parseIntish(row[getKey(headerMap, 'etapa')]) ?? NaN,
        codigo_cuh: safeText(row[getKey(headerMap, 'codigo_cuh')]),
        modelo: safeText(row[getKey(headerMap, 'modelo')]),
        precio_cuh: parseMoney(row[getKey(headerMap, 'precio_cuh')]) ?? NaN,
        partida: safeText(row[getKey(headerMap, 'partida')]),
        manzana: parseIntish(row[getKey(headerMap, 'manzana')]) ?? NaN,
        lote: parseIntish(row[getKey(headerMap, 'lote')]) ?? NaN,
        ubicacion: safeText(row[getKey(headerMap, 'ubicacion')])?.toUpperCase() || null,
        area_lote: parseMoney(row[getKey(headerMap, 'area_lote')]),
        precio_promotor: parseMoney(row[getKey(headerMap, 'precio_promotor')]),
        _row: r + 1,
        _errors: [],
      };

      if (!isValidRow(obj)) {
        const errs: string[] = [];
        REQUIRED.forEach((k) => {
          const v = obj[k];
          if (typeof v === 'number' && !Number.isFinite(v)) errs.push(k);
          else if (!v) errs.push(k);
        });
        obj._errors = errs;
        bad.push(obj);
      } else {
        good.push(obj);
      }
    }

    setRows(good);
    setBadRows(bad);
    setMessage({ text: `Detectados ${good.length} filas válidas y ${bad.length} con errores.`, type: 'info' });
  }

  function getKey(map: Record<number, keyof CuhRow>, key: keyof CuhRow): number {
    const idx = Object.entries(map).find(([, v]) => v === key)?.[0];
    return idx ? Number(idx) : -1;
  }

  async function saveAll() {
    setSaving(true);
    setMessage(null);
    try {
      const payload = rows.map<CuhRow>(r => ({
        etapa: r.etapa,
        codigo_cuh: r.codigo_cuh,
        modelo: r.modelo,
        precio_cuh: Number(r.precio_cuh),
        partida: r.partida,
        manzana: r.manzana,
        lote: r.lote,
        ubicacion: r.ubicacion || null,
        area_lote: r.area_lote == null ? null : Number(r.area_lote),
        precio_promotor: r.precio_promotor == null ? null : Number(r.precio_promotor),
      }));

      await upsertCuh(payload);
      setMessage({ text: `Guardado exitoso: ${payload.length} filas procesadas.`, type: 'success' });
      setRows([]);
      setBadRows([]);
      setFileName(null);
    } catch (e: any) {
      setMessage({ text: `Error al guardar: ${e?.message || e}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  const missingHeaders = useMemo(() => {
    const found = new Set<string>();
    const any = (rows[0] ?? badRows[0]) as PreviewRow | undefined;
    if (any) {
      Object.keys(any).forEach(k => {
        if (WANTED.includes(k as keyof CuhRow)) found.add(k);
      });
    }
    return WANTED.filter(h => !found.has(h as string));
  }, [rows, badRows]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Importar Catálogo CUH</h2>
            <p className="mt-1 text-sm text-gray-500">
              Sube un archivo .xlsx, .xls o .csv con las columnas: <br />
              <span className="font-mono text-xs">
                ETAPA, CÓDIGO CUH, MODELO, PRECIO CUH, PARTIDA, MZ, LT, ESQ.-PARQ., ÁREA LOTE, PRECIO PROMOTOR (opcional)
              </span>
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            Seleccionar archivo
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>
        </div>
        {fileName && (
          <div className="mt-4 text-sm text-gray-600">
            Archivo seleccionado: <span className="font-medium">{fileName}</span>
          </div>
        )}
      </div>

      {message && (
        <div className={`rounded-lg p-4 text-sm font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {message.text}
        </div>
      )}

      {rows.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filas válidas: {rows.length}</h3>
            <button
              onClick={saveAll}
              disabled={saving || !rows.length}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando…' : 'Guardar en base de datos'}
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <Th>Etapa</Th><Th>Código CUH</Th><Th>Modelo</Th><Th>Precio CUH</Th><Th>Partida</Th>
                  <Th>Manzana</Th><Th>Lote</Th><Th>Ubicación</Th><Th>Área Lote</Th><Th>Precio Promotor</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <Td>{r.etapa}</Td>
                    <Td className="font-mono">{r.codigo_cuh}</Td>
                    <Td>{r.modelo}</Td>
                    <Td className="text-right">{fmtMoney(r.precio_cuh)}</Td>
                    <Td className="font-mono">{r.partida}</Td>
                    <Td>{r.manzana}</Td>
                    <Td>{r.lote}</Td>
                    <Td>{r.ubicacion || '-'}</Td>
                    <Td className="text-right">{r.area_lote != null ? r.area_lote : '-'}</Td>
                    <Td className="text-right">{r.precio_promotor != null ? fmtMoney(r.precio_promotor) : '-'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {missingHeaders.length > 0 && (
            <p className="mt-3 text-sm text-amber-600">
              Columnas no encontradas: {missingHeaders.join(', ')}
            </p>
          )}
        </div>
      )}

      {badRows.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-amber-900 mb-4">
            Filas con errores: {badRows.length} (no se guardarán)
          </h3>
          <div className="overflow-x-auto rounded-lg border border-amber-100">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-amber-100 text-xs uppercase text-amber-900">
                <tr>
                  <Th>#Fila</Th><Th>Etapa</Th><Th>Código CUH</Th><Th>Modelo</Th><Th>Precio CUH</Th>
                  <Th>Partida</Th><Th>Manzana</Th><Th>Lote</Th><Th>Errores</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-200">
                {badRows.map((r, i) => (
                  <tr key={i} className="hover:bg-amber-100/50">
                    <Td>{r._row}</Td>
                    <Td>{asText(r.etapa)}</Td>
                    <Td className="font-mono">{r.codigo_cuh}</Td>
                    <Td>{r.modelo}</Td>
                    <Td className="text-right">{asText(r.precio_cuh)}</Td>
                    <Td className="font-mono">{r.partida}</Td>
                    <Td>{asText(r.manzana)}</Td>
                    <Td>{asText(r.lote)}</Td>
                    <Td className="text-amber-900">{r._errors?.join(', ')}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-amber-700">
            Revisa los valores requeridos: {REQUIRED.join(', ')}.
          </p>
        </div>
      )}

      {!hasData && (
        <div className="text-center text-sm text-gray-500 py-6">
          Selecciona un archivo para comenzar.
        </div>
      )}
    </div>
  );
}

// ========================= mini UI =========================

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 font-medium">{children}</th>;
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}

function fmtMoney(n?: number | null) {
  if (n == null || isNaN(n)) return '-';
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function asText(v: any) {
  return v == null || (typeof v === 'number' && isNaN(v)) ? '-' : String(v);
}
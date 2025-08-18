'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface CuhRow {
  etapa: number;
  codigo_cuh: string;
  modelo: string;
  precio_cuh: number | null;
  partida: string;
  manzana: number;
  lote: number;
  ubicacion: string | null;
  area_lote: number | null;
  precio_promotor: number | null;
}

// Util to dynamically load a script from CDN.
const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });

const loadPapaparse = async () => {
  await loadScript('https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js');
  return (window as any).Papa;
};

const loadXLSX = async () => {
  await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
  return (window as any).XLSX;
};

export default function CatalogoPage() {
  const [rows, setRows] = useState<CuhRow[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      const Papa = await loadPapaparse();
      Papa.parse(file, {
        header: true,
        complete: (result: any) => {
          const parsed = (result.data as any[]).map(normalizeRow);
          setRows(parsed);
        },
      });
    } else {
      const XLSX = await loadXLSX();
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      const parsed = (json as any[]).map(normalizeRow);
      setRows(parsed);
    }
  };

  const normalizeRow = (row: any): CuhRow => ({
    etapa: numberOrZero(row['ETAPA'] ?? row['21 ETAPA']),
    codigo_cuh: String(row['CÓDIGO CUH'] ?? row['CODIGO CUH'] ?? '').trim(),
    modelo: String(row['MODELO'] ?? '').trim(),
    precio_cuh: numberOrNull(row['PRECIO CUH']),
    partida: String(row['PARTIDA'] ?? '').trim(),
    manzana: numberOrZero(row['MZ']),
    lote: numberOrZero(row['LT']),
    ubicacion: (row['ESQ.-PARQ.'] ?? row['ESQ.-PARQ'] ?? '').toString().trim() || null,
    area_lote: numberOrNull(row['ÁREA LOTE']),
    precio_promotor: numberOrNull(row['PRECIO - PROMOTOR']),
  });

  const numberOrZero = (value: any): number => {
    const n = numberOrNull(value);
    return n === null ? 0 : n;
  };

  const numberOrNull = (value: any): number | null => {
    if (value === undefined || value === null || value === '') return null;
    const n = Number(String(value).replace(/[^0-9.-]+/g, '').replace(/,/g, ''));
    return Number.isNaN(n) ? null : n;
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from('cuh').insert(rows);
    if (error) {
      console.error(error);
      alert('Error guardando datos');
    } else {
      alert('Datos guardados correctamente');
      setRows([]);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 space-y-4">
      <input
        type="file"
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        onChange={handleFileChange}
        className="border p-2"
      />
      {rows.length > 0 && (
        <>
          <div className="overflow-auto max-h-96">
            <table className="min-w-full border text-sm">
              <thead>
                <tr>
                  <th className="border px-2">ETAPA</th>
                  <th className="border px-2">CÓDIGO CUH</th>
                  <th className="border px-2">MODELO</th>
                  <th className="border px-2">PRECIO CUH</th>
                  <th className="border px-2">PARTIDA</th>
                  <th className="border px-2">MZ</th>
                  <th className="border px-2">LT</th>
                  <th className="border px-2">ESQ.-PARQ.</th>
                  <th className="border px-2">ÁREA LOTE</th>
                  <th className="border px-2">PRECIO - PROMOTOR</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 text-center">{r.etapa}</td>
                    <td className="border px-2">{r.codigo_cuh}</td>
                    <td className="border px-2">{r.modelo}</td>
                    <td className="border px-2 text-right">{r.precio_cuh}</td>
                    <td className="border px-2">{r.partida}</td>
                    <td className="border px-2 text-center">{r.manzana}</td>
                    <td className="border px-2 text-center">{r.lote}</td>
                    <td className="border px-2">{r.ubicacion}</td>
                    <td className="border px-2 text-right">{r.area_lote}</td>
                    <td className="border px-2 text-right">{r.precio_promotor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </>
      )}
    </div>
  );
}


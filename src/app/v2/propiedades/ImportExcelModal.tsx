'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import type { Etapa } from '@/lib/v2/types';

interface Props {
  etapas: Etapa[];
  onClose: () => void;
  onDone: () => void;
}

interface Row {
  cuh: string;
  etapa?: string;
  tipo: string;
  modelo?: string;
  manzana?: string;
  lote?: string;
  ubicacion?: string;
  area_m2?: number;
  precio_lista: number;
  precio_venta?: number;
  moneda?: string;
  partida_registral?: string;
}

export function ImportExcelModal({ etapas, onClose, onDone }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: number; errors: string[] } | null>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<any>(sheet, { defval: null });
      const normalized = json.map((r) => normalizeRow(r));
      setRows(normalized);
    };
    reader.readAsArrayBuffer(file);
  };

  const importAll = async () => {
    setImporting(true);
    const errors: string[] = [];
    let ok = 0;
    for (const r of rows) {
      const etapa_id = r.etapa ? etapas.find((e) => e.codigo === r.etapa || e.nombre === r.etapa)?.id ?? null : null;
      const payload: any = {
        cuh: r.cuh,
        etapa_id,
        tipo: (r.tipo ?? 'terreno').toLowerCase() === 'casa' ? 'casa' : 'terreno',
        modelo: r.modelo ?? null,
        partida_registral: r.partida_registral ?? null,
        manzana: r.manzana ?? null,
        lote: r.lote ?? null,
        ubicacion: r.ubicacion ?? null,
        area_m2: r.area_m2 ?? null,
        precio_lista: Number(r.precio_lista || 0),
        precio_venta: r.precio_venta ? Number(r.precio_venta) : null,
        moneda: (r.moneda ?? 'USD').toUpperCase() === 'PEN' ? 'PEN' : 'USD',
      };
      const { error } = await supabaseV2.from('propiedades').insert(payload);
      if (error) errors.push(`${r.cuh}: ${error.message}`);
      else ok++;
    }
    setImporting(false);
    setResult({ ok, errors });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-lg font-semibold">Importar propiedades desde Excel</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="p-5">
          <p className="mb-3 text-sm text-slate-600">
            Columnas aceptadas: <code>cuh, etapa, tipo, modelo, manzana, lote, ubicacion, area_m2, precio_lista, precio_venta, moneda, partida_registral</code>
          </p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="block w-full text-sm"
          />
          {rows.length > 0 && (
            <div className="mt-4 max-h-64 overflow-auto rounded border border-slate-200 text-xs">
              <table className="min-w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-2 py-1">CUH</th>
                    <th className="px-2 py-1">Tipo</th>
                    <th className="px-2 py-1">Mz/Lt</th>
                    <th className="px-2 py-1">Área</th>
                    <th className="px-2 py-1">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((r, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1">{r.cuh}</td>
                      <td className="px-2 py-1">{r.tipo}</td>
                      <td className="px-2 py-1">{r.manzana}/{r.lote}</td>
                      <td className="px-2 py-1">{r.area_m2}</td>
                      <td className="px-2 py-1">{r.precio_lista}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 50 && <div className="px-2 py-1 text-slate-500">… y {rows.length - 50} más</div>}
            </div>
          )}
          {result && (
            <div className="mt-4 rounded bg-slate-50 p-3 text-sm">
              <div className="text-green-700">Importadas: {result.ok}</div>
              {result.errors.length > 0 && (
                <div className="mt-1 text-red-700">
                  Errores ({result.errors.length}):
                  <ul className="mt-1 max-h-32 overflow-auto text-xs">
                    {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <button onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Cerrar</button>
          <button
            onClick={importAll}
            disabled={rows.length === 0 || importing}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {importing ? 'Importando…' : `Importar ${rows.length} filas`}
          </button>
          {result && (
            <button onClick={onDone} className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-500">
              Hecho
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function normalizeRow(r: any): Row {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const match = Object.keys(r).find((rk) => rk.toLowerCase().trim() === k.toLowerCase());
      if (match && r[match] !== null && r[match] !== undefined && r[match] !== '') return r[match];
    }
    return undefined;
  };
  return {
    cuh: String(get('cuh', 'CUH') ?? ''),
    etapa: get('etapa', 'Etapa'),
    tipo: String(get('tipo', 'Tipo') ?? 'terreno'),
    modelo: get('modelo', 'Modelo'),
    manzana: String(get('manzana', 'Mz', 'Manzana') ?? ''),
    lote: String(get('lote', 'Lt', 'Lote') ?? ''),
    ubicacion: get('ubicacion', 'Ubicación', 'Ubicacion'),
    area_m2: Number(get('area_m2', 'area', 'Área', 'm2')) || undefined,
    precio_lista: Number(get('precio_lista', 'precio', 'Precio')) || 0,
    precio_venta: Number(get('precio_venta', 'Precio venta')) || undefined,
    moneda: get('moneda', 'Moneda'),
    partida_registral: get('partida_registral', 'Partida'),
  };
}

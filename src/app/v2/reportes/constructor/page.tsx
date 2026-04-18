'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { ArrowLeft, Download, FileSpreadsheet, GripVertical, Plus, Search, Trash2, X, RotateCcw } from 'lucide-react';
import { supabaseV2, supabasePublic } from '@/lib/v2/supabaseV2';
import { useV2User } from '@/lib/v2/useV2User';
import { isAdmin, isAuditor, isStaff } from '@/lib/v2/permissions';
import { ENTITIES, type Field, type Entity, getNestedValue, formatCell, groupColor } from './schema';

const isPromotor = (r: string | null | undefined) => r === 'promotor';

// Trae los profiles (promotor, registrado_por) y los fusiona en cada fila.
// PostgREST no puede hacer FK cross-schema (v2 → public), así que hacemos
// una segunda query a public.profiles y anexamos los datos como
// `row.promotor` y `row.registrado`.
async function enrichWithProfiles(entityKey: string, rows: any[]): Promise<any[]> {
  if (!rows.length) return rows;

  const ids = new Set<string>();
  const idGetters: Record<string, (r: any) => string | undefined> = {
    ventas: (r) => r?.promotor_id,
    pagos: (r) => r?.venta?.promotor_id,
    cuotas: (r) => r?.venta?.promotor_id,
  };
  const regGetters: Record<string, (r: any) => string | undefined> = {
    pagos: (r) => r?.registrado_por,
  };

  const g = idGetters[entityKey];
  const rg = regGetters[entityKey];
  for (const r of rows) {
    if (g) { const id = g(r); if (id) ids.add(id); }
    if (rg) { const id = rg(r); if (id) ids.add(id); }
  }
  if (ids.size === 0) return rows;

  const { data: profiles } = await supabasePublic
    .from('profiles')
    .select('id, first_name, last_name, email')
    .in('id', Array.from(ids));

  const byId: Record<string, any> = {};
  for (const p of (profiles ?? []) as any[]) byId[p.id] = p;

  return rows.map((r) => {
    const out = { ...r };
    if (entityKey === 'ventas' && r.promotor_id) {
      out.promotor = byId[r.promotor_id] ?? null;
    }
    if (entityKey === 'pagos') {
      if (r.venta?.promotor_id) out.venta = { ...r.venta, promotor: byId[r.venta.promotor_id] ?? null };
      if (r.registrado_por) out.registrado = byId[r.registrado_por] ?? null;
    }
    if (entityKey === 'cuotas' && r.venta?.promotor_id) {
      out.venta = { ...r.venta, promotor: byId[r.venta.promotor_id] ?? null };
    }
    return out;
  });
}

export default function ConstructorReportesPage() {
  const { user, loading: loadingUser } = useV2User();

  const canAccess = isAdmin(user?.roleCode) || isAuditor(user?.roleCode) ||
    (isStaff(user?.roleCode) && !isPromotor(user?.roleCode));

  const [entityKey, setEntityKey] = useState<string>('ventas');
  const [selected, setSelected] = useState<Field[]>([]);
  const [search, setSearch] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragField, setDragField] = useState<Field | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const entity = useMemo(() => ENTITIES.find((e) => e.key === entityKey)!, [entityKey]);

  // Campos disponibles = todos los de la entidad menos los ya elegidos
  const availableByGroup = useMemo(() => {
    const selectedKeys = new Set(selected.map((s) => s.key));
    const filtered = entity.fields.filter((f) => {
      if (selectedKeys.has(f.key)) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return f.label.toLowerCase().includes(s) || f.group.toLowerCase().includes(s);
    });
    const grouped: Record<string, Field[]> = {};
    for (const f of filtered) {
      if (!grouped[f.group]) grouped[f.group] = [];
      grouped[f.group].push(f);
    }
    return grouped;
  }, [entity, selected, search]);

  // Al cambiar entidad: resetear selección
  useEffect(() => {
    setSelected([]);
    setRows([]);
    setError(null);
  }, [entityKey]);

  const runQuery = async () => {
    if (selected.length === 0) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let q = supabaseV2.from(entity.table).select(entity.select).limit(500);
      if (entity.dateField) {
        if (desde) q = q.gte(entity.dateField, desde);
        if (hasta) q = q.lte(entity.dateField, hasta + 'T23:59:59');
      }
      const { data, error } = await q;
      if (error) throw error;

      // Enriquecimiento cliente-side de profiles (promotor, registrado_por).
      // PostgREST no puede resolver FK cross-schema (v2 → public), así que
      // hacemos una query adicional y fusionamos en memoria.
      const enriched = await enrichWithProfiles(entity.key, data ?? []);
      setRows(enriched);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runQuery(); /* eslint-disable-next-line */ }, [entityKey, desde, hasta]);

  // --- Drag handlers ---
  const onDragStartField = (f: Field, e: React.DragEvent) => {
    setDragField(f);
    setDragIndex(null);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragStartSelected = (idx: number, e: React.DragEvent) => {
    setDragIndex(idx);
    setDragField(null);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOverDrop = (e: React.DragEvent, idx?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (idx !== undefined) setOverIndex(idx);
  };
  const onDropSelected = (e: React.DragEvent, idx?: number) => {
    e.preventDefault();
    if (dragField) {
      const pos = idx === undefined ? selected.length : idx;
      setSelected([...selected.slice(0, pos), dragField, ...selected.slice(pos)]);
    } else if (dragIndex !== null) {
      const from = dragIndex;
      const to = idx === undefined ? selected.length - 1 : idx;
      if (from !== to) {
        const next = [...selected];
        const [moved] = next.splice(from, 1);
        next.splice(to > from ? to - 1 : to, 0, moved);
        setSelected(next);
      }
    }
    setDragField(null);
    setDragIndex(null);
    setOverIndex(null);
  };
  const onDropAvailable = (e: React.DragEvent) => {
    // Soltar campo ya elegido en la zona izquierda → lo quita
    e.preventDefault();
    if (dragIndex !== null) {
      setSelected(selected.filter((_, i) => i !== dragIndex));
    }
    setDragField(null);
    setDragIndex(null);
    setOverIndex(null);
  };

  const addField = (f: Field) => setSelected([...selected, f]);
  const removeField = (idx: number) => setSelected(selected.filter((_, i) => i !== idx));
  const clearAll = () => setSelected([]);

  // --- Export ---
  const buildExportRows = () => {
    return rows.map((row) => {
      const obj: Record<string, any> = {};
      for (const f of selected) {
        const raw = getNestedValue(row, f.path);
        obj[f.label] = formatCell(raw, f, row);
      }
      return obj;
    });
  };

  const exportExcel = () => {
    const data = buildExportRows();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, `reporte_${entity.key}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportCSV = () => {
    const data = buildExportRows();
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws, { forceQuotes: true });
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${entity.key}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loadingUser) return <div className="text-slate-500">Cargando…</div>;
  if (!canAccess) {
    return <div className="rounded bg-yellow-50 p-4 text-sm text-yellow-800">No tienes permiso para usar el constructor de reportes.</div>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link href="/v2/reportes" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-3 w-3" /> Reportes predefinidos
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Constructor de reportes</h1>
          <p className="text-sm text-slate-500">
            Arrastra campos del panel izquierdo al área de columnas. Reordena arrastrando. Exporta cuando tengas la tabla lista.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            disabled={selected.length === 0 || rows.length === 0}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
          <button
            onClick={exportExcel}
            disabled={selected.length === 0 || rows.length === 0}
            className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </button>
        </div>
      </div>

      {/* Selector de entidad raíz */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {ENTITIES.map((e) => (
          <button
            key={e.key}
            onClick={() => setEntityKey(e.key)}
            className={`rounded-lg border p-3 text-left transition ${
              entityKey === e.key
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="text-sm font-semibold text-slate-900">{e.label}</div>
            <div className="mt-1 text-xs text-slate-500">{e.desc}</div>
          </button>
        ))}
      </div>

      {entity.dateField && (
        <div className="mb-4 flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-slate-600">Desde ({entity.dateField})</label>
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600">Hasta</label>
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm" />
          </div>
          {(desde || hasta) && (
            <button onClick={() => { setDesde(''); setHasta(''); }} className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs">
              Limpiar fechas
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        {/* IZQUIERDA: campos disponibles */}
        <div
          className="flex max-h-[70vh] flex-col rounded-lg border border-slate-200 bg-white"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDropAvailable}
        >
          <div className="border-b border-slate-100 p-3">
            <div className="text-xs font-semibold uppercase text-slate-500">Campos disponibles</div>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar campo…"
                className="h-8 w-full rounded-md border border-slate-300 pl-7 pr-2 text-xs"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {Object.entries(availableByGroup).length === 0 ? (
              <div className="p-3 text-xs text-slate-400">Ningún campo coincide.</div>
            ) : (
              Object.entries(availableByGroup).map(([group, fields]) => (
                <div key={group} className="mb-3">
                  <div className={`mb-1 inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${groupColor(group)}`}>
                    {group}
                  </div>
                  <div className="mt-1 space-y-1">
                    {fields.map((f) => (
                      <div
                        key={f.key}
                        draggable
                        onDragStart={(e) => onDragStartField(f, e)}
                        onDoubleClick={() => addField(f)}
                        className="group flex cursor-grab items-center justify-between rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs hover:border-indigo-300 hover:bg-indigo-50 active:cursor-grabbing"
                        title={`Arrastra a la derecha o haz doble click\nPath: ${f.path}`}
                      >
                        <span className="flex-1 text-slate-800">{f.label}</span>
                        <button
                          onClick={() => addField(f)}
                          className="rounded p-0.5 text-slate-300 hover:bg-indigo-100 hover:text-indigo-600"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* DERECHA: columnas elegidas + preview */}
        <div className="space-y-3">
          <div
            className="rounded-lg border-2 border-dashed border-slate-300 bg-white p-3 transition"
            onDragOver={(e) => onDragOverDrop(e)}
            onDrop={(e) => onDropSelected(e)}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase text-slate-500">
                Columnas del reporte ({selected.length})
              </div>
              {selected.length > 0 && (
                <button onClick={clearAll} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-600">
                  <RotateCcw className="h-3 w-3" /> Limpiar
                </button>
              )}
            </div>

            {selected.length === 0 ? (
              <div className="rounded-md bg-slate-50 p-8 text-center text-sm text-slate-400">
                Arrastra campos aquí o haz doble click para agregarlos
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selected.map((f, idx) => (
                  <div
                    key={f.key + idx}
                    draggable
                    onDragStart={(e) => onDragStartSelected(idx, e)}
                    onDragOver={(e) => onDragOverDrop(e, idx)}
                    onDragLeave={() => setOverIndex(null)}
                    onDrop={(e) => onDropSelected(e, idx)}
                    className={`group inline-flex items-center gap-1.5 rounded-md border bg-white px-2 py-1.5 text-xs ${
                      overIndex === idx ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300'
                    }`}
                  >
                    <GripVertical className="h-3 w-3 cursor-grab text-slate-400" />
                    <span className="text-[10px] text-slate-400">{idx + 1}.</span>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${groupColor(f.group)}`}>{f.group}</span>
                    <span className="text-slate-800">{f.label}</span>
                    <button
                      onClick={() => removeField(idx)}
                      className="rounded p-0.5 text-slate-400 hover:bg-red-100 hover:text-red-600"
                      title="Quitar columna"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <div className="text-xs font-semibold uppercase text-slate-500">
                Preview ({rows.length} filas{rows.length >= 500 ? ' — límite alcanzado' : ''})
              </div>
              <button onClick={runQuery} disabled={loading} className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-50">
                <RotateCcw className="h-3 w-3" /> Actualizar
              </button>
            </div>
            {error && <div className="m-3 rounded bg-red-50 p-2 text-xs text-red-700">{error}</div>}
            <div className="max-h-[45vh] overflow-auto">
              {selected.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">Elige al menos una columna para ver datos.</div>
              ) : loading ? (
                <div className="p-8 text-center text-sm text-slate-400">Cargando…</div>
              ) : rows.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">Sin datos para los filtros actuales.</div>
              ) : (
                <table className="min-w-full text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-left text-[10px] uppercase text-slate-500">
                    <tr>
                      {selected.map((f, idx) => (
                        <th key={f.key + idx} className="whitespace-nowrap border-b border-slate-200 px-3 py-2">
                          <div className="flex flex-col gap-0.5">
                            <span className={`w-fit rounded px-1 py-0 text-[9px] normal-case ${groupColor(f.group)}`}>{f.group}</span>
                            <span>{f.label}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 20).map((row, ri) => (
                      <tr key={ri} className="border-t border-slate-100">
                        {selected.map((f, ci) => {
                          const raw = getNestedValue(row, f.path);
                          return (
                            <td key={f.key + ci} className="whitespace-nowrap px-3 py-1.5 text-slate-800">
                              {formatCell(raw, f, row)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {rows.length > 20 && (
              <div className="border-t border-slate-100 px-3 py-1.5 text-[10px] text-slate-400">
                Mostrando 20 de {rows.length}. Exporta para obtener todos los registros.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

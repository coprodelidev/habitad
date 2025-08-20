"use client";

import React, { useEffect, useMemo, useState } from "react";
import { listReporte, type ReportRow } from "./reporteService";

/* ============ utils ============ */
const fmtMoney = (n?: number | null) =>
  Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function timeLeftLabel(iso?: string | null) {
  if (!iso) return "—";
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = t - now;
  if (!isFinite(diff)) return "—";
  if (diff <= 0) return "expirada";
  const mins = Math.floor(diff / 60000);
  const d = Math.floor(mins / (60 * 24));
  const h = Math.floor((mins % (60 * 24)) / 60);
  const m = mins % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function chipForEstado(estado: string) {
  const e = (estado || "").toLowerCase();
  if (e === "separado")
    return <span className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-semibold text-white">SEPARADO</span>;
  if (e === "reservado")
    return <span className="rounded bg-amber-600 px-2 py-0.5 text-[10px] font-semibold text-white">RESERVADO</span>;
  return <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">{estado}</span>;
}

/* ============ página ============ */
export default function ReportePage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Filtros
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<"" | "reservado" | "separado">("");
  const [tipo, setTipo] = useState<"" | "casa" | "terreno">("");
  const [modelo, setModelo] = useState("");

  // Ordenamiento
  type SortKey =
    | "etapa" | "codigo" | "modelo" | "tipo" | "precio_cuh" | "precio_promotor"
    | "partida" | "mz" | "lt" | "ubicacion" | "area"
    | "estado" | "required_amount" | "expires_at"
    | "promotor" | "promotor_email"
    | "cliente_documento" | "primer_nombre" | "segundo_nombre" | "primer_apellido" | "segundo_apellido" | "cliente_email" | "cliente_phone"
    | "dni" | "anexo1" | "anexoA2"
    | "reserva_pagado" | "reserva_objetivo" | "reserva_restante"
    | "inicial_pagado" | "inicial_objetivo" | "inicial_restante"
    | "final_pagado" | "final_objetivo" | "final_restante"
    | "total_pagado" | "total_objetivo" | "total_restante";

  const [sortBy, setSortBy] = useState<SortKey>("codigo");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await listReporte();
        setRows(data);
      } catch (e: any) {
        setErr(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const modelos = useMemo(
    () => Array.from(new Set(rows.map(r => r.modelo))).sort((a, b) => a.localeCompare(b)),
    [rows]
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter(r => {
      if (estado && r.estado.toLowerCase() !== estado) return false;
      if (tipo && (r.tipo || "") !== tipo) return false;
      if (modelo && r.modelo !== modelo) return false;
      if (!term) return true;
      return [
        r.codigo, r.modelo, r.partida, String(r.mz), String(r.lt),
        r.ubicacion ?? "", r.estado, r.promotor ?? "", r.promotor_email ?? "",
        r.cliente_documento ?? "", r.primer_nombre ?? "", r.segundo_nombre ?? "",
        r.primer_apellido ?? "", r.segundo_apellido ?? "",
        r.cliente_email ?? "", r.cliente_phone ?? ""
      ].some(v => String(v).toLowerCase().includes(term));
    });
  }, [rows, q, estado, tipo, modelo]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const getVal = (r: ReportRow) => {
      const total_pagado = (r.reserva_pagado || 0) + (r.inicial_pagado || 0) + (r.final_pagado || 0);
      const total_objetivo = (r.reserva_objetivo || 0) + (r.inicial_objetivo || 0) + (r.final_objetivo || 0);
      const total_restante = Math.max(0, total_objetivo - total_pagado);
      switch (sortBy) {
        case "etapa": return r.etapa;
        case "codigo": return r.codigo;
        case "modelo": return r.modelo;
        case "tipo": return r.tipo ?? "";
        case "precio_cuh": return r.precio_cuh;
        case "precio_promotor": return r.precio_promotor ?? 0;
        case "partida": return r.partida;
        case "mz": return r.mz;
        case "lt": return r.lt;
        case "ubicacion": return r.ubicacion ?? "";
        case "area": return r.area ?? 0;
        case "estado": return r.estado ?? "";
        case "required_amount": return r.required_amount ?? 0;
        case "expires_at": return r.expires_at ? new Date(r.expires_at).getTime() : 0;
        case "promotor": return r.promotor ?? "";
        case "promotor_email": return r.promotor_email ?? "";
        case "cliente_documento": return r.cliente_documento ?? "";
        case "primer_nombre": return r.primer_nombre ?? "";
        case "segundo_nombre": return r.segundo_nombre ?? "";
        case "primer_apellido": return r.primer_apellido ?? "";
        case "segundo_apellido": return r.segundo_apellido ?? "";
        case "cliente_email": return r.cliente_email ?? "";
        case "cliente_phone": return r.cliente_phone ?? "";
        case "dni": return r.dni_url ? 1 : 0;
        case "anexo1": return r.anexo1_url ? 1 : 0;
        case "anexoA2": return r.anexoA2_url ? 1 : 0;
        case "reserva_pagado": return r.reserva_pagado;
        case "reserva_objetivo": return r.reserva_objetivo;
        case "reserva_restante": return r.reserva_restante;
        case "inicial_pagado": return r.inicial_pagado;
        case "inicial_objetivo": return r.inicial_objetivo;
        case "inicial_restante": return r.inicial_restante;
        case "final_pagado": return r.final_pagado;
        case "final_objetivo": return r.final_objetivo;
        case "final_restante": return r.final_restante;
        case "total_pagado": return total_pagado;
        case "total_objetivo": return total_objetivo;
        case "total_restante": return total_restante;
        default: return 0;
      }
    };
    arr.sort((a, b) => {
      const A: any = getVal(a);
      const B: any = getVal(b);
      if (A < B) return sortDir === "asc" ? -1 : 1;
      if (A > B) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  function onSort(key: SortKey) {
    if (sortBy === key) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  }

  const sortIcon = (key: SortKey) =>
    sortBy !== key ? "↕" : sortDir === "asc" ? "▲" : "▼";

  return (
    <div className="mx-auto max-w-[95rem] p-4 space-y-6">
      {/* Header + filtros */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div>
            <h2 className="text-xl font-semibold">Reporte</h2>
            <p className="text-sm text-gray-500">Tabla con todos los datos: propiedad, promotor, cliente, documentos, pagos y estado.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar (código, cliente, promotor, teléfono, email)…"
              className="rounded border px-3 py-2 text-sm w-80"
            />
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as any)}
              className="rounded border px-2 py-2 text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="reservado">Reservado</option>
              <option value="separado">Separado</option>
            </select>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as any)}
              className="rounded border px-2 py-2 text-sm"
            >
              <option value="">Todos los tipos</option>
              <option value="casa">Casa</option>
              <option value="terreno">Terreno</option>
            </select>
            <select
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              className="rounded border px-2 py-2 text-sm"
            >
              <option value="">Todos los modelos</option>
              {modelos.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button
              onClick={() => location.reload()}
              className="rounded bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla larga sin gráficos */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-gray-500">Cargando…</p>
        ) : err ? (
          <p className="text-sm text-red-600">{err}</p>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-gray-500">Sin resultados.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-[2400px] text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  {/* Propiedad */}
                  <ThButton onClick={() => onSort("etapa")}>Etapa {sortIcon("etapa")}</ThButton>
                  <ThButton onClick={() => onSort("codigo")}>Código {sortIcon("codigo")}</ThButton>
                  <ThButton onClick={() => onSort("modelo")}>Modelo {sortIcon("modelo")}</ThButton>
                  <ThButton onClick={() => onSort("tipo")}>Tipo {sortIcon("tipo")}</ThButton>
                  <ThButton right onClick={() => onSort("precio_cuh")}>Precio CUH {sortIcon("precio_cuh")}</ThButton>
                  <ThButton right onClick={() => onSort("precio_promotor")}>Precio promotor {sortIcon("precio_promotor")}</ThButton>
                  <ThButton onClick={() => onSort("partida")}>Partida {sortIcon("partida")}</ThButton>
                  <ThButton onClick={() => onSort("mz")}>MZ {sortIcon("mz")}</ThButton>
                  <ThButton onClick={() => onSort("lt")}>LT {sortIcon("lt")}</ThButton>
                  <ThButton onClick={() => onSort("ubicacion")}>Ubicación {sortIcon("ubicacion")}</ThButton>
                  <ThButton right onClick={() => onSort("area")}>Área {sortIcon("area")}</ThButton>

                  {/* Reserva */}
                  <ThButton onClick={() => onSort("estado")}>Estado {sortIcon("estado")}</ThButton>
                  <ThButton right onClick={() => onSort("required_amount")}>Obj. Reserva {sortIcon("required_amount")}</ThButton>
                  <ThButton onClick={() => onSort("expires_at")}>Vence {sortIcon("expires_at")}</ThButton>
                  <Th>Expira en</Th>

                  {/* Promotor */}
                  <ThButton onClick={() => onSort("promotor")}>Promotor {sortIcon("promotor")}</ThButton>
                  <ThButton onClick={() => onSort("promotor_email")}>Promotor Email {sortIcon("promotor_email")}</ThButton>

                  {/* Cliente (cada campo en su columna) */}
                  <ThButton onClick={() => onSort("cliente_documento")}>Doc. Identidad {sortIcon("cliente_documento")}</ThButton>
                  <ThButton onClick={() => onSort("primer_nombre")}>Primer nombre {sortIcon("primer_nombre")}</ThButton>
                  <ThButton onClick={() => onSort("segundo_nombre")}>Segundo nombre {sortIcon("segundo_nombre")}</ThButton>
                  <ThButton onClick={() => onSort("primer_apellido")}>Primer apellido {sortIcon("primer_apellido")}</ThButton>
                  <ThButton onClick={() => onSort("segundo_apellido")}>Segundo apellido {sortIcon("segundo_apellido")}</ThButton>
                  <ThButton onClick={() => onSort("cliente_email")}>Email cliente {sortIcon("cliente_email")}</ThButton>
                  <ThButton onClick={() => onSort("cliente_phone")}>Teléfono {sortIcon("cliente_phone")}</ThButton>

                  {/* Documentos (cada uno en su columna) */}
                  <ThButton onClick={() => onSort("dni")}>DNI {sortIcon("dni")}</ThButton>
                  <ThButton onClick={() => onSort("anexo1")}>Anexo 1 {sortIcon("anexo1")}</ThButton>
                  <ThButton onClick={() => onSort("anexoA2")}>Anexo A2 {sortIcon("anexoA2")}</ThButton>

                  {/* Pagos por etapa: columnas separadas */}
                  <ThButton right onClick={() => onSort("reserva_pagado")}>Reserva pagado {sortIcon("reserva_pagado")}</ThButton>
                  <ThButton right onClick={() => onSort("reserva_objetivo")}>Reserva objetivo {sortIcon("reserva_objetivo")}</ThButton>
                  <ThButton right onClick={() => onSort("reserva_restante")}>Reserva restante {sortIcon("reserva_restante")}</ThButton>

                  <ThButton right onClick={() => onSort("inicial_pagado")}>Inicial pagado {sortIcon("inicial_pagado")}</ThButton>
                  <ThButton right onClick={() => onSort("inicial_objetivo")}>Inicial objetivo {sortIcon("inicial_objetivo")}</ThButton>
                  <ThButton right onClick={() => onSort("inicial_restante")}>Inicial restante {sortIcon("inicial_restante")}</ThButton>

                  <ThButton right onClick={() => onSort("final_pagado")}>Final pagado {sortIcon("final_pagado")}</ThButton>
                  <ThButton right onClick={() => onSort("final_objetivo")}>Final objetivo {sortIcon("final_objetivo")}</ThButton>
                  <ThButton right onClick={() => onSort("final_restante")}>Final restante {sortIcon("final_restante")}</ThButton>

                  {/* Totales */}
                  <ThButton right onClick={() => onSort("total_pagado")}>Total pagado {sortIcon("total_pagado")}</ThButton>
                  <ThButton right onClick={() => onSort("total_objetivo")}>Total objetivo {sortIcon("total_objetivo")}</ThButton>
                  <ThButton right onClick={() => onSort("total_restante")}>Total restante {sortIcon("total_restante")}</ThButton>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sorted.map((r, i) => {
                  const totalPagado = (r.reserva_pagado || 0) + (r.inicial_pagado || 0) + (r.final_pagado || 0);
                  const totalObjetivo = (r.reserva_objetivo || 0) + (r.inicial_objetivo || 0) + (r.final_objetivo || 0);
                  const totalRestante = Math.max(0, totalObjetivo - totalPagado);

                  const LinkOrDash = ({ url, label }: { url: string | null; label: string }) =>
                    url ? <a className="text-blue-600 underline" href={url} target="_blank" rel="noreferrer">{label}</a> : <span className="text-gray-400">—</span>;

                  return (
                    <tr key={r.reserva_id + i} className={r.estado.toLowerCase()==="separado" ? "bg-rose-50" : ""}>
                      {/* Propiedad */}
                      <Td>{r.etapa}</Td>
                      <Td mono>{r.codigo}</Td>
                      <Td>{r.modelo}</Td>
                      <Td>{r.tipo ? r.tipo[0].toUpperCase() + r.tipo.slice(1) : "—"}</Td>
                      <Td right>{fmtMoney(r.precio_cuh)}</Td>
                      <Td right>{r.precio_promotor != null ? fmtMoney(r.precio_promotor) : "—"}</Td>
                      <Td mono>{r.partida}</Td>
                      <Td>{r.mz}</Td>
                      <Td>{r.lt}</Td>
                      <Td>{r.ubicacion || "—"}</Td>
                      <Td right>{r.area != null ? r.area : "—"}</Td>

                      {/* Reserva */}
                      <Td>{chipForEstado(r.estado)}</Td>
                      <Td right>{fmtMoney(r.required_amount)}</Td>
                      <Td>{r.expires_at ? new Date(r.expires_at).toLocaleString() : "—"}</Td>
                      <Td className="text-xs">{timeLeftLabel(r.expires_at)}</Td>

                      {/* Promotor */}
                      <Td>{r.promotor ?? "—"}</Td>
                      <Td>{r.promotor_email ?? "—"}</Td>

                      {/* Cliente: cada dato en su columna */}
                      <Td mono>{r.cliente_documento ?? "—"}</Td>
                      <Td>{r.primer_nombre ?? "—"}</Td>
                      <Td>{r.segundo_nombre ?? "—"}</Td>
                      <Td>{r.primer_apellido ?? "—"}</Td>
                      <Td>{r.segundo_apellido ?? "—"}</Td>
                      <Td>{r.cliente_email ?? "—"}</Td>
                      <Td>{r.cliente_phone ?? "—"}</Td>

                      {/* Documentos: columnas separadas */}
                      <Td><LinkOrDash url={r.dni_url} label="Ver" /></Td>
                      <Td><LinkOrDash url={r.anexo1_url} label="Ver" /></Td>
                      <Td><LinkOrDash url={r.anexoA2_url} label="Ver" /></Td>

                      {/* Pagos por etapa */}
                      <Td right>{fmtMoney(r.reserva_pagado)}</Td>
                      <Td right>{fmtMoney(r.reserva_objetivo)}</Td>
                      <Td right>{fmtMoney(r.reserva_restante)}</Td>

                      <Td right>{fmtMoney(r.inicial_pagado)}</Td>
                      <Td right>{fmtMoney(r.inicial_objetivo)}</Td>
                      <Td right>{fmtMoney(r.inicial_restante)}</Td>

                      <Td right>{fmtMoney(r.final_pagado)}</Td>
                      <Td right>{fmtMoney(r.final_objetivo)}</Td>
                      <Td right>{fmtMoney(r.final_restante)}</Td>

                      {/* Totales */}
                      <Td right className="font-semibold">{fmtMoney(totalPagado)}</Td>
                      <Td right className="font-semibold">{fmtMoney(totalObjetivo)}</Td>
                      <Td right className="font-semibold">{fmtMoney(totalRestante)}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ subcomponentes ============ */
function Th({ children, right = false }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`px-3 py-2 font-medium ${right ? "text-right" : "text-left"}`}>{children}</th>;
}
function ThButton({
  children, right = false, onClick,
}: { children: React.ReactNode; right?: boolean; onClick?: () => void }) {
  return (
    <th className={`px-3 py-2 font-medium ${right ? "text-right" : "text-left"}`}>
      <button onClick={onClick} className="inline-flex items-center gap-1 hover:underline">
        {children}
      </button>
    </th>
  );
}
function Td({
  children, mono, right, className = "",
}: { children: React.ReactNode; mono?: boolean; right?: boolean; className?: string }) {
  return (
    <td className={`px-3 py-2 ${mono ? "font-mono" : ""} ${right ? "text-right" : ""} ${className}`}>
      {children}
    </td>
  );
}

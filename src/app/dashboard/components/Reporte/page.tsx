"use client";

import React, { useEffect, useMemo, useState } from "react";
import { listReporte, type ReportRow } from "./reporteService";

/* ============ utils ============ */
const fmtMoney = (n?: number | null) =>
  Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pct = (paid: number, goal: number) => (goal > 0 ? Math.min(100, Math.round((paid / goal) * 100)) : 0);

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
        r.cliente_documento ?? "", r.primer_nombre ?? "", r.primer_apellido ?? "",
        r.cliente_email ?? "", r.cliente_phone ?? ""
      ].some(v => String(v).toLowerCase().includes(term));
    });
  }, [rows, q, estado, tipo, modelo]);

  /* KPIs */
  const kpis = useMemo(() => {
    const total = filtered.length;
    const sep = filtered.filter(r => r.estado.toLowerCase() === "separado").length;
    const res = filtered.filter(r => r.estado.toLowerCase() === "reservado").length;

    const sum = (arr: number[]) => arr.reduce((a, b) => a + Number(b || 0), 0);
    const totalPagado = sum(filtered.map(r => r.reserva_pagado + r.inicial_pagado + r.final_pagado));
    const totalObjetivo =
      sum(filtered.map(r => r.reserva_objetivo)) +
      sum(filtered.map(r => r.inicial_objetivo)) +
      sum(filtered.map(r => r.final_objetivo));
    const totalRestante = Math.max(0, totalObjetivo - totalPagado);

    return { total, sep, res, totalPagado, totalRestante };
  }, [filtered]);

  return (
    <div className="mx-auto max-w-[95rem] p-4 space-y-6">
      {/* Header + filtros */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div>
            <h2 className="text-xl font-semibold">Reportes</h2>
            <p className="text-sm text-gray-500">Vista integral de reservas, clientes, documentos y pagos por etapa.</p>
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

        {/* KPIs */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <KPI title="Total casos" value={String(kpis.total)} />
          <KPI title="Separados" value={String(kpis.sep)} tone="rose" />
          <KPI title="Reservados" value={String(kpis.res)} tone="amber" />
          <KPI
            title="Pagado / Restante"
            value={`$ ${fmtMoney(kpis.totalPagado)}`}
            sub={`Restante $ ${fmtMoney(kpis.totalRestante)}`}
            tone="emerald"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-gray-500">Cargando…</p>
        ) : err ? (
          <p className="text-sm text-red-600">{err}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500">Sin resultados.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-[1600px] text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <Th>Etapa</Th>
                  <Th>Código</Th>
                  <Th>Modelo</Th>
                  <Th>Tipo</Th>
                  <Th right>Precio CUH</Th>
                  <Th>Partida</Th>
                  <Th>MZ</Th>
                  <Th>LT</Th>
                  <Th>Ubicación</Th>
                  <Th right>Área</Th>
                  <Th>Estado</Th>
                  <Th>Promotor</Th>
                  <Th>Cliente</Th>
                  <Th>Reserva</Th>
                  <Th>Docs</Th>
                  <Th>Pagos</Th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((r, i) => (
                  <tr key={r.reserva_id + i} className={r.estado.toLowerCase()==="separado" ? "bg-rose-50" : ""}>
                    {/* Propiedad */}
                    <Td>{r.etapa}</Td>
                    <Td mono>{r.codigo}</Td>
                    <Td>{r.modelo}</Td>
                    <Td>{r.tipo ? r.tipo[0].toUpperCase() + r.tipo.slice(1) : "—"}</Td>
                    <Td right>{fmtMoney(r.precio_cuh)}</Td>
                    <Td mono>{r.partida}</Td>
                    <Td>{r.mz}</Td>
                    <Td>{r.lt}</Td>
                    <Td>{r.ubicacion || "—"}</Td>
                    <Td right>{r.area != null ? r.area : "—"}</Td>

                    {/* Estado */}
                    <Td>{chipForEstado(r.estado)}</Td>

                    {/* Promotor */}
                    <Td>
                      {r.promotor ?? "—"}
                      <div className="text-[11px] text-gray-500">{r.promotor_email ?? "—"}</div>
                    </Td>

                    {/* Cliente */}
                    <Td>
                      <div className="font-medium">
                        {r.primer_nombre} {r.primer_apellido}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {r.cliente_documento || "—"} · {r.cliente_phone || "—"}
                      </div>
                      <div className="text-[11px] text-gray-500">{r.cliente_email || "—"}</div>
                    </Td>

                    {/* Reserva meta (monto y vencimiento) */}
                    <Td>
                      <div className="whitespace-nowrap text-xs">
                        Obj: $ {fmtMoney(r.required_amount)}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {r.expires_at ? `Expira: ${new Date(r.expires_at).toLocaleString()}` : "—"}
                      </div>
                    </Td>

                    {/* Docs */}
                    <Td>
                      <DocsRow dni={r.dni_url} a1={r.anexo1_url} a2={r.anexoA2_url} />
                    </Td>

                    {/* Pagos por etapa (mini tarjetas con progress) */}
                    <Td className="min-w-[380px]">
                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-2">
                        <StageMini
                          title="Reserva"
                          paid={r.reserva_pagado}
                          goal={r.reserva_objetivo}
                          tone="emerald"
                        />
                        <StageMini
                          title="Inicial"
                          paid={r.inicial_pagado}
                          goal={r.inicial_objetivo}
                          tone="sky"
                        />
                        <StageMini
                          title="Final"
                          paid={r.final_pagado}
                          goal={r.final_objetivo}
                          tone="violet"
                        />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ subcomponentes ============ */

function KPI({
  title, value, sub, tone = "slate",
}: { title: string; value: string; sub?: string; tone?: "slate" | "rose" | "amber" | "emerald"; }) {
  const bg =
    tone === "rose" ? "bg-rose-50 border-rose-200" :
    tone === "amber" ? "bg-amber-50 border-amber-200" :
    tone === "emerald" ? "bg-emerald-50 border-emerald-200" :
    "bg-slate-50 border-slate-200";
  const txt =
    tone === "rose" ? "text-rose-900" :
    tone === "amber" ? "text-amber-900" :
    tone === "emerald" ? "text-emerald-900" :
    "text-slate-900";
  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <div className="text-xs text-gray-600">{title}</div>
      <div className={`text-2xl font-semibold ${txt}`}>{value}</div>
      {sub && <div className="text-xs text-gray-600 mt-1">{sub}</div>}
    </div>
  );
}

function DocsRow({ dni, a1, a2 }: { dni: string | null; a1: string | null; a2: string | null; }) {
  const LinkOrDash = ({ url, label }: { url: string | null; label: string }) =>
    url ? <a className="text-blue-600 underline" href={url} target="_blank" rel="noreferrer">{label}</a> : <span className="text-gray-400">—</span>;
  return (
    <div className="flex items-center gap-3 text-xs">
      <div><LinkOrDash url={dni} label="DNI" /></div>
      <div><LinkOrDash url={a1} label="Anexo 1" /></div>
      <div><LinkOrDash url={a2} label="Anexo A2" /></div>
    </div>
  );
}

function StageMini({
  title, paid, goal, tone,
}: { title: string; paid: number; goal: number; tone: "emerald" | "sky" | "violet"; }) {
  const p = pct(paid, goal);
  const bar =
    tone === "emerald" ? "bg-emerald-500" :
    tone === "sky"     ? "bg-sky-500" :
                         "bg-violet-500";
  const chip =
    goal > 0 && paid >= goal ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700";
  return (
    <div className="rounded-lg border p-2">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-medium">{title}</span>
        <span className={`rounded px-1.5 py-0.5 ${chip}`}>{p}%</span>
      </div>
      <div className="mt-2 h-1.5 w-full rounded bg-gray-100">
        <div className={`h-1.5 rounded ${bar}`} style={{ width: `${p}%` }} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-gray-600">
        <div>
          <div className="text-[10px]">Pagado</div>
          <div className="font-medium">$ {fmtMoney(paid)}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px]">Objetivo</div>
          <div className="font-medium">$ {fmtMoney(goal)}</div>
        </div>
      </div>
    </div>
  );
}

/* FIX: ahora acepta right */
function Th({ children, right = false }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`px-3 py-2 font-medium ${right ? "text-right" : ""}`}>{children}</th>;
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

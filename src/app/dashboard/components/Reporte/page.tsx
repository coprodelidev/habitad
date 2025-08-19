"use client";

import React, { useEffect, useMemo, useState } from "react";
import { listReporte, type ReportRow } from "./reporteService";

function fmtMoney(n?: number | null) {
  const x = Number(n ?? 0);
  return x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ReportePage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

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

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(r =>
      [
        r.codigo, r.modelo, r.partida, String(r.mz), String(r.lt),
        r.ubicacion ?? "", r.estado, r.promotor ?? "", r.promotor_email ?? "",
        r.cliente_documento ?? "", r.primer_nombre ?? "", r.primer_apellido ?? "",
      ].some(v => String(v).toLowerCase().includes(term))
    );
  }, [rows, q]);

  return (
    <div className="mx-auto max-w-[95rem] p-4 space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Reportes</h2>
            <p className="text-sm text-gray-500">Resumen integral de reservas, clientes y documentos.</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por código, cliente, promotor…"
              className="rounded border px-3 py-2 text-sm w-72"
            />
            <button
              onClick={() => location.reload()}
              className="rounded bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-gray-500">Cargando…</p>
        ) : err ? (
          <p className="text-sm text-red-600">{err}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500">Sin resultados.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-[1400px] text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <Th>etapa</Th>
                  <Th>codigo</Th>
                  <Th>modelo</Th>
                  <Th>precio cuh</Th>
                  <Th>partida</Th>
                  <Th>MZ</Th>
                  <Th>LT</Th>
                  <Th>ubicación</Th>
                  <Th>área</Th>
                  <Th>promotor</Th>
                  <Th>geo</Th>
                  <Th>estado</Th>
                  <Th>promotor</Th>
                  <Th>cliente Documento identidad</Th>
                  <Th>Primer nombre</Th>
                  <Th>Segundo nombre</Th>
                  <Th>Primer apellido</Th>
                  <Th>Segundo apellido</Th>
                  <Th>Propiedad</Th>
                  <Th>DNI (PDF)</Th>
                  <Th>Anexo 1</Th>
                  <Th>Anexo A2</Th>
                  <Th>Cuotas iniciales</Th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <Td>{r.etapa}</Td>
                    <Td mono>{r.codigo}</Td>
                    <Td>{r.modelo}</Td>
                    <Td right>{fmtMoney(r.precio_cuh)}</Td>
                    <Td mono>{r.partida}</Td>
                    <Td>{r.mz}</Td>
                    <Td>{r.lt}</Td>
                    <Td>{r.ubicacion ?? "—"}</Td>
                    <Td right>{r.area != null ? r.area : "—"}</Td>

                    <Td>
                      {r.promotor ?? "—"}
                      <div className="text-[11px] text-gray-500">{r.promotor_email ?? "—"}</div>
                    </Td>

                    <Td>{r.geo ?? "—"}</Td>
                    <Td>{r.estado}</Td>

                    <Td>{r.promotor_email ?? "—"}</Td>

                    <Td mono>{r.cliente_documento ?? "—"}</Td>
                    <Td>{r.primer_nombre || "—"}</Td>
                    <Td>{r.segundo_nombre || "—"}</Td>
                    <Td>{r.primer_apellido || "—"}</Td>
                    <Td>{r.segundo_apellido || "—"}</Td>

                    <Td mono>{r.propiedad}</Td>

                    <Td>
                      {r.dni_url ? (
                        <a className="text-blue-600 underline" href={r.dni_url} target="_blank" rel="noreferrer">Ver</a>
                      ) : "—"}
                    </Td>
                    <Td>
                      {r.anexo1_url ? (
                        <a className="text-blue-600 underline" href={r.anexo1_url} target="_blank" rel="noreferrer">Ver</a>
                      ) : "—"}
                    </Td>
                    <Td>
                      {r.anexoA2_url ? (
                        <a className="text-blue-600 underline" href={r.anexoA2_url} target="_blank" rel="noreferrer">Ver</a>
                      ) : "—"}
                    </Td>

                    <Td>
                      <div className="whitespace-nowrap">
                        $ {fmtMoney(r.cuotas_pagado)} / $ {fmtMoney(r.cuotas_objetivo)}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Restante: $ {fmtMoney(r.cuotas_restante)}
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

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 font-medium">{children}</th>;
}

function Td({
  children, mono, right,
}: { children: React.ReactNode; mono?: boolean; right?: boolean }) {
  return (
    <td className={`px-3 py-2 ${mono ? "font-mono" : ""} ${right ? "text-right" : ""}`}>
      {children}
    </td>
  );
}

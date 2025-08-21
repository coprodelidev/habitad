"use client";

import React, { useEffect, useMemo, useState } from "react";
import { listPagosDetallado, type PaymentReportRow, fmtMoney, fmtDateTime } from "../Reporte/reportePagosService";
import DownloadButtons from "./DownloadButtons";
import type { Header } from "./exportUtils";

type Stage = "reserva" | "inicial" | "final" | "";

export default function PaymentsByStageTable() {
  const [rows, setRows] = useState<PaymentReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>(""); // filtro
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await listPagosDetallado();
        setRows(data);
      } catch (e: any) {
        setErr(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const byStage = stage ? rows.filter(r => r.stage === stage) : rows;
    const term = q.trim().toLowerCase();
    if (!term) return byStage;
    return byStage.filter(r => {
      const s = [
        r.stage, r.cliente_nombre, r.codigo, r.modelo, r.promotor_nombre, r.reserva_estado
      ].filter(Boolean).join(" ").toLowerCase();
      return s.includes(term);
    });
  }, [rows, stage, q]);

  const headers: Header[] = [
    { key: "stage", label: "Etapa de pago" },
    { key: "pago_fecha", label: "Fecha" },
    { key: "monto", label: "Monto" },
    { key: "cliente_nombre", label: "Cliente" },
    { key: "codigo", label: "Código CUH" },
    { key: "modelo", label: "Modelo" },
    { key: "reserva_estado", label: "Estado reserva" },
    { key: "promotor_nombre", label: "Promotor" },
    { key: "reserva_id", label: "Reserva ID" },
    { key: "pago_id", label: "Pago ID" },
  ];

  const exportRows = filtered.map(r => ({
    ...r,
    pago_fecha: fmtDateTime(r.pago_fecha),
    monto: Number(r.monto ?? 0),
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as Stage)}
            className="rounded border px-2 py-2 text-sm"
          >
            <option value="">Todas las etapas</option>
            <option value="reserva">Reserva</option>
            <option value="inicial">Inicial</option>
            <option value="final">Final</option>
          </select>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar (cliente, CUH, promotor)…"
            className="rounded border px-3 py-2 text-sm w-64"
          />
        </div>
        <DownloadButtons filename="reporte_pagos_por_etapa" headers={headers} rows={exportRows} />
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Cargando…</p>
      ) : err ? (
        <p className="text-sm text-red-600">{err}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500">Sin resultados.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-[1100px] text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <Th>Etapa de pago</Th>
                <Th>Fecha</Th>
                <Th right>Monto</Th>
                <Th>Cliente</Th>
                <Th>CUH</Th>
                <Th>Modelo</Th>
                <Th>Estado reserva</Th>
                <Th>Promotor</Th>
                <Th>Reserva ID</Th>
                <Th>Pago ID</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(r => (
                <tr key={r.pago_id}>
                  <Td>{r.stage}</Td>
                  <Td>{fmtDateTime(r.pago_fecha)}</Td>
                  <Td right className="font-medium">{fmtMoney(r.monto)}</Td>
                  <Td>{r.cliente_nombre}</Td>
                  <Td mono>{r.codigo}</Td>
                  <Td>{r.modelo}</Td>
                  <Td>{r.reserva_estado}</Td>
                  <Td>{r.promotor_nombre ?? "—"}</Td>
                  <Td mono>{r.reserva_id}</Td>
                  <Td mono>{r.pago_id}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* Helpers de celdas */
function Th({
  children,
  right = false,
  className = "",
}: {
  children: React.ReactNode;
  right?: boolean;
  className?: string;
}) {
  return (
    <th className={`px-3 py-2 font-medium ${right ? "text-right" : "text-left"} ${className}`}>
      {children}
    </th>
  );
}

function Td({
  children,
  mono,
  right,
  className = "",
}: {
  children: React.ReactNode;
  mono?: boolean;
  right?: boolean;
  className?: string;
}) {
  return (
    <td className={`px-3 py-2 ${mono ? "font-mono" : ""} ${right ? "text-right" : ""} ${className}`}>
      {children}
    </td>
  );
}

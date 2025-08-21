"use client";

import React, { useEffect, useMemo, useState } from "react";
import { listPagosDetallado, type PaymentReportRow, fmtMoney, fmtDateTime } from "../Reporte/reportePagosService";
import DownloadButtons from "./DownloadButtons";
import type { Header } from "./exportUtils";

export default function PaymentsGeneralTable() {
  const [rows, setRows] = useState<PaymentReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
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
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(r => {
      const haystack = [
        r.cliente_nombre, r.cliente_documento, r.cliente_email, r.cliente_phone,
        r.codigo, r.modelo, String(r.etapa_cuh), String(r.mz), String(r.lt), r.partida,
        r.promotor_nombre, r.promotor_email, r.reserva_estado, r.stage,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [rows, q]);

  const headers: Header[] = [
    { key: "pago_fecha", label: "Fecha" },
    { key: "cliente_nombre", label: "Cliente" },
    { key: "cliente_documento", label: "Documento" },
    { key: "cliente_email", label: "Email" },
    { key: "cliente_phone", label: "Teléfono" },
    { key: "codigo", label: "Código CUH" },
    { key: "modelo", label: "Modelo" },
    { key: "etapa_cuh", label: "Etapa" },
    { key: "mz", label: "MZ" },
    { key: "lt", label: "LT" },
    { key: "partida", label: "Partida" },
    { key: "stage", label: "Etapa de pago" },
    { key: "monto", label: "Monto" },
    { key: "reserva_estado", label: "Estado reserva" },
    { key: "promotor_nombre", label: "Promotor" },
    { key: "promotor_email", label: "Promotor Email" },
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar (cliente, CUH, promotor, email, etc.)…"
            className="rounded border px-3 py-2 text-sm w-80"
          />
        </div>
        <DownloadButtons filename="reporte_general_pagos" headers={headers} rows={exportRows} />
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Cargando…</p>
      ) : err ? (
        <p className="text-sm text-red-600">{err}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500">Sin resultados.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-[1300px] text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <Th>Fecha</Th>
                <Th>Cliente</Th>
                <Th>Doc</Th>
                <Th>Email</Th>
                <Th>Teléfono</Th>
                <Th>CUH</Th>
                <Th>Modelo</Th>
                <Th>Etapa</Th>
                <Th>MZ</Th>
                <Th>LT</Th>
                <Th>Partida</Th>
                <Th>Etapa de pago</Th>
                <Th right>Monto</Th>
                <Th>Estado reserva</Th>
                <Th>Promotor</Th>
                <Th>Promotor Email</Th>
                <Th>Reserva ID</Th>
                <Th>Pago ID</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((r) => (
                <tr key={r.pago_id}>
                  <Td>{fmtDateTime(r.pago_fecha)}</Td>
                  <Td>{r.cliente_nombre}</Td>
                  <Td mono>{r.cliente_documento ?? "—"}</Td>
                  <Td>{r.cliente_email ?? "—"}</Td>
                  <Td>{r.cliente_phone ?? "—"}</Td>
                  <Td mono>{r.codigo}</Td>
                  <Td>{r.modelo}</Td>
                  <Td>{r.etapa_cuh}</Td>
                  <Td>{r.mz}</Td>
                  <Td>{r.lt}</Td>
                  <Td mono>{r.partida}</Td>
                  <Td>{r.stage}</Td>
                  <Td right className="font-medium">{fmtMoney(r.monto)}</Td>
                  <Td>{r.reserva_estado}</Td>
                  <Td>{r.promotor_nombre ?? "—"}</Td>
                  <Td>{r.promotor_email ?? "—"}</Td>
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

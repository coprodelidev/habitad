"use client";

import React, { useEffect, useMemo, useState } from "react";
import { listPagosDetallado, type PaymentReportRow, fmtMoney, fmtDateTime } from "../Reporte/reportePagosService";
import DownloadButtons from "./DownloadButtons";
import type { Header } from "./exportUtils";

export default function PaymentsByPersonTable() {
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
        // Orden: persona asc, fecha desc
        data.sort((a, b) => {
          const nA = (a.cliente_nombre || "").localeCompare(b.cliente_nombre || "");
          if (nA !== 0) return nA;
          return new Date(b.pago_fecha).getTime() - new Date(a.pago_fecha).getTime();
        });
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
      const s = [
        r.cliente_nombre, r.cliente_documento, r.cliente_email, r.cliente_phone,
        r.codigo, r.modelo, r.stage, r.promotor_nombre
      ].filter(Boolean).join(" ").toLowerCase();
      return s.includes(term);
    });
  }, [rows, q]);

  const headers: Header[] = [
    { key: "cliente_nombre", label: "Cliente" },
    { key: "cliente_documento", label: "Documento" },
    { key: "cliente_email", label: "Email" },
    { key: "cliente_phone", label: "Teléfono" },
    { key: "pago_fecha", label: "Fecha" },
    { key: "stage", label: "Etapa de pago" },
    { key: "monto", label: "Monto" },
    { key: "codigo", label: "Código CUH" },
    { key: "modelo", label: "Modelo" },
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
      <div className="flex items-center justify-between gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por cliente, documento, email…"
          className="rounded border px-3 py-2 text-sm w-80"
        />
        <DownloadButtons filename="reporte_pagos_por_persona" headers={headers} rows={exportRows} />
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
                <Th>Cliente</Th>
                <Th>Doc</Th>
                <Th>Email</Th>
                <Th>Teléfono</Th>
                <Th>Fecha</Th>
                <Th>Etapa de pago</Th>
                <Th right>Monto</Th>
                <Th>CUH</Th>
                <Th>Modelo</Th>
                <Th>Promotor</Th>
                <Th>Reserva ID</Th>
                <Th>Pago ID</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(r => (
                <tr key={r.pago_id}>
                  <Td>{r.cliente_nombre}</Td>
                  <Td mono>{r.cliente_documento ?? "—"}</Td>
                  <Td>{r.cliente_email ?? "—"}</Td>
                  <Td>{r.cliente_phone ?? "—"}</Td>
                  <Td>{fmtDateTime(r.pago_fecha)}</Td>
                  <Td>{r.stage}</Td>
                  <Td right className="font-medium">{fmtMoney(r.monto)}</Td>
                  <Td mono>{r.codigo}</Td>
                  <Td>{r.modelo}</Td>
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

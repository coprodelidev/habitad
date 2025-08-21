// src/app/dashboard/components/recent/RecentReservasTable.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { listRecentReservas, type RecentRow } from "./recentReservasService";

const fmtMoney = (n?: number | null) =>
  Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function humanizeDelta(ms: number): string {
  const abs = Math.abs(ms);
  const m = Math.floor(abs / 60000);
  const h = Math.floor(abs / 3600000);
  const d = Math.floor(abs / 86400000);

  const suffix = ms < 0 ? " (vencido)" : "";
  if (d >= 1) return `${d} d${suffix}`;
  if (h >= 1) return `${h} h${suffix}`;
  return `${m} min${suffix}`;
}

export default function RecentReservasTable() {
  const [rows, setRows] = useState<RecentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await listRecentReservas(10);
        setRows(data);
      } catch (e: any) {
        setErr(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const now = useMemo(() => Date.now(), [rows.length]);

  return (
    <section className="mt-6">
      <h3 className="mb-3 text-lg font-semibold">Últimas reservas (máx. 10)</h3>

      {err && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-[1200px] text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <Th>Codigo ▲</Th>
           
              <Th right>Precio CUH ↕</Th>
              <Th right>Precio promotor ↕</Th>
              <Th>Estado ↕</Th>
              <Th right>Monto reserva↕</Th>
              <Th>Vence ↕</Th>
              <Th>Expira en</Th>
              <Th>Promotor</Th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td className="px-3 py-3 text-gray-500" colSpan={11}>Cargando…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-gray-500" colSpan={11}>Sin registros.</td>
              </tr>
            ) : (
              rows.map((r) => {
                const venceStr = r.vence ? new Date(r.vence).toLocaleString() : "—";
                const expiraEn =
                  r.vence ? humanizeDelta(new Date(r.vence).getTime() - now) : "—";
                return (
                  <tr key={r.reserva_id} className="hover:bg-gray-50">
                    <Td mono>{r.codigo}</Td>
                  
                    <Td right>$ {fmtMoney(r.precio_cuh)}</Td>
                    <Td right>{r.precio_promotor != null ? `$ ${fmtMoney(r.precio_promotor)}` : "—"}</Td>
                    <Td>
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-gray-700">
                        {r.estado}
                      </span>
                    </Td>
                    <Td right>{r.obj_reserva != null ? `$ ${fmtMoney(r.obj_reserva)}` : "—"}</Td>
                    <Td>{venceStr}</Td>
                    <Td>{expiraEn}</Td>
                    <Td>{r.promotor || "—"}</Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ---- helpers UI ---- */
function Th({ children, right = false }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`px-3 py-2 font-medium ${right ? "text-right" : "text-left"}`}>{children}</th>;
}
function Td({
  children, mono, right = false,
}: { children: React.ReactNode; mono?: boolean; right?: boolean }) {
  return (
    <td className={`px-3 py-2 ${mono ? "font-mono" : ""} ${right ? "text-right" : ""}`}>
      {children}
    </td>
  );
}

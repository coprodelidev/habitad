"use client";

import React, { useState } from "react";
import PaymentsGeneralTable from "../Reporte/PaymentsGeneralTable";
import PaymentsByPersonTable from "../Reporte/PaymentsByPersonTable";
import PaymentsByStageTable from "../Reporte/PaymentsByStageTable";

type TabKey = "general" | "persona" | "etapa";

const TABS: { key: TabKey; label: string }[] = [
  { key: "general", label: "General de pagos" },
  { key: "persona", label: "Pagos por persona" },
  { key: "etapa",   label: "Pagos por etapa" },
];

export default function ReportesPagosPage() {
  const [tab, setTab] = useState<TabKey>("general");

  return (
    <div className="mx-auto max-w-[95rem] p-4 space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Reportes de Pagos</h2>
        <p className="text-sm text-gray-500">
          Vistas de pagos: general, por persona y por etapa. Exporta CSV/XLS desde cada pestaña.
        </p>

        {/* Tabs */}
        <div className="mt-4 flex gap-2 border-b">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm border-b-2 -mb-px ${
                tab === t.key ? "border-blue-600 text-blue-600 font-semibold" : "border-transparent text-gray-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        {tab === "general" && <PaymentsGeneralTable />}
        {tab === "persona" && <PaymentsByPersonTable />}
        {tab === "etapa"   && <PaymentsByStageTable />}
      </div>
    </div>
  );
}

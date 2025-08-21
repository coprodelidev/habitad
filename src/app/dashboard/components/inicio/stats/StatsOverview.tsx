// src/app/dashboard/components/stats/StatsOverview.tsx
"use client";

import React, { useEffect, useState } from "react";
import { fetchCounts, type Counts } from "./statsService";
import { Users, Home, CheckCircle, RefreshCw, DollarSign } from "lucide-react";

type CardProps = {
  title: string;
  value: number | string;
  bg: string;
  icon?: React.ReactNode;
  loading?: boolean;
};

const fmtMoney = (n?: number | null) =>
  Number(n ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function StatCard({ title, value, bg, icon, loading }: CardProps) {
  return (
    <div className={`rounded-2xl ${bg} p-6 text-white shadow-lg transition-all hover:shadow-xl`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm font-semibold tracking-wide opacity-90 mb-1">
            {title}
          </div>
          <div className="mt-2 text-3xl font-bold">
            {loading ? "—" : value}
          </div>
        </div>
        {icon ? <div className="bg-white bg-opacity-20 p-3 rounded-full">{icon}</div> : null}
      </div>
    </div>
  );
}

export default function StatsOverview() {
  const [counts, setCounts] = useState<Counts>({
    clientes: 0,
    oferta: 0,
    activas: 0,
    recaudado: 0,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const c = await fetchCounts();
      setCounts(c);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="mb-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Resumen General</h2>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          aria-label="Actualizar métricas"
        >
          {loading ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Actualizando...
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              Actualizar
            </>
          )}
        </button>
      </div>

      {err && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Error: {err}
        </div>
      )}

      {/* Responsive: 1 col en móvil, 2 en md si prefieres, 4 en lg */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="USUARIOS REGISTRADOS"
          value={counts.clientes}
          bg="bg-gradient-to-r from-purple-600 to-indigo-700"
          icon={<Users size={24} />}
          loading={loading}
        />
        <StatCard
          title="PROPIEDADES DISPONIBLES"
          value={counts.oferta}
          bg="bg-gradient-to-r from-emerald-500 to-green-600"
          icon={<Home size={24} />}
          loading={loading}
        />
        <StatCard
          title="PROPIEDADES RESERVADAS"
          value={counts.activas}
          bg="bg-gradient-to-r from-blue-500 to-cyan-600"
          icon={<CheckCircle size={24} />}
          loading={loading}
        />
        <StatCard
          title="TOTAL RECAUDADO"
          value={`$ ${fmtMoney(counts.recaudado)}`}
          bg="bg-gradient-to-r from-amber-500 to-orange-600"
          icon={<DollarSign size={24} />}
          loading={loading}
        />
      </div>
    </section>
  );
}

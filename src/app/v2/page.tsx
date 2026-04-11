'use client';

import { useEffect, useState } from 'react';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { useV2User } from '@/lib/v2/useV2User';
import { formatMoney } from '@/lib/v2/format';

interface Metricas {
  propiedadesLibres: number;
  propiedadesSeparadas: number;
  propiedadesOcupadas: number;
  propiedadesBloqueadas: number;
  ventasActivas: number;
  separacionesVigentes: number;
  recaudacionUSD: number;
  recaudacionPEN: number;
}

export default function V2Home() {
  const { user } = useV2User();
  const [m, setM] = useState<Metricas | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [props, ventas, pagos] = await Promise.all([
          supabaseV2.from('propiedades').select('estado_fisico'),
          supabaseV2.from('ventas').select('estado, fecha_vencimiento_separacion'),
          supabaseV2.from('pagos').select('monto, moneda, estado'),
        ]);
        if (props.error) throw props.error;
        if (ventas.error) throw ventas.error;
        if (pagos.error) throw pagos.error;

        const propList = (props.data ?? []) as { estado_fisico: string }[];
        const ventasList = (ventas.data ?? []) as { estado: string; fecha_vencimiento_separacion: string }[];
        const pagosList = (pagos.data ?? []) as { monto: number; moneda: string; estado: string }[];

        const now = Date.now();
        setM({
          propiedadesLibres: propList.filter((p) => p.estado_fisico === 'libre').length,
          propiedadesSeparadas: propList.filter((p) => p.estado_fisico === 'separado').length,
          propiedadesOcupadas: propList.filter((p) => p.estado_fisico === 'ocupado').length,
          propiedadesBloqueadas: propList.filter((p) => p.estado_fisico === 'bloqueado').length,
          ventasActivas: ventasList.filter((v) => ['separacion', 'inicial', 'cuotas'].includes(v.estado)).length,
          separacionesVigentes: ventasList.filter(
            (v) => v.estado === 'separacion' && new Date(v.fecha_vencimiento_separacion).getTime() > now,
          ).length,
          recaudacionUSD: pagosList
            .filter((p) => p.estado !== 'anulado' && p.moneda === 'USD')
            .reduce((a, b) => a + Number(b.monto), 0),
          recaudacionPEN: pagosList
            .filter((p) => p.estado !== 'anulado' && p.moneda === 'PEN')
            .reduce((a, b) => a + Number(b.monto), 0),
        });
      } catch (e: any) {
        setError(e?.message ?? String(e));
      }
    })();
  }, []);

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Bienvenido{user?.firstName ? `, ${user.firstName}` : ''}
        </h1>
        <p className="text-sm text-slate-500">Panel general de Habitad 2.0</p>
      </header>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Error cargando métricas: {error}
        </div>
      )}

      {!m ? (
        <div className="text-slate-500">Cargando métricas…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card title="Libres" value={m.propiedadesLibres} tone="green" />
          <Card title="Separadas" value={m.propiedadesSeparadas} tone="yellow" />
          <Card title="Ocupadas" value={m.propiedadesOcupadas} tone="red" />
          <Card title="Bloqueadas" value={m.propiedadesBloqueadas} tone="blue" />
          <Card title="Ventas activas" value={m.ventasActivas} tone="indigo" />
          <Card title="Separaciones vigentes" value={m.separacionesVigentes} tone="indigo" />
          <Card title="Recaudación USD" value={formatMoney(m.recaudacionUSD, 'USD')} tone="slate" />
          <Card title="Recaudación PEN" value={formatMoney(m.recaudacionPEN, 'PEN')} tone="slate" />
        </div>
      )}
    </div>
  );
}

function Card({ title, value, tone }: { title: string; value: number | string; tone: string }) {
  const tones: Record<string, string> = {
    green: 'border-green-200 bg-green-50 text-green-900',
    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-900',
    red: 'border-red-200 bg-red-50 text-red-900',
    blue: 'border-sky-200 bg-sky-50 text-sky-900',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-900',
    slate: 'border-slate-200 bg-white text-slate-900',
  };
  return (
    <div className={`rounded-lg border px-4 py-3 ${tones[tone] ?? tones.slate}`}>
      <div className="text-xs font-medium uppercase tracking-wide opacity-70">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

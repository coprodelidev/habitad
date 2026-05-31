'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { loadVentaBundle, type VentaBundle } from '../../_utils/loadVenta';
import { formatDate, formatMoney } from '@/lib/v2/format';
import { usePlantilla, PrintHeader, PrintFooter } from '@/components/v2/PrintTemplate';

export default function CronogramaPage() {
  const { id } = useParams<{ id: string }>();
  const [b, setB] = useState<VentaBundle | null>(null);
  const plantilla = usePlantilla('plantilla_contrato');

  useEffect(() => {
    if (id) loadVentaBundle(id).then(setB);
  }, [id]);

  if (!b) return <div>Cargando…</div>;
  const { venta, propiedad, cliente, cuotas } = b;

  const total = cuotas.reduce((a, c) => a + Number(c.monto), 0);

  return (
    <div className="space-y-5 text-sm">
      <PrintHeader plantilla={plantilla} />
      <div className="border-b-2 border-slate-900 pb-3">
        <h1 className="text-2xl font-bold">Cronograma de Pagos</h1>
        <div className="mt-1 text-xs text-slate-600">
          Cliente: {cliente.nombres} {cliente.apellidos} · DNI {cliente.dni}
        </div>
        <div className="text-xs text-slate-600">
          Inmueble: CUH {propiedad.cuh} · Mz {propiedad.manzana ?? '—'} / Lt {propiedad.lote ?? '—'}
        </div>
      </div>

      <table className="min-w-full border border-slate-300 text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="border px-3 py-2 text-left">N°</th>
            <th className="border px-3 py-2 text-left">Vencimiento</th>
            <th className="border px-3 py-2 text-right">Monto</th>
            <th className="border px-3 py-2 text-right">Pagado</th>
            <th className="border px-3 py-2 text-left">Estado</th>
          </tr>
        </thead>
        <tbody>
          {cuotas.map((c) => (
            <tr key={c.id}>
              <td className="border px-3 py-1.5">{c.numero}</td>
              <td className="border px-3 py-1.5">{formatDate(c.fecha_vencimiento)}</td>
              <td className="border px-3 py-1.5 text-right">{formatMoney(c.monto, c.moneda)}</td>
              <td className="border px-3 py-1.5 text-right">{formatMoney(c.monto_pagado, c.moneda)}</td>
              <td className="border px-3 py-1.5 capitalize">{c.estado}</td>
            </tr>
          ))}
          <tr className="bg-slate-50 font-semibold">
            <td colSpan={2} className="border px-3 py-2 text-right">Total</td>
            <td className="border px-3 py-2 text-right">{formatMoney(total, venta.moneda)}</td>
            <td colSpan={2} className="border" />
          </tr>
        </tbody>
      </table>

      <p className="text-xs text-slate-500">
        Los pagos mayores al monto de la cuota del mes se registran como saldo a favor y se aplican
        automáticamente a la siguiente cuota vencida.
      </p>

      <PrintFooter plantilla={plantilla} />
    </div>
  );
}

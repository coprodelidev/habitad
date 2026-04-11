'use client';

import type { Venta, Propiedad, Cliente, Pago, SaldoVenta } from '@/lib/v2/types';
import { formatDate, formatDateTime, formatMoney } from '@/lib/v2/format';

export function ResumenTab({
  venta,
  propiedad,
  cliente,
  saldos,
  pagos,
}: {
  venta: Venta;
  propiedad: Propiedad | null;
  cliente: Cliente | null;
  saldos: SaldoVenta | null;
  pagos: Pago[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card title="Propiedad">
        <Row k="CUH" v={propiedad?.cuh} />
        <Row k="Mz / Lt" v={`${propiedad?.manzana ?? '—'} / ${propiedad?.lote ?? '—'}`} />
        <Row k="Tipo" v={propiedad?.tipo} />
        <Row k="Modelo" v={propiedad?.modelo ?? '—'} />
        <Row k="Área" v={propiedad?.area_m2 ? `${propiedad?.area_m2} m²` : '—'} />
        <Row k="Precio lista" v={formatMoney(propiedad?.precio_lista ?? 0, propiedad?.moneda ?? 'USD')} />
      </Card>

      <Card title="Cliente">
        <Row k="Nombres" v={cliente?.nombres} />
        <Row k="Apellidos" v={cliente?.apellidos} />
        <Row k="DNI" v={cliente?.dni} />
        <Row k="Teléfono" v={cliente?.telefono ?? '—'} />
        <Row k="Email" v={cliente?.email ?? '—'} />
      </Card>

      <Card title="Fechas">
        <Row k="Separación" v={formatDateTime(venta.fecha_separacion)} />
        <Row k="Vencimiento sep." v={formatDateTime(venta.fecha_vencimiento_separacion)} />
        <Row k="Pago separación" v={formatDateTime(venta.fecha_pago_separacion)} />
        <Row k="Límite inicial" v={formatDate(venta.fecha_limite_inicial)} />
        <Row k="Inicial completa" v={formatDateTime(venta.fecha_inicial_completa)} />
        <Row k="Contrato" v={formatDate(venta.fecha_contrato)} />
      </Card>

      <Card title="Saldos">
        <Row k="Precio acordado" v={formatMoney(venta.precio_acordado, venta.moneda)} highlight />
        <Row k="Total separación" v={formatMoney(saldos?.total_separacion ?? 0, venta.moneda)} />
        <Row k="Total inicial" v={formatMoney(saldos?.total_inicial ?? 0, venta.moneda)} />
        <Row k="Total cuotas" v={formatMoney(saldos?.total_cuotas ?? 0, venta.moneda)} />
        <Row k="Total pagado" v={formatMoney(saldos?.total_pagado ?? 0, venta.moneda)} highlight />
        <Row k="Saldo pendiente" v={formatMoney(saldos?.saldo_pendiente ?? 0, venta.moneda)} />
        <Row k="Saldo a favor" v={formatMoney(saldos?.saldo_favor ?? 0, venta.moneda)} />
      </Card>

      <Card title="Pagos registrados" full>
        {pagos.length === 0 ? (
          <div className="py-3 text-sm text-slate-500">Sin pagos registrados.</div>
        ) : (
          <table className="min-w-full text-xs">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-1">Fecha</th>
                <th className="py-1">Tipo</th>
                <th className="py-1">Nº op.</th>
                <th className="py-1">Banco</th>
                <th className="py-1 text-right">Monto</th>
                <th className="py-1">Estado</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="py-1">{formatDate(p.fecha_deposito)}</td>
                  <td className="py-1 capitalize">{p.tipo}{p.cuota_numero ? ` #${p.cuota_numero}` : ''}</td>
                  <td className="py-1 font-mono">{p.numero_operacion ?? '—'}</td>
                  <td className="py-1">{p.banco ?? '—'}</td>
                  <td className="py-1 text-right">{formatMoney(p.monto, p.moneda)}</td>
                  <td className="py-1 capitalize">{p.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function Card({ title, children, full }: { title: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-4 ${full ? 'md:col-span-2' : ''}`}>
      <h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

function Row({ k, v, highlight }: { k: string; v: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-1 text-sm last:border-0">
      <span className="text-slate-500">{k}</span>
      <span className={`capitalize ${highlight ? 'font-semibold text-slate-900' : 'text-slate-800'}`}>{v ?? '—'}</span>
    </div>
  );
}

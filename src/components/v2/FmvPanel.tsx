'use client';

import type { Venta } from '@/lib/v2/types';

const ESTADO_LABELS: Record<string, { label: string; tone: string }> = {
  pendiente: { label: 'Pendiente', tone: 'bg-slate-100 text-slate-700' },
  pedir_cf: { label: 'Pedir CF al banco', tone: 'bg-amber-100 text-amber-800' },
  cf_desembolsado: { label: 'CF desembolsado', tone: 'bg-blue-100 text-blue-800' },
  beneficiario: { label: 'Beneficiario aprobado', tone: 'bg-emerald-100 text-emerald-800' },
  caducado: { label: 'Caducado', tone: 'bg-red-100 text-red-700' },
  rechazado: { label: 'Rechazado', tone: 'bg-red-100 text-red-700' },
};

const ORIGEN_LABELS: Record<string, string> = {
  cf: 'Crédito Financiero',
  recursos_propios: 'Recursos propios',
};

export function FmvPanel({ venta }: { venta: Venta }) {
  const tieneFmv =
    venta.fmv_precio != null ||
    venta.fmv_bono_real != null ||
    venta.fmv_abono_cliente != null ||
    venta.fmv_donacion_coprodeli != null ||
    venta.fmv_estado_expediente != null ||
    venta.modalidad_pago === 'bono_mivivienda';

  if (!tieneFmv) return null;

  const precio = Number(venta.fmv_precio ?? 0);
  const bono = Number(venta.fmv_bono_real ?? 0);
  const abono = Number(venta.fmv_abono_cliente ?? 0);
  const donacion = Number(venta.fmv_donacion_coprodeli ?? 0);
  const saldo = Number(venta.fmv_saldo ?? (precio - bono - abono - donacion));
  const estadoConfig = venta.fmv_estado_expediente ? ESTADO_LABELS[venta.fmv_estado_expediente] : null;

  const fmt = (n: number) =>
    n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-amber-900">Bono MiVivienda</h4>
        {estadoConfig && (
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${estadoConfig.tone}`}>
            {estadoConfig.label}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <FmvRow label="Precio FMV" value={precio > 0 ? fmt(precio) : '—'} />
        <FmvRow label="Bono real desembolsado" value={bono > 0 ? fmt(bono) : '—'} />
        <FmvRow label="Tu abono FMV" value={abono > 0 ? fmt(abono) : '—'} />
        <FmvRow label="Donación COPRODELI" value={donacion > 0 ? fmt(donacion) : '—'} />
        {venta.fmv_gastos_administrativos != null && (
          <FmvRow label="Gastos administrativos" value={fmt(Number(venta.fmv_gastos_administrativos))} />
        )}
        {venta.fmv_origen_bono && (
          <FmvRow label="Origen del bono" value={ORIGEN_LABELS[venta.fmv_origen_bono] ?? venta.fmv_origen_bono} />
        )}
        {venta.fmv_fecha_desembolso && (
          <FmvRow label="Fecha desembolso" value={new Date(venta.fmv_fecha_desembolso).toLocaleDateString('es-PE')} />
        )}
        {venta.mivivienda_fecha_beneficiario && (
          <FmvRow label="Calificado beneficiario" value={new Date(venta.mivivienda_fecha_beneficiario).toLocaleDateString('es-PE')} />
        )}
      </div>

      {(precio > 0 || saldo !== 0) && (
        <div className="mt-3 rounded border border-amber-300 bg-white p-3">
          <div className="flex items-center justify-between text-xs text-amber-800">
            <span>Saldo restante FMV</span>
            <span className={`text-base font-semibold ${Math.abs(saldo) < 1 ? 'text-emerald-700' : 'text-amber-900'}`}>
              {fmt(saldo)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function FmvRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded bg-white px-3 py-1.5">
      <span className="text-xs text-amber-800">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

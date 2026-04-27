'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { loadVentaBundle, type VentaBundle } from '../../_utils/loadVenta';
import type { Cliente, Pago } from '@/lib/v2/types';
import { formatDate, formatDateTime, formatMoney } from '@/lib/v2/format';

export default function HojaSeparacionPage() {
  const { id } = useParams<{ id: string }>();
  const [b, setB] = useState<VentaBundle | null>(null);

  useEffect(() => {
    if (id) loadVentaBundle(id).then(setB);
  }, [id]);

  if (!b) return <div>Cargando...</div>;
  const { venta, propiedad, cliente, pagos } = b;
  const pagosValidos = pagos.filter((p) => p.estado !== 'anulado');
  const totalPagado = pagosValidos.filter((p) => p.moneda === venta.moneda).reduce((a, p) => a + Number(p.monto), 0);
  const descuento = propiedad.tipo === 'casa' ? Number(venta.descuento_monto ?? 0) : 0;
  const saldo = Math.max(0, Number(venta.precio_acordado) - totalPagado - descuento);

  return (
    <div className="space-y-6 text-sm leading-relaxed">
      <header className="border-b-2 border-slate-900 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase text-slate-500">COPRODELI</div>
            <h1 className="text-2xl font-bold">Hoja de Separacion</h1>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div>Codigo: <span className="font-mono">{propiedad.cuh}</span></div>
            <div>Fecha emision: {formatDate(new Date())}</div>
          </div>
        </div>
      </header>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-700">Datos del cliente</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 rounded border border-slate-200 p-3">
          <Field k="Nombres" v={cliente.nombres} />
          <Field k="Apellidos" v={cliente.apellidos} />
          <Field k="DNI" v={cliente.dni} />
          <Field k="Telefono" v={cliente.telefono ?? '-'} />
          <Field k="Correo" v={cliente.email ?? '-'} />
          <Field k="Direccion" v={buildDireccion(cliente)} full />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-700">Datos del inmueble</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 rounded border border-slate-200 p-3">
          <Field k="CUH" v={propiedad.cuh} />
          <Field k="Tipo" v={propiedad.tipo} />
          <Field k="Manzana" v={propiedad.manzana ?? '-'} />
          <Field k="Lote" v={propiedad.lote ?? '-'} />
          <Field k="Modelo" v={propiedad.modelo ?? '-'} />
          <Field k="Partida" v={propiedad.partida_registral ?? '-'} />
          <Field k="Area" v={propiedad.area_m2 ? `${propiedad.area_m2} m2` : '-'} />
          <Field k="Esquina/parque" v={getReferenciaUnidad(propiedad.adicionales)} />
          <Field k="Ubicacion" v={propiedad.ubicacion ?? '-'} full />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-700">Separacion</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 rounded border border-slate-200 p-3">
          <Field k="Tipo de venta" v={modalidadLabel(venta.tipo_separacion, venta.modalidad_pago, propiedad.tipo)} />
          <Field k="Moneda" v={venta.moneda} />
          <Field k="Precio acordado" v={formatMoney(venta.precio_acordado, venta.moneda)} />
          <Field k="Total pagado" v={formatMoney(totalPagado, venta.moneda)} />
          <Field k="Descuento" v={formatMoney(descuento, venta.moneda)} />
          <Field k="Saldo" v={formatMoney(saldo, venta.moneda)} />
          <Field k="Fecha separacion" v={formatDateTime(venta.fecha_separacion)} />
          <Field k="Vencimiento" v={formatDateTime(venta.fecha_vencimiento_separacion)} />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-700">Pagos registrados</h2>
        {pagosValidos.length === 0 ? (
          <div className="rounded border border-slate-200 p-3 text-slate-500">Sin pagos registrados.</div>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100">
                <th className="border px-2 py-1 text-left">Fecha</th>
                <th className="border px-2 py-1 text-left">Tipo</th>
                <th className="border px-2 py-1 text-left">Banco</th>
                <th className="border px-2 py-1 text-left">Nro operacion</th>
                <th className="border px-2 py-1 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {pagosValidos.map((p) => (
                <tr key={p.id}>
                  <td className="border px-2 py-1">{formatDate(p.fecha_deposito)}</td>
                  <td className="border px-2 py-1 capitalize">{p.tipo}</td>
                  <td className="border px-2 py-1">{p.banco ?? '-'}</td>
                  <td className="border px-2 py-1 font-mono">{p.numero_operacion ?? '-'}</td>
                  <td className="border px-2 py-1 text-right">{formatMoney(p.monto, p.moneda)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="text-justify text-xs leading-relaxed">
        <p>
          Por medio del presente documento, el cliente arriba identificado separa la unidad descrita por un
          plazo improrrogable de <strong>veinticuatro (24) horas</strong>. Si dentro de dicho plazo no se
          registra el pago de separacion, la unidad quedara automaticamente liberada y disponible para su venta.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-12 pt-12">
        <div className="border-t border-slate-400 pt-2 text-center text-xs">
          Cliente<br />{cliente.nombres} {cliente.apellidos}<br />DNI: {cliente.dni}
        </div>
        <div className="border-t border-slate-400 pt-2 text-center text-xs">
          COPRODELI<br />Promotor/Representante
        </div>
      </section>
    </div>
  );
}

function Field({ k, v, full }: { k: string; v: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <span className="text-slate-500">{k}: </span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

function buildDireccion(cliente: Cliente): string {
  const parts = [
    [cliente.tipo_via, cliente.zona_nombre].filter(Boolean).join(' '),
    cliente.direccion_mz ? `Mz ${cliente.direccion_mz}` : null,
    cliente.direccion_lt ? `Lt ${cliente.direccion_lt}` : null,
    cliente.numero_puerta ? `Nro ${cliente.numero_puerta}` : null,
    cliente.interior ? `Int ${cliente.interior}` : null,
    cliente.referencia,
    cliente.ubigeo_cod ? `Ubigeo ${cliente.ubigeo_cod}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : cliente.direccion ?? '-';
}

function getReferenciaUnidad(adicionales: Record<string, unknown>): string {
  const valores = [
    (adicionales as any)?.esquina ? 'Esquina' : null,
    (adicionales as any)?.parque ? 'Parque' : null,
  ].filter(Boolean);
  return valores.length ? valores.join(' / ') : '-';
}

function modalidadLabel(tipoSeparacion: string | null | undefined, modalidad: string | null | undefined, tipo: string): string {
  if (tipoSeparacion === 'terreno_con_interes') return 'Terreno con interes';
  if (tipoSeparacion === 'terreno_sin_interes') return 'Terreno sin interes';
  if (tipoSeparacion === 'casa') return 'Casa';
  if (tipo === 'terreno' && modalidad === 'cuotas_con_interes') return 'Terreno con interes';
  if (tipo === 'terreno') return 'Terreno sin interes';
  return 'Casa';
}

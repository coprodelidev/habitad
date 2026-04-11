'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { loadVentaBundle, type VentaBundle } from '../../_utils/loadVenta';
import { formatDate, formatDateTime, formatMoney } from '@/lib/v2/format';

export default function HojaSeparacionPage() {
  const { id } = useParams<{ id: string }>();
  const [b, setB] = useState<VentaBundle | null>(null);

  useEffect(() => {
    if (id) loadVentaBundle(id).then(setB);
  }, [id]);

  if (!b) return <div>Cargando…</div>;
  const { venta, propiedad, cliente } = b;

  return (
    <div className="space-y-6 text-sm leading-relaxed">
      <header className="border-b-2 border-slate-900 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase text-slate-500">COPRODELI</div>
            <h1 className="text-2xl font-bold">Hoja de Separación</h1>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div>Código: <span className="font-mono">{propiedad.cuh}</span></div>
            <div>Fecha emisión: {formatDate(new Date())}</div>
          </div>
        </div>
      </header>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-700">Datos del cliente</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 rounded border border-slate-200 p-3">
          <Field k="Nombres" v={cliente.nombres} />
          <Field k="Apellidos" v={cliente.apellidos} />
          <Field k="DNI" v={cliente.dni} />
          <Field k="Teléfono" v={cliente.telefono ?? '—'} />
          <Field k="Correo" v={cliente.email ?? '—'} full />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-700">Datos del inmueble</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 rounded border border-slate-200 p-3">
          <Field k="CUH" v={propiedad.cuh} />
          <Field k="Tipo" v={propiedad.tipo} />
          <Field k="Manzana" v={propiedad.manzana ?? '—'} />
          <Field k="Lote" v={propiedad.lote ?? '—'} />
          <Field k="Modelo" v={propiedad.modelo ?? '—'} />
          <Field k="Partida" v={propiedad.partida_registral ?? '—'} />
          <Field k="Área" v={propiedad.area_m2 ? `${propiedad.area_m2} m²` : '—'} />
          <Field k="Ubicación" v={propiedad.ubicacion ?? '—'} full />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-700">Separación</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 rounded border border-slate-200 p-3">
          <Field k="Precio acordado" v={formatMoney(venta.precio_acordado, venta.moneda)} />
          <Field k="Moneda" v={venta.moneda} />
          <Field k="Fecha separación" v={formatDateTime(venta.fecha_separacion)} />
          <Field k="Vencimiento" v={formatDateTime(venta.fecha_vencimiento_separacion)} />
        </div>
      </section>

      <section className="text-justify text-xs leading-relaxed">
        <p>
          Por medio del presente documento, el cliente arriba identificado separa la unidad descrita por un
          plazo improrrogable de <strong>veinticuatro (24) horas</strong>. Si dentro de dicho plazo no se
          registra el pago de separación, la unidad quedará automáticamente liberada y disponible para su
          venta, sin responsabilidad para COPRODELI. El cliente se compromete a entregar los documentos
          físicos requeridos en un plazo máximo de tres (3) días calendario.
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

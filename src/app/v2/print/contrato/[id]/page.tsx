'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { loadVentaBundle, type VentaBundle } from '../../_utils/loadVenta';
import { formatDate, formatMoney } from '@/lib/v2/format';

export default function ContratoPage() {
  const { id } = useParams<{ id: string }>();
  const [b, setB] = useState<VentaBundle | null>(null);

  useEffect(() => {
    if (id) loadVentaBundle(id).then(setB);
  }, [id]);

  if (!b) return <div>Cargando…</div>;
  const { venta, propiedad, cliente, pagos, cuotas } = b;

  const totalIni = pagos
    .filter((p) => p.estado !== 'anulado' && p.moneda === venta.moneda && (p.tipo === 'separacion' || p.tipo === 'inicial'))
    .reduce((a, p) => a + Number(p.monto), 0);
  const descuento = propiedad.tipo === 'casa' ? Number(venta.descuento_monto ?? 0) : 0;
  const saldoCuotas = cuotas.reduce((a, c) => a + Number(c.monto), 0);
  const saldoReal = Math.max(0, Number(venta.precio_acordado) - totalIni - descuento);
  const primeraCuota = cuotas[0]?.fecha_vencimiento ?? null;
  const ultimaCuota = cuotas[cuotas.length - 1]?.fecha_vencimiento ?? null;

  return (
    <div className="space-y-4 text-sm leading-relaxed">
      <header className="border-b-2 border-slate-900 pb-3 text-center">
        <div className="text-xs uppercase text-slate-500">COPRODELI</div>
        <h1 className="text-2xl font-bold uppercase">Contrato de Compraventa</h1>
        <div className="mt-1 text-xs text-slate-600">
          Emitido el {formatDate(venta.fecha_contrato ?? new Date())}
        </div>
      </header>

      <p className="text-justify">
        Conste por el presente documento el Contrato de Compraventa que celebran de una parte COPRODELI,
        en adelante <strong>EL VENDEDOR</strong>, y de la otra parte <strong>{cliente.nombres} {cliente.apellidos}</strong>,
        identificado(a) con DNI N° {cliente.dni}, en adelante <strong>EL COMPRADOR</strong>, en los términos
        y condiciones siguientes:
      </p>

      <Section title="Primera — Objeto">
        EL VENDEDOR transfiere en favor de EL COMPRADOR la propiedad del inmueble identificado con CUH
        <strong> {propiedad.cuh}</strong>, ubicado en {propiedad.ubicacion ?? '—'}, Manzana {propiedad.manzana ?? '—'},
        Lote {propiedad.lote ?? '—'}, con un área de {propiedad.area_m2 ?? '—'} m²,
        {propiedad.partida_registral ? ` inscrito en la partida ${propiedad.partida_registral}` : ''}.
      </Section>

      <Section title="Segunda — Precio y forma de pago">
        El precio total acordado es de <strong>{formatMoney(venta.precio_acordado, venta.moneda)}</strong>,
        pagaderos de la siguiente manera:
        <ul className="mt-2 list-inside list-disc">
          <li>Separación e inicial ya abonadas: <strong>{formatMoney(totalIni, venta.moneda)}</strong></li>
          {propiedad.tipo === 'casa' && descuento > 0 && (
            <li>
              Descuento aplicado ({venta.descuento_tipo ?? 'especial'}):
              {' '}
              <strong>{formatMoney(descuento, venta.moneda)}</strong>
              {venta.descuento_descripcion ? ` - ${venta.descuento_descripcion}` : ''}
            </li>
          )}
          <li>Saldo pendiente: <strong>{formatMoney(saldoReal, venta.moneda)}</strong></li>
          <li>Saldo a financiar en cronograma: <strong>{formatMoney(saldoCuotas, venta.moneda)}</strong></li>
          <li>Cuotas mensuales: <strong>{venta.meses_cuotas ?? '—'}</strong> cuotas según el cronograma anexo</li>
          <li>Mes inicial: <strong>{formatDate(primeraCuota)}</strong></li>
          <li>Mes final: <strong>{formatDate(ultimaCuota)}</strong></li>
        </ul>
      </Section>

      <Section title="Tercera — Condiciones">
        EL COMPRADOR se compromete al pago puntual de las cuotas mensuales establecidas en el cronograma.
        Cualquier pago mayor al de la cuota del mes será registrado como <strong>saldo a favor</strong> y se
        aplicará automáticamente a la siguiente cuota vencida. EL VENDEDOR no aplicará sobrepagos a
        cuotas finales de forma automática sin instrucción expresa de EL COMPRADOR.
      </Section>

      <Section title="Cuarta — Entrega">
        La entrega del inmueble se realizará una vez cancelado el saldo total del precio y cumplidas las
        obligaciones contractuales por ambas partes.
      </Section>

      <section className="grid grid-cols-2 gap-12 pt-16">
        <div className="border-t border-slate-400 pt-2 text-center text-xs">
          EL COMPRADOR<br />{cliente.nombres} {cliente.apellidos}<br />DNI: {cliente.dni}
        </div>
        <div className="border-t border-slate-400 pt-2 text-center text-xs">
          EL VENDEDOR<br />COPRODELI
        </div>
      </section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-1 text-sm font-semibold">{title}</h2>
      <p className="text-justify">{children}</p>
    </section>
  );
}

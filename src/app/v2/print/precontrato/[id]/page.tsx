'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import type { Venta, Propiedad, Cliente, Pago, Cuota, Ubigeo } from '@/lib/v2/types';
import { formatDate, formatMoney } from '@/lib/v2/format';

interface Params {
  [k: string]: any;
}

async function loadAll(id: string) {
  const v = await supabaseV2.from('ventas').select('*').eq('id', id).maybeSingle();
  if (v.error || !v.data) return null;
  const venta = v.data as Venta;
  const [p, c, pg, ct, param] = await Promise.all([
    supabaseV2.from('propiedades').select('*').eq('id', venta.propiedad_id).maybeSingle(),
    supabaseV2.from('clientes').select('*').eq('id', venta.cliente_id).maybeSingle(),
    supabaseV2.from('pagos').select('*').eq('venta_id', id).order('fecha_deposito'),
    supabaseV2.from('cuotas').select('*').eq('venta_id', id).order('numero'),
    supabaseV2.from('parametros').select('*'),
  ]);
  const params: Params = {};
  for (const row of (param.data ?? []) as { clave: string; valor: any }[]) {
    params[row.clave] = row.valor;
  }
  let ubigeo: Ubigeo | null = null;
  const cliente = (c.data as Cliente) ?? null;
  if (cliente?.ubigeo_cod) {
    const u = await supabaseV2.from('ubigeos').select('*').eq('codigo', cliente.ubigeo_cod).maybeSingle();
    ubigeo = (u.data as Ubigeo) ?? null;
  }
  return {
    venta,
    propiedad: (p.data as Propiedad) ?? null,
    cliente,
    pagos: (pg.data ?? []) as Pago[],
    cuotas: (ct.data ?? []) as Cuota[],
    params,
    ubigeo,
  };
}

function buildDomicilioString(c: Cliente | null, u: Ubigeo | null): string {
  if (!c) return '—';
  const parts: string[] = [];
  if (c.tipo_via && c.zona_nombre) parts.push(`${c.tipo_via} ${c.zona_nombre}`);
  if (c.direccion_mz) parts.push(`Mz ${c.direccion_mz}`);
  if (c.direccion_lt) parts.push(`Lt ${c.direccion_lt}`);
  if (c.numero_puerta) parts.push(`Nº ${c.numero_puerta}`);
  if (c.interior) parts.push(`Int ${c.interior}`);
  if (c.urbanizacion) parts.push(`URB ${c.urbanizacion}`);
  const street = parts.join(' - ') || c.direccion || 'domicilio por indicar';
  if (u) return `${street}, distrito de ${u.distrito}, provincia de ${u.provincia}, departamento de ${u.departamento}`;
  return street;
}

export default function PrecontratoPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (id) loadAll(id).then(setData);
  }, [id]);

  if (!data) return <div>Cargando…</div>;
  const { venta, propiedad, cliente, pagos, cuotas, params, ubigeo } = data;
  if (!venta || !propiedad || !cliente) return <div>Datos incompletos.</div>;

  const modalidad = venta.modalidad_pago ?? 'cuotas_sin_interes';
  const esTerreno = propiedad.tipo === 'terreno';
  const esCasa = propiedad.tipo === 'casa';

  if (esTerreno && modalidad === 'contado') return <PrecontratoTerrenoContado {...data} />;
  if (esTerreno && modalidad === 'cuotas_con_interes') return <PrecontratoTerrenoConInteres {...data} />;
  if (esTerreno) return <PrecontratoTerrenoSinInteres {...data} />;
  if (esCasa) return <PrecontratoCasa {...data} />;
  return <PrecontratoTerrenoSinInteres {...data} />;
}

// ============================================================
// HEADER / FOOTER COMUNES
// ============================================================
function Encabezado({ cliente, params, ubigeo }: any) {
  const empresaNombre = params.empresa_nombre ?? 'ASOCIACIÓN COMUNIÓN PROMOCIÓN DESARROLLO Y LIBERACIÓN – COPRODELI';
  const ruc = params.empresa_ruc ?? '20138693326';
  const rep = params.empresa_representante_nombre ?? 'Yessenia Obdulia Obregón Callan';
  const repDni = params.empresa_representante_dni ?? '25765681';
  const repPartida = params.empresa_representante_partida ?? '70000278';
  const domFiscal = params.empresa_domicilio_fiscal ?? 'Av. Guardia Chalaca N°1371, Distrito y provincia del Callao, Departamento de Lima';
  const domCliente = buildDomicilioString(cliente, ubigeo);
  const nombreCompleto = `${cliente.apellido_paterno ?? ''} ${cliente.apellido_materno ?? ''} ${cliente.nombres ?? ''} ${cliente.segundo_nombre ?? ''}`.trim().replace(/\s+/g, ' ');

  return (
    <section className="text-justify text-[13px] leading-relaxed">
      <p>
        Conste por el presente <strong>Precontrato de venta de bien inmueble</strong>, que celebran de una parte,{' '}
        <strong>{empresaNombre}</strong> con R.U.C. Nº{ruc}, representada por su apoderada la señora{' '}
        <strong>{rep}</strong> identificada con DNI Nº {repDni}, con poderes inscritos en la Partida Electrónica
        Nº{repPartida} del Registro de Personas Jurídicas de la Oficina Registral de Lima y Callao – Sede Callao,
        señalando domicilio fiscal en {domFiscal}, a la que en adelante se le denominará <strong>EL VENDEDOR</strong>,
        y de la otra parte; <strong>({nombreCompleto})</strong> (DNI {cliente.dni}), señalando domicilio para estos
        efectos en {domCliente}, a quien se le denominará <strong>EL COMPRADOR</strong>; en los términos y condiciones
        siguientes:
      </p>
    </section>
  );
}

function TerrenoPrimera({ propiedad, params }: any) {
  const proyecto = params.proyecto_nombre ?? 'Urbanización Las Palmeras de San Fernando';
  const partida = params.proyecto_partida_registral ?? '11103106';
  const ubicacion = params.proyecto_ubicacion ?? 'Sector Comatrana, Lote 1, Las Lomas, Distrito, Provincia y Departamento de Ica';
  const areaTotal = params.proyecto_terreno_area ?? '70 Has';
  const etapa = propiedad.etapa_id ? '___' : '___';
  return (
    <section>
      <h2 className="text-sm font-semibold">PRIMERA: ANTECEDENTES</h2>
      <p className="text-justify text-[13px] leading-relaxed">
        El VENDEDOR es propietario de un terreno de {areaTotal} ubicado en el {ubicacion}, inscrito en la Partida
        Electrónica N°{partida} del Registro de Propiedad Inmueble de Ica, donde se está ejecutando un proyecto de
        habilitación urbana denominado {proyecto}. Dentro de dicho proyecto se están independizando lotes terreno,
        uno de los cuales tiene la siguiente descripción:{' '}
        <strong>Manzana {propiedad.manzana ?? '___'}, Lote {propiedad.lote ?? '___'}, Etapa {etapa}</strong> con un
        área de terreno de <strong>{propiedad.area_m2 ?? '___'} m²</strong>, en adelante <strong>EL TERRENO</strong>.
      </p>
      <p className="mt-2 text-justify text-[13px] leading-relaxed">
        Se deja constancia, que la descripción del TERRENO está sujeta a modificaciones dependiendo de las aprobaciones
        definitivas del Proyecto de Habilitación Urbana de la {proyecto} que tenga a bien la Municipalidad Provincial
        de Ica otorgar y de la recepción de obras que finalmente se realice al finalizar la Habilitación Urbana de
        dicha urbanización. EL COMPRADOR declara conocer la ubicación, descripción y especificaciones del TERRENO.
      </p>
    </section>
  );
}

function CasaPrimera({ propiedad, params }: any) {
  const proyecto = params.proyecto_nombre ?? 'Urbanización Las Palmeras de San Fernando';
  const partida = params.proyecto_partida_registral ?? '11103106';
  const ubicacion = params.proyecto_ubicacion ?? 'Sector Comatrana, Lote 1, Las Lomas, Distrito, Provincia y Departamento de Ica';
  return (
    <section>
      <h2 className="text-sm font-semibold">PRIMERA: ANTECEDENTES</h2>
      <p className="text-justify text-[13px] leading-relaxed">
        El VENDEDOR es propietario de un terreno ubicado en el {ubicacion}, inscrito en la Partida Electrónica
        N°{partida} del Registro de Propiedad Inmueble de Ica, donde se está ejecutando un proyecto de habilitación
        urbana denominado {proyecto}, donde se proyecta la construcción de una vivienda de interés social según la
        descripción siguiente: <strong>Casa Habitación Mz {propiedad.manzana ?? '___'} Lt {propiedad.lote ?? '___'},
        Modelo {propiedad.modelo ?? '___'}, Etapa ___</strong>, con un área de terreno de{' '}
        <strong>{propiedad.area_m2 ?? '___'} m²</strong>. El COMPRADOR declara conocer la ubicación, descripción y
        especificaciones de la vivienda.
      </p>
    </section>
  );
}

function AbonosTabla({ pagos, minimo = 3 }: any) {
  const abonos = pagos.filter((p: Pago) => p.tipo === 'separacion' || p.tipo === 'inicial');
  const rows = [...abonos];
  while (rows.length < minimo) rows.push({ fecha_deposito: '', numero_operacion: '', monto: '', banco: '' } as any);
  return (
    <table className="w-full border-collapse text-[12px]">
      <thead>
        <tr className="bg-slate-100">
          <th className="border px-2 py-1 text-left">Fecha depósito</th>
          <th className="border px-2 py-1 text-left">N° Operación</th>
          <th className="border px-2 py-1 text-right">Monto</th>
          <th className="border px-2 py-1 text-left">Banco</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p: any, i: number) => (
          <tr key={i}>
            <td className="border px-2 py-1">{p.fecha_deposito ? formatDate(p.fecha_deposito) : '…./ … /  ….'}</td>
            <td className="border px-2 py-1 font-mono">{p.numero_operacion || '…'}</td>
            <td className="border px-2 py-1 text-right">{p.monto ? `S/ ${Number(p.monto).toFixed(2)}` : ''}</td>
            <td className="border px-2 py-1">{p.banco ?? ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Firmas({ cliente, params }: any) {
  const rep = params.empresa_representante_nombre ?? 'Yessenia Obdulia Obregón Callan';
  const repDni = params.empresa_representante_dni ?? '25765681';
  const nombreCompleto = `${cliente.apellido_paterno ?? ''} ${cliente.apellido_materno ?? ''} ${cliente.nombres ?? ''} ${cliente.segundo_nombre ?? ''}`.trim().replace(/\s+/g, ' ');
  return (
    <section className="mt-16 grid grid-cols-2 gap-12">
      <div className="border-t border-slate-400 pt-2 text-center text-[11px]">
        <div className="font-medium">{rep}</div>
        <div>DNI N°{repDni}</div>
        <div>Apoderada – COPRODELI</div>
        <div className="mt-1 font-semibold">VENDEDOR</div>
      </div>
      <div className="border-t border-slate-400 pt-2 text-center text-[11px]">
        <div className="font-medium">{nombreCompleto}</div>
        <div>DNI N°{cliente.dni}</div>
        <div className="mt-4 font-semibold">COMPRADOR</div>
      </div>
    </section>
  );
}

// ============================================================
// 1) TERRENO CONTADO
// ============================================================
function PrecontratoTerrenoContado({ venta, propiedad, cliente, pagos, params, ubigeo }: any) {
  return (
    <div className="space-y-4 text-[13px] leading-relaxed">
      <header className="border-b-2 border-slate-900 pb-3 text-center">
        <h1 className="text-lg font-bold uppercase">Precontrato de venta de bien inmueble</h1>
        <div className="text-xs text-slate-500">Terreno – Cancelación al contado</div>
      </header>
      <Encabezado cliente={cliente} params={params} ubigeo={ubigeo} />
      <TerrenoPrimera propiedad={propiedad} params={params} />
      <section>
        <h2 className="text-sm font-semibold">SEGUNDA: PRECIO, FORMA DE PAGO</h2>
        <p className="text-justify">
          El precio del TERRENO asciende a la suma de <strong>{formatMoney(venta.precio_acordado, venta.moneda)}</strong>.
          La cancelación del precio se ha realizado de la siguiente manera:
        </p>
        <div className="mt-2"><AbonosTabla pagos={pagos} /></div>
        <p className="mt-3 text-justify text-[12px]">
          EL COMPRADOR debe enviar su voucher legible (en formato PDF con sus datos NOMBRES Y APELLIDOS – DNI) al
          WhatsApp <strong>{params.whatsapp_cobranza ?? '989 172 061'}</strong> o al correo{' '}
          <strong>{params.email_cobranza ?? 'cobranza@coprodeli.org'}</strong>, indicando en el ASUNTO del correo:
          URB SAN FERNANDO – ({cliente.apellidos} {cliente.nombres}) – DNI {cliente.dni} – Mz {propiedad.manzana} Lt {propiedad.lote}.
        </p>
      </section>
      <ClausulasFinalesTerreno params={params} penalidad={venta.penalidad_retiro} />
      <Firmas cliente={cliente} params={params} />
    </div>
  );
}

// ============================================================
// 2) TERRENO CUOTAS SIN INTERÉS
// ============================================================
function PrecontratoTerrenoSinInteres({ venta, propiedad, cliente, pagos, cuotas, params, ubigeo }: any) {
  const cuentaNombre = params.cuenta_banbif_con_data_terreno ?? 'COPRODELI CON DATA SAN FERNANDO TERRENO';
  const cuentaSin = params.cuenta_banbif_sin_data ?? 'COPRODELI SIN DATA SAN FERNANDO';
  const mora = params.mora_diaria_terreno ?? 2.5;
  const penalidad = venta.penalidad_retiro ?? params.penalidad_retiro_terreno ?? 3500;
  const montoCuota = cuotas[0]?.monto ?? '___';
  return (
    <div className="space-y-4 text-[13px] leading-relaxed">
      <header className="border-b-2 border-slate-900 pb-3 text-center">
        <h1 className="text-lg font-bold uppercase">Precontrato de venta de bien inmueble</h1>
        <div className="text-xs text-slate-500">Terreno – Cuotas SIN interés</div>
      </header>
      <Encabezado cliente={cliente} params={params} ubigeo={ubigeo} />
      <TerrenoPrimera propiedad={propiedad} params={params} />
      <section>
        <h2 className="text-sm font-semibold">SEGUNDA: PRECIO, FORMA DE PAGO</h2>
        <p className="text-justify">
          El precio del TERRENO asciende a la suma de <strong>{formatMoney(venta.precio_acordado, venta.moneda)}</strong>.
          Las partes acuerdan que el abono debe ser pagado así:
        </p>
        <p className="mt-2 text-justify"><strong>1) Una inicial</strong> conforme al siguiente detalle:</p>
        <div className="mt-1"><AbonosTabla pagos={pagos} /></div>
        <p className="mt-3 text-justify text-[12px]">
          Todo pago deberá ser abonado en el Banco Interamericano de Finanzas (BANBIF) a la cuenta RECAUDADORA
          Empresa: <strong>{cuentaSin}</strong> presentando EL COMPRADOR su DNI, el cual debe figurar en el voucher.
        </p>
        <p className="mt-3 text-justify">
          <strong>1) El saldo del precio</strong> será pagado mediante un financiamiento directo <strong>SIN intereses</strong> otorgado por el VENDEDOR al COMPRADOR, en{' '}
          <strong>{venta.meses_cuotas ?? 'XX'}</strong> cuotas mensuales de{' '}
          <strong>{formatMoney(Number(montoCuota), venta.moneda)}</strong>, a abonar en la cuenta RECAUDADORA
          Empresa: <strong>{cuentaNombre}</strong>.
        </p>
        <CobranzaYMora mora={mora} penalidad={penalidad} params={params} cliente={cliente} propiedad={propiedad} />
      </section>
      <ClausulasFinalesTerreno params={params} penalidad={penalidad} />
      <Firmas cliente={cliente} params={params} />
    </div>
  );
}

// ============================================================
// 3) TERRENO CUOTAS CON INTERÉS
// ============================================================
function PrecontratoTerrenoConInteres({ venta, propiedad, cliente, pagos, cuotas, params, ubigeo }: any) {
  const cuentaNombre = params.cuenta_banbif_con_data_terreno ?? 'COPRODELI CON DATA SAN FERNANDO TERRENO';
  const cuentaSin = params.cuenta_banbif_sin_data ?? 'COPRODELI SIN DATA SAN FERNANDO';
  const mora = params.mora_diaria_terreno ?? 2.5;
  const tasa = venta.tasa_interes_anual ?? params.tasa_interes_con_data_default ?? 8;
  const penalidad = venta.penalidad_retiro ?? params.penalidad_retiro_terreno ?? 3500;
  const montoCuota = cuotas[0]?.monto ?? '___';
  return (
    <div className="space-y-4 text-[13px] leading-relaxed">
      <header className="border-b-2 border-slate-900 pb-3 text-center">
        <h1 className="text-lg font-bold uppercase">Precontrato de venta de bien inmueble</h1>
        <div className="text-xs text-slate-500">Terreno – Cuotas CON interés {tasa}% anual</div>
      </header>
      <Encabezado cliente={cliente} params={params} ubigeo={ubigeo} />
      <TerrenoPrimera propiedad={propiedad} params={params} />
      <section>
        <h2 className="text-sm font-semibold">SEGUNDA: PRECIO, FORMA DE PAGO</h2>
        <p className="text-justify">
          El precio del TERRENO asciende a la suma de <strong>{formatMoney(venta.precio_acordado, venta.moneda)}</strong>.
        </p>
        <p className="mt-2 text-justify"><strong>1) Una inicial</strong> conforme al siguiente detalle:</p>
        <div className="mt-1"><AbonosTabla pagos={pagos} /></div>
        <p className="mt-3 text-justify text-[12px]">
          Todo pago deberá ser abonado en BANBIF a la cuenta RECAUDADORA Empresa <strong>{cuentaSin}</strong>.
        </p>
        <p className="mt-3 text-justify">
          <strong>2) El saldo</strong> será pagado mediante un financiamiento directo con un interés del{' '}
          <strong>{tasa}% anual</strong>, en <strong>{venta.meses_cuotas ?? 'XX'}</strong> cuotas mensuales de{' '}
          <strong>{formatMoney(Number(montoCuota), venta.moneda)}</strong> a abonar en la cuenta RECAUDADORA Empresa{' '}
          <strong>{cuentaNombre}</strong>.
        </p>
        <CobranzaYMora mora={mora} penalidad={penalidad} params={params} cliente={cliente} propiedad={propiedad} />
      </section>
      <ClausulasFinalesTerreno params={params} penalidad={penalidad} />
      <Firmas cliente={cliente} params={params} />
    </div>
  );
}

// ============================================================
// 4) CASA (con o sin Bono MiVivienda)
// ============================================================
function PrecontratoCasa({ venta, propiedad, cliente, pagos, cuotas, params, ubigeo }: any) {
  const cuentaNombre = params.cuenta_banbif_con_data_casas ?? 'COPRODELI CON DATA SAN FERNANDO CASAS';
  const cuentaSin = params.cuenta_banbif_sin_data ?? 'COPRODELI SIN DATA SAN FERNANDO';
  const mora = params.mora_diaria_casa ?? 2;
  const penalidad = venta.penalidad_retiro ?? params.penalidad_retiro_casa ?? 3000;
  const montoCuota = cuotas[0]?.monto ?? '___';
  const conBono = venta.modalidad_pago === 'bono_mivivienda';
  const bonoMonto = venta.mivivienda_bono_monto;
  return (
    <div className="space-y-4 text-[13px] leading-relaxed">
      <header className="border-b-2 border-slate-900 pb-3 text-center">
        <h1 className="text-lg font-bold uppercase">Precontrato de venta de bien inmueble</h1>
        <div className="text-xs text-slate-500">Casa {conBono ? '– Con Bono Familiar Habitacional MiVivienda' : ''}</div>
      </header>
      <Encabezado cliente={cliente} params={params} ubigeo={ubigeo} />
      <CasaPrimera propiedad={propiedad} params={params} />
      <section>
        <h2 className="text-sm font-semibold">SEGUNDA: PRECIO, FORMA DE PAGO</h2>
        <p className="text-justify">
          El precio de la vivienda asciende a la suma de <strong>{formatMoney(venta.precio_acordado, venta.moneda)}</strong>.
        </p>
        {conBono && (
          <p className="mt-2 text-justify text-[12px]">
            Se deja establecido que al momento que se presente el expediente al Fondo MiVivienda para que sea calificado
            como beneficiario del Bono Habitacional Familiar, se procederá a la actualización del precio total del
            inmueble ante el Fondo MiVivienda, sin que ello implique pago adicional alguno por concepto de precio.
          </p>
        )}
        <p className="mt-2 text-justify"><strong>1. Una inicial</strong> conforme al siguiente detalle:</p>
        <div className="mt-1"><AbonosTabla pagos={pagos} /></div>
        <p className="mt-3 text-justify text-[12px]">
          Todo pago deberá ser abonado en BANBIF a la cuenta RECAUDADORA Empresa <strong>{cuentaSin}</strong>.
        </p>
        <p className="mt-3 text-justify">
          Completada la inicial, el saldo equivalente a <strong>S/ ___</strong> será pagado mediante un crédito
          directo sin intereses en <strong>{venta.meses_cuotas ?? 'XX'}</strong> cuotas mensuales de{' '}
          <strong>{formatMoney(Number(montoCuota), venta.moneda)}</strong> a abonar en la cuenta RECAUDADORA Empresa{' '}
          <strong>{cuentaNombre}</strong>.
        </p>
        <CobranzaYMora mora={mora} penalidad={penalidad} params={params} cliente={cliente} propiedad={propiedad} />
      </section>
      {conBono && (
        <section>
          <h2 className="text-sm font-semibold">TERCERA: OBTENCIÓN DEL BONO FAMILIAR HABITACIONAL – FONDO MIVIVIENDA</h2>
          <p className="text-justify text-[12px]">
            Para la cancelación del diferencial financiado mediante el Bono Familiar Habitacional del Fondo MiVivienda
            (Adquisición de Vivienda Nueva), EL COMPRADOR se obliga a la suscripción, otorgamiento de toda la
            documentación necesaria y cumplimiento de requisitos legales para ser elegible.
          </p>
          {bonoMonto && (
            <p className="mt-2 text-justify text-[12px]">
              El Bono Familiar Habitacional será de <strong>{formatMoney(bonoMonto, 'PEN')}</strong>, sin perjuicio de
              actualización ante el Fondo MiVivienda.
            </p>
          )}
          <p className="mt-2 text-justify text-[12px]">
            Pasado un plazo de un mes después de informar a EL COMPRADOR que debe firmar el expediente para ingresar
            al Fondo MiVivienda, y este no cumple con firmarlo, automáticamente se resuelve este precontrato,
            quedando libre la vivienda.
          </p>
        </section>
      )}
      <ClausulasFinalesCasa params={params} conBono={conBono} />
      <Firmas cliente={cliente} params={params} />
    </div>
  );
}

// ============================================================
// Cláusulas finales reutilizables
// ============================================================
function CobranzaYMora({ mora, penalidad, params, cliente, propiedad }: any) {
  const tasaMora = params.tasa_mora_anual ?? 12;
  return (
    <>
      <p className="mt-3 text-justify text-[12px]">
        <strong>ASIMISMO:</strong> Solo se considerará cuota mensual cancelada cuando EL COMPRADOR envíe su voucher
        legible (en formato PDF con sus datos NOMBRES Y APELLIDOS – DNI) al WhatsApp{' '}
        <strong>{params.whatsapp_cobranza ?? '989 172 061'}</strong> Sede Callao – Recepción o al correo{' '}
        <strong>{params.email_cobranza ?? 'cobranza@coprodeli.org'}</strong>, indicando en el ASUNTO:
        URB SAN FERNANDO – ({cliente.apellidos} {cliente.nombres}) – DNI {cliente.dni} – Mz {propiedad.manzana} Lt {propiedad.lote} – Mes de cuota.
      </p>
      <p className="mt-3 text-justify text-[12px]">
        <strong>IMPORTANTE:</strong> Los vouchers de pago deben enviarse, ya que a la firma en Notaría es
        indispensable presentarlos. Si no los envía, es responsabilidad de EL COMPRADOR el sustento de los pagos.
      </p>
      <p className="mt-3 text-justify text-[12px]">
        El no pago de 2 o más cuotas consecutivas o alternadas generará a elección del VENDEDOR:
      </p>
      <ul className="ml-6 list-disc text-justify text-[12px]">
        <li>La resolución automática del presente precontrato y la retención de lo pagado hasta la suma de{' '}
          <strong>S/ {Number(penalidad).toFixed(0)}</strong> por concepto de penalidad.</li>
        <li>Dar lugar al vencimiento anticipado de todas las cuotas impagas y al pago de un interés moratorio de{' '}
          <strong>{tasaMora}% anual</strong>, hasta el cumplimiento total de su obligación.</li>
      </ul>
      <p className="mt-2 text-justify text-[12px]">
        Del mismo modo por cada día de atraso, se generará una mora de <strong>S/ {Number(mora).toFixed(2)}</strong>{' '}
        hasta la efectiva cancelación de la cuota pendiente de pago.
      </p>
    </>
  );
}

function ClausulasFinalesTerreno({ params, penalidad }: any) {
  return (
    <>
      <section>
        <h2 className="text-sm font-semibold">TERCERA: ENTREGA Y ESCRITURA PÚBLICA</h2>
        <p className="text-justify text-[12px]">
          Ambas partes acuerdan que una vez cancelado el íntegro del precio del TERRENO, concluida la Habilitación
          Urbana de la etapa donde se ubica, procedida su independización, efectuada la recepción de obras con su
          inscripción registral y obtenida la Declaración Jurada de Autoavalúo (HR y PU) actualizada, se procederá a
          suscribir la Minuta de compraventa del TERRENO, para su remisión a la Notaría y elevación a Escritura
          Pública e inscripción en los Registros Públicos. Todo gasto del trámite será de cargo del COMPRADOR.
        </p>
      </section>
      <section>
        <h2 className="text-sm font-semibold">CUARTA: PENALIDAD POR RETIRO</h2>
        <p className="text-justify text-[12px]">
          EL COMPRADOR pagará una penalidad de <strong>S/ {Number(penalidad).toFixed(0)}</strong> por gastos
          administrativos si una vez suscrito el presente precontrato, y antes de la firma de la minuta de compraventa,
          se retira del proyecto.
        </p>
      </section>
      <p className="mt-4 text-[12px]">En señal de conformidad, las partes suscriben este documento en Ica, a los ___ / ___ / 2026.</p>
    </>
  );
}

function ClausulasFinalesCasa({ params, conBono }: { params: any; conBono: boolean }) {
  const pNoElegible = params.penalidad_mivivienda_no_elegible ?? 5000;
  const pPostBono = params.penalidad_retiro_post_bono ?? 5000;
  const pRetiroCasa = params.penalidad_retiro_casa ?? 3000;
  // Si hay Bono, TERCERA ya la usó la cláusula MiVivienda → ENTREGA es CUARTA, PENALIDADES QUINTA.
  // Si NO hay Bono, ENTREGA pasa a ser TERCERA y PENALIDADES CUARTA (sin saltos).
  const numEntrega = conBono ? 'CUARTA' : 'TERCERA';
  const numPenalidades = conBono ? 'QUINTA' : 'CUARTA';
  return (
    <>
      <section>
        <h2 className="text-sm font-semibold">{numEntrega}: ENTREGA</h2>
        <p className="text-justify text-[12px]">
          Ambas partes acuerdan que al derivarse la Minuta a la Notaría y proceder a su elevación a Escritura Pública,
          EL VENDEDOR informará al COMPRADOR el costo del trámite notarial y registral. Se otorgará un plazo máximo de
          1 mes para firmar la Escritura Pública.{conBono && ' Vencido este plazo se procederá a resolver el contrato y devolver el bono y ahorro al Fondo MiVivienda.'}
        </p>
      </section>
      <section>
        <h2 className="text-sm font-semibold">{numPenalidades}: PENALIDADES</h2>
        <p className="text-justify text-[12px]">EL COMPRADOR pagará una penalidad por gastos administrativos en los siguientes casos:</p>
        <ol className="ml-6 list-decimal text-justify text-[12px]">
          <li>Retiro después de completar la inicial o antes de la firma de la minuta de compraventa: <strong>S/ {Number(pRetiroCasa).toFixed(0)}</strong></li>
          {conBono && (
            <>
              <li>No firmar el expediente para el bono en 1 mes: <strong>S/ {Number(pRetiroCasa).toFixed(0)}</strong></li>
              <li>Expediente NO ELEGIBLE (insubsanable): <strong>S/ {Number(pNoElegible).toFixed(0)}</strong></li>
              <li>Retiro después de ser calificado como beneficiario o desembolso del Bono: <strong>S/ {Number(pPostBono).toFixed(0)}</strong></li>
            </>
          )}
        </ol>
      </section>
      <p className="mt-4 text-[12px]">En señal de conformidad, las partes suscriben este documento en Ica, a los ___ / ___ / 2026.</p>
    </>
  );
}

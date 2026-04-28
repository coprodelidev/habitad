'use client';

import { useState } from 'react';
import { supabaseV2, supabasePublic } from '@/lib/v2/supabaseV2';
import type { ModalidadPago, Moneda, Propiedad, TipoSeparacion } from '@/lib/v2/types';
import { formatMoney } from '@/lib/v2/format';
import { UbigeoAutocomplete } from '@/components/v2/UbigeoAutocomplete';
import { parseAmountInput } from '@/lib/v2/amount';

const TIPOS_VIA = ['Avenida', 'Jr.', 'Calle', 'Pasaje'];
const TIPOS_ZONA = ['Urb.', 'AA.HH.', 'Caserio', 'P.J.', 'Asociacion'];

const TIPOS_SEPARACION_TERRENO: { value: TipoSeparacion; label: string; modalidad: ModalidadPago }[] = [
  { value: 'terreno_con_interes', label: 'Terreno con interes', modalidad: 'cuotas_con_interes' },
  { value: 'terreno_sin_interes', label: 'Terreno sin interes', modalidad: 'cuotas_sin_interes' },
];

const TIPOS_SEPARACION_CASA: { value: TipoSeparacion; label: string; modalidad: ModalidadPago }[] = [
  { value: 'casa', label: 'Casa', modalidad: 'bono_mivivienda' },
];

export function NuevaSeparacionModal({
  propiedad,
  onClose,
  onCreated,
}: {
  propiedad: Propiedad;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    nombres: '',
    segundo_nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    dni: '',
    telefono: '',
    email: '',
    moneda: propiedad.moneda as Moneda,
    tipo_separacion: (propiedad.tipo === 'casa' ? 'casa' : 'terreno_sin_interes') as TipoSeparacion,
    modalidad_pago: (propiedad.tipo === 'casa' ? 'bono_mivivienda' : 'cuotas_sin_interes') as ModalidadPago,
    monto_inicial_objetivo: '',
    tipo_via: '',
    tipo_zona: '',
    zona_nombre: '',
    direccion_mz: propiedad.manzana ? String(propiedad.manzana) : '',
    direccion_lt: propiedad.lote ? String(propiedad.lote) : '',
    numero_puerta: '',
    interior: '',
    referencia: '',
    urbanizacion: '',
    ubigeo_cod: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const precio = propiedad.precio_venta ?? propiedad.precio_lista;
  const apellidosCompletos = [form.apellido_paterno, form.apellido_materno].filter(Boolean).join(' ');
  const nombresCompletos = [form.nombres, form.segundo_nombre].filter(Boolean).join(' ');
  const tiposSeparacion = propiedad.tipo === 'casa' ? TIPOS_SEPARACION_CASA : TIPOS_SEPARACION_TERRENO;
  const referenciaUnidad = getReferenciaUnidad(propiedad);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const missing: string[] = [];
      if (!form.nombres.trim()) missing.push('Primer nombre');
      if (!form.apellido_paterno.trim()) missing.push('Apellido paterno');
      if (!form.dni.trim()) missing.push('DNI');
      if (!form.email.trim()) missing.push('Correo');
      if (!form.direccion_mz.trim()) missing.push('Manzana');
      if (!form.direccion_lt.trim()) missing.push('Lote');
      if (!form.ubigeo_cod.trim()) missing.push('Ubigeo');
      if (missing.length) {
        throw new Error(`Completa los campos obligatorios: ${missing.join(', ')}`);
      }
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
      if (!emailOk) {
        throw new Error('Ingresa un correo válido.');
      }

      const montoInicialObjetivo = parseAmountInput(form.monto_inicial_objetivo || '0');
      if (!Number.isFinite(montoInicialObjetivo) || montoInicialObjetivo < 0) {
        throw new Error('Ingresa un monto objetivo de inicial valido.');
      }

      let clienteId: string | null = null;
      const { data: existingId } = await supabaseV2.rpc('buscar_cliente_por_dni', { p_dni: form.dni });
      const { data: userData } = await supabasePublic.auth.getUser();
      const clientePayload = {
        nombres: nombresCompletos,
        apellidos: apellidosCompletos,
        dni: form.dni,
        telefono: form.telefono || null,
        email: form.email || null,
        segundo_nombre: form.segundo_nombre || null,
        apellido_paterno: form.apellido_paterno || null,
        apellido_materno: form.apellido_materno || null,
        tipo_via: form.tipo_via || null,
        tipo_zona: form.tipo_zona || null,
        zona_nombre: form.zona_nombre || null,
        direccion_mz: form.direccion_mz || null,
        direccion_lt: form.direccion_lt || null,
        numero_puerta: form.numero_puerta || null,
        interior: form.interior || null,
        referencia: form.referencia || null,
        urbanizacion: form.urbanizacion || null,
        ubigeo_cod: form.ubigeo_cod || null,
      };
      if (existingId) {
        clienteId = existingId as string;
        const upd = await supabaseV2.from('clientes').update(clientePayload).eq('id', clienteId);
        if (upd.error) throw upd.error;
      } else {
        const ins = await supabaseV2.from('clientes').insert({
          ...clientePayload,
          created_by: userData.user?.id ?? null,
        }).select('id').single();
        if (ins.error) throw ins.error;
        clienteId = ins.data!.id;
      }

      const param = await supabaseV2.from('parametros').select('valor').eq('clave', 'separacion_horas').maybeSingle();
      const horas = Number(param.data?.valor ?? 24);
      const now = new Date();
      const vencimiento = new Date(now.getTime() + horas * 3600 * 1000);

      const { data: userRes } = await supabasePublic.auth.getUser();
      const { error: vErr } = await supabaseV2.from('ventas').insert({
        propiedad_id: propiedad.id,
        cliente_id: clienteId,
        promotor_id: userRes.user?.id ?? null,
        estado: 'separacion',
        precio_acordado: precio,
        moneda: form.moneda,
        tipo_separacion: form.tipo_separacion,
        modalidad_pago: form.modalidad_pago,
        monto_inicial_objetivo: montoInicialObjetivo || null,
        fecha_separacion: now.toISOString(),
        fecha_vencimiento_separacion: vencimiento.toISOString(),
      });
      if (vErr) throw vErr;

      onCreated();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  const canSave = !!(
    form.nombres.trim() &&
    form.apellido_paterno.trim() &&
    form.dni.trim() &&
    form.email.trim() &&
    form.direccion_mz.trim() &&
    form.direccion_lt.trim() &&
    form.ubigeo_cod.trim()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h2 className="text-base font-semibold">Nueva separacion</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">x</button>
        </div>
        <div className="p-4">
          <div className="mb-4 rounded-md bg-slate-50 p-3 text-sm">
            <div className="font-mono text-xs text-slate-500">{propiedad.cuh}</div>
            <div className="mt-1 text-slate-900">
              Mz {propiedad.manzana ?? '-'} / Lt {propiedad.lote ?? '-'} · {propiedad.tipo}
            </div>
            <div className="mt-1 font-medium text-slate-900">{formatMoney(precio, form.moneda)}</div>
            {referenciaUnidad && <div className="mt-1 text-xs text-slate-500">{referenciaUnidad}</div>}
          </div>

          <Section title="Datos del cliente">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Primer nombre *">
                <input className={inp} value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} />
              </Field>
              <Field label="Segundo nombre">
                <input className={inp} value={form.segundo_nombre} onChange={(e) => setForm({ ...form, segundo_nombre: e.target.value })} />
              </Field>
              <Field label="Apellido paterno *">
                <input className={inp} value={form.apellido_paterno} onChange={(e) => setForm({ ...form, apellido_paterno: e.target.value })} />
              </Field>
              <Field label="Apellido materno">
                <input className={inp} value={form.apellido_materno} onChange={(e) => setForm({ ...form, apellido_materno: e.target.value })} />
              </Field>
              <Field label="DNI *">
                <input className={inp} value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} maxLength={8} />
              </Field>
              <Field label="Telefono">
                <input className={inp} value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
              </Field>
              <Field label="Correo *" full>
                <input type="email" className={inp} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
            </div>
          </Section>

          <Section title="Datos de la separacion">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Moneda">
                <select className={inp} value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value as Moneda })}>
                  <option value="USD">Dolares</option>
                  <option value="PEN">Soles</option>
                </select>
              </Field>
              <Field label="Tipo de separacion">
                <select
                  className={inp}
                  value={form.tipo_separacion}
                  onChange={(e) => {
                    const tipo = e.target.value as TipoSeparacion;
                    const picked = tiposSeparacion.find((t) => t.value === tipo);
                    setForm({
                      ...form,
                      tipo_separacion: tipo,
                      modalidad_pago: picked?.modalidad ?? form.modalidad_pago,
                    });
                  }}
                >
                  {tiposSeparacion.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </Field>
              <Field label="Monto objetivo de inicial" full>
                <input
                  className={inp}
                  placeholder="Puede ser mayor al 5% (ej. 1500.50)"
                  value={form.monto_inicial_objetivo}
                  onChange={(e) => setForm({ ...form, monto_inicial_objetivo: e.target.value })}
                />
              </Field>
            </div>
          </Section>

          <Section title="Direccion del cliente">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo de via">
                <select className={inp} value={form.tipo_via} onChange={(e) => setForm({ ...form, tipo_via: e.target.value })}>
                  <option value="">-</option>
                  {TIPOS_VIA.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Numero de via">
                <input className={inp} value={form.numero_puerta} onChange={(e) => setForm({ ...form, numero_puerta: e.target.value })} />
              </Field>
              <Field label="Tipo de zona">
                <select className={inp} value={form.tipo_zona} onChange={(e) => setForm({ ...form, tipo_zona: e.target.value })}>
                  <option value="">-</option>
                  {TIPOS_ZONA.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Nombre de la zona">
                <input className={inp} placeholder="Ej: Las Palmeras" value={form.zona_nombre} onChange={(e) => setForm({ ...form, zona_nombre: e.target.value })} />
              </Field>
              <Field label="Manzana *">
                <input className={inp} value={form.direccion_mz} onChange={(e) => setForm({ ...form, direccion_mz: e.target.value })} />
              </Field>
              <Field label="Lote *">
                <input className={inp} value={form.direccion_lt} onChange={(e) => setForm({ ...form, direccion_lt: e.target.value })} />
              </Field>
              <Field label="Interior/Dpto">
                <input className={inp} value={form.interior} onChange={(e) => setForm({ ...form, interior: e.target.value })} />
              </Field>
              <Field label="Urbanizacion" full>
                <input className={inp} value={form.urbanizacion} onChange={(e) => setForm({ ...form, urbanizacion: e.target.value })} />
              </Field>
              <Field label="Ubigeo *" full>
                <UbigeoAutocomplete
                  value={form.ubigeo_cod}
                  onChange={(cod) => setForm({ ...form, ubigeo_cod: cod ?? '' })}
                />
              </Field>
              <Field label="Referencia" full>
                <input className={inp} placeholder="Ej: al costado del parque" value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} />
              </Field>
            </div>
          </Section>

          <p className="mt-4 text-xs text-slate-500">
            Al guardar se crea una separacion valida por <strong>24h</strong>. Si no se registra el pago
            dentro del plazo, la unidad se libera automaticamente.
          </p>
          {error && <div className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
        </div>
        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <button onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
          <button
            onClick={save}
            disabled={saving || !canSave}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? 'Creando...' : 'Crear separacion'}
          </button>
        </div>
      </div>
    </div>
  );
}

const inp = 'h-9 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </div>
  );
}

function getReferenciaUnidad(propiedad: Propiedad): string | null {
  const adicionales = propiedad.adicionales ?? {};
  const valores = [
    (adicionales as any).esquina ? 'Esquina' : null,
    (adicionales as any).parque ? 'Parque' : null,
    (adicionales as any).tipo_ubicacion,
    (adicionales as any).ubicacion_extra,
  ].filter(Boolean);
  return valores.length ? valores.join(' / ') : null;
}

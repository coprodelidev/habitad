'use client';

import { useState } from 'react';
import { supabaseV2, supabasePublic } from '@/lib/v2/supabaseV2';
import type { Propiedad } from '@/lib/v2/types';
import { formatMoney } from '@/lib/v2/format';
import { UbigeoAutocomplete } from '@/components/v2/UbigeoAutocomplete';

const TIPOS_VIA = ['URB', 'AA.HH.', 'P.J.', 'Av.', 'Jr.', 'Ca.', 'Pasaje', 'Sector', 'Caserío'];

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
    // Datos básicos cliente
    nombres: '',
    segundo_nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    dni: '',
    telefono: '',
    email: '',
    // Dirección estructurada
    tipo_via: '',
    zona_nombre: '',
    direccion_mz: '',
    direccion_lt: '',
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

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      if (!form.nombres || !form.apellido_paterno || !form.dni) {
        throw new Error('Nombres, apellido paterno y DNI son obligatorios');
      }

      // 1) Buscar por DNI (SECURITY DEFINER, bypasa RLS)
      let clienteId: string | null = null;
      const { data: existingId } = await supabaseV2.rpc('buscar_cliente_por_dni', { p_dni: form.dni });
      if (existingId) {
        clienteId = existingId as string;
      } else {
        const { data: userData } = await supabasePublic.auth.getUser();
        const ins = await supabaseV2.from('clientes').insert({
          nombres: nombresCompletos,
          apellidos: apellidosCompletos,
          dni: form.dni,
          telefono: form.telefono || null,
          email: form.email || null,
          segundo_nombre: form.segundo_nombre || null,
          apellido_paterno: form.apellido_paterno || null,
          apellido_materno: form.apellido_materno || null,
          tipo_via: form.tipo_via || null,
          zona_nombre: form.zona_nombre || null,
          direccion_mz: form.direccion_mz || null,
          direccion_lt: form.direccion_lt || null,
          numero_puerta: form.numero_puerta || null,
          interior: form.interior || null,
          referencia: form.referencia || null,
          urbanizacion: form.urbanizacion || null,
          ubigeo_cod: form.ubigeo_cod || null,
          created_by: userData.user?.id ?? null,
        }).select('id').single();
        if (ins.error) throw ins.error;
        clienteId = ins.data!.id;
      }

      // 2) Plazo separación
      const param = await supabaseV2.from('parametros').select('valor').eq('clave', 'separacion_horas').maybeSingle();
      const horas = Number(param.data?.valor ?? 24);
      const now = new Date();
      const vencimiento = new Date(now.getTime() + horas * 3600 * 1000);

      // 3) Crear venta
      const { data: userRes } = await supabasePublic.auth.getUser();
      const { error: vErr } = await supabaseV2.from('ventas').insert({
        propiedad_id: propiedad.id,
        cliente_id: clienteId,
        promotor_id: userRes.user?.id ?? null,
        estado: 'separacion',
        precio_acordado: precio,
        moneda: propiedad.moneda,
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

  const canSave = form.nombres && form.apellido_paterno && form.dni;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-lg bg-white shadow-xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h2 className="text-base font-semibold">Nueva separación</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="p-4">
          <div className="mb-4 rounded-md bg-slate-50 p-3 text-sm">
            <div className="font-mono text-xs text-slate-500">{propiedad.cuh}</div>
            <div className="mt-1 text-slate-900">
              Mz {propiedad.manzana ?? '—'} / Lt {propiedad.lote ?? '—'} · {propiedad.tipo}
            </div>
            <div className="mt-1 font-medium text-slate-900">{formatMoney(precio, propiedad.moneda)}</div>
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
              <Field label="Teléfono">
                <input className={inp} value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
              </Field>
              <Field label="Correo" full>
                <input type="email" className={inp} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
            </div>
          </Section>

          <Section title="Dirección del cliente (requerida para precontrato y SAP)">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo vía/zona">
                <select className={inp} value={form.tipo_via} onChange={(e) => setForm({ ...form, tipo_via: e.target.value })}>
                  <option value="">—</option>
                  {TIPOS_VIA.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Nombre de la vía/zona">
                <input className={inp} placeholder="Ej: Las Palmeras" value={form.zona_nombre} onChange={(e) => setForm({ ...form, zona_nombre: e.target.value })} />
              </Field>
              <Field label="Manzana">
                <input className={inp} value={form.direccion_mz} onChange={(e) => setForm({ ...form, direccion_mz: e.target.value })} />
              </Field>
              <Field label="Lote">
                <input className={inp} value={form.direccion_lt} onChange={(e) => setForm({ ...form, direccion_lt: e.target.value })} />
              </Field>
              <Field label="Nº puerta">
                <input className={inp} value={form.numero_puerta} onChange={(e) => setForm({ ...form, numero_puerta: e.target.value })} />
              </Field>
              <Field label="Interior/Dpto">
                <input className={inp} value={form.interior} onChange={(e) => setForm({ ...form, interior: e.target.value })} />
              </Field>
              <Field label="Urbanización (si aplica)" full>
                <input className={inp} value={form.urbanizacion} onChange={(e) => setForm({ ...form, urbanizacion: e.target.value })} />
              </Field>
              <Field label="Ubigeo (distrito/provincia/departamento)" full>
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
            Al guardar se crea una separación válida por <strong>24h</strong>. Si no se registra el pago
            dentro del plazo, la unidad se libera automáticamente.
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
            {saving ? 'Creando…' : 'Crear separación'}
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

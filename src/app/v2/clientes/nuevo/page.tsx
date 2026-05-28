'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { useV2User } from '@/lib/v2/useV2User';
import { isStaff } from '@/lib/v2/permissions';
import { UserPlus, Save } from 'lucide-react';

const TIPOS_VIA = ['Av.', 'Jr.', 'Ca.', 'Pasaje', 'Calle', 'URB', 'AA.HH.', 'P.J.', 'Sector', 'Caserío'];

export default function NuevoClientePage() {
  const router = useRouter();
  const { user, loading: loadingUser } = useV2User();
  const canStaff = isStaff(user?.roleCode);

  const [form, setForm] = useState({
    dni: '',
    apellido_paterno: '',
    apellido_materno: '',
    primer_nombre: '',
    segundo_nombre: '',
    telefono: '',
    email: '',
    tipo_via: 'URB',
    zona_nombre: '',
    direccion_mz: '',
    direccion_lt: '',
    numero_puerta: '',
    interior: '',
    referencia: '',
    urbanizacion: '',
    ubigeo_cod: '',
  });
  const [ubigeoQuery, setUbigeoQuery] = useState('');
  const [ubigeoResults, setUbigeoResults] = useState<Array<{ codigo: string; distrito: string; provincia: string; departamento: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!ubigeoQuery || ubigeoQuery.length < 2) { setUbigeoResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabaseV2
        .from('ubigeos')
        .select('codigo, distrito, provincia, departamento')
        .or(`distrito.ilike.%${ubigeoQuery}%,provincia.ilike.%${ubigeoQuery}%`)
        .limit(15);
      setUbigeoResults((data ?? []) as any);
    }, 250);
    return () => clearTimeout(t);
  }, [ubigeoQuery]);

  const checkDuplicate = async (dni: string) => {
    if (!dni || dni.length < 8) { setDuplicateInfo(null); return; }
    const { data } = await supabaseV2.from('clientes').select('id, nombres, apellidos').eq('dni', dni.trim()).maybeSingle();
    if (data) {
      setDuplicateInfo(`DNI ya existe: ${(data as any).nombres} ${(data as any).apellidos}`);
    } else {
      setDuplicateInfo(null);
    }
  };

  const save = async () => {
    setSaving(true); setError(null);
    if (!form.dni.trim() || !form.apellido_paterno.trim() || !form.primer_nombre.trim()) {
      setError('DNI, apellido paterno y primer nombre son obligatorios.');
      setSaving(false); return;
    }
    const apellidos = [form.apellido_paterno, form.apellido_materno].filter(Boolean).join(' ').trim();
    const nombres = [form.primer_nombre, form.segundo_nombre].filter(Boolean).join(' ').trim();

    const { data, error: err } = await supabaseV2.from('clientes').insert({
      dni: form.dni.trim(),
      apellidos, nombres,
      apellido_paterno: form.apellido_paterno.trim() || null,
      apellido_materno: form.apellido_materno.trim() || null,
      segundo_nombre: form.segundo_nombre.trim() || null,
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
      tipo_via: form.tipo_via || null,
      zona_nombre: form.zona_nombre.trim() || null,
      direccion_mz: form.direccion_mz.trim() || null,
      direccion_lt: form.direccion_lt.trim() || null,
      numero_puerta: form.numero_puerta.trim() || null,
      interior: form.interior.trim() || null,
      referencia: form.referencia.trim() || null,
      urbanizacion: form.urbanizacion.trim() || null,
      ubigeo_cod: form.ubigeo_cod || null,
    }).select('id').single();

    setSaving(false);
    if (err) { setError(err.message); return; }
    router.push('/v2/propiedades');
  };

  if (loadingUser) return <div className="p-6 text-sm text-slate-500">Cargando…</div>;
  if (!canStaff) return <div className="p-6 text-sm text-red-600">Solo personal interno.</div>;

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <UserPlus className="h-5 w-5 text-indigo-600" /> Nuevo cliente
        </h1>
        <p className="mt-1 text-sm text-slate-600">Captura del cliente con dirección estructurada para que el export SAP llene los campos Street/ZipCode/Block/City/County.</p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Identidad</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="DNI *">
            <input className={inp} value={form.dni} onChange={(e) => { setForm({ ...form, dni: e.target.value }); checkDuplicate(e.target.value); }} maxLength={8} />
            {duplicateInfo && <div className="mt-1 text-xs text-amber-700">{duplicateInfo}</div>}
          </Field>
          <Field label="Apellido paterno *"><input className={inp} value={form.apellido_paterno} onChange={(e) => setForm({ ...form, apellido_paterno: e.target.value })} /></Field>
          <Field label="Apellido materno"><input className={inp} value={form.apellido_materno} onChange={(e) => setForm({ ...form, apellido_materno: e.target.value })} /></Field>
          <Field label="Primer nombre *"><input className={inp} value={form.primer_nombre} onChange={(e) => setForm({ ...form, primer_nombre: e.target.value })} /></Field>
          <Field label="Segundo nombre"><input className={inp} value={form.segundo_nombre} onChange={(e) => setForm({ ...form, segundo_nombre: e.target.value })} /></Field>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Contacto</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Celular / teléfono"><input className={inp} value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></Field>
          <Field label="Correo"><input type="email" className={inp} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Dirección estructurada (alimenta el campo Street SAP)</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="Tipo de vía">
            <select className={inp} value={form.tipo_via} onChange={(e) => setForm({ ...form, tipo_via: e.target.value })}>
              {TIPOS_VIA.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Nombre de zona / AAHH / calle" className="md:col-span-2">
            <input className={inp} value={form.zona_nombre} onChange={(e) => setForm({ ...form, zona_nombre: e.target.value })} />
          </Field>
          <Field label="Manzana"><input className={inp} value={form.direccion_mz} onChange={(e) => setForm({ ...form, direccion_mz: e.target.value })} /></Field>
          <Field label="Lote"><input className={inp} value={form.direccion_lt} onChange={(e) => setForm({ ...form, direccion_lt: e.target.value })} /></Field>
          <Field label="Número de puerta"><input className={inp} value={form.numero_puerta} onChange={(e) => setForm({ ...form, numero_puerta: e.target.value })} /></Field>
          <Field label="Interior / Dpto"><input className={inp} value={form.interior} onChange={(e) => setForm({ ...form, interior: e.target.value })} /></Field>
          <Field label="Urbanización (sin contar tipo_via)"><input className={inp} value={form.urbanizacion} onChange={(e) => setForm({ ...form, urbanizacion: e.target.value })} /></Field>
          <Field label="Referencia" className="md:col-span-3"><input className={inp} value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} /></Field>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Ubigeo INEI (alimenta ZipCode, Block, City, County en SAP)</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="Buscar distrito / provincia" className="md:col-span-2">
            <input className={inp} value={ubigeoQuery} onChange={(e) => setUbigeoQuery(e.target.value)} placeholder="ej. Ica, Lima, Jesús María…" />
          </Field>
          <Field label="Código ubigeo seleccionado">
            <input className={inp} value={form.ubigeo_cod} readOnly placeholder="—" />
          </Field>
        </div>
        {ubigeoResults.length > 0 && (
          <div className="mt-2 max-h-48 overflow-auto rounded border border-slate-200 bg-slate-50 text-xs">
            {ubigeoResults.map((u) => (
              <button
                key={u.codigo}
                onClick={() => { setForm({ ...form, ubigeo_cod: u.codigo }); setUbigeoQuery(`${u.distrito}, ${u.provincia}, ${u.departamento}`); setUbigeoResults([]); }}
                className="block w-full border-b border-slate-200 px-3 py-1.5 text-left hover:bg-indigo-50"
              >
                <code className="text-indigo-600">{u.codigo}</code> · {u.distrito}, {u.provincia}, {u.departamento}
              </button>
            ))}
          </div>
        )}
      </section>

      {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="flex justify-end gap-2">
        <button onClick={() => router.back()} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancelar</button>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-50">
          <Save className="h-4 w-4" /> {saving ? 'Guardando…' : 'Guardar cliente'}
        </button>
      </div>
    </div>
  );
}

const inp = 'h-9 w-full rounded-md border border-slate-300 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}

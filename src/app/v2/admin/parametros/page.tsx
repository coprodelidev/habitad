'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { useV2User } from '@/lib/v2/useV2User';
import { isAdmin } from '@/lib/v2/permissions';
import { X, Plus } from 'lucide-react';

interface Param {
  clave: string;
  valor: any;
  descripcion: string | null;
}

export default function ParametrosPage() {
  const { user, loading: loadingUser } = useV2User();
  const [items, setItems] = useState<Record<string, any>>({});
  const [descs, setDescs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const canAdmin = isAdmin(user?.roleCode);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabaseV2.from('parametros').select('*').order('clave');
    const d: Record<string, any> = {};
    const ds: Record<string, string> = {};
    for (const p of (data ?? []) as Param[]) {
      d[p.clave] = p.valor;
      if (p.descripcion) ds[p.clave] = p.descripcion;
    }
    setItems(d);
    setDescs(ds);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (clave: string, valor: any) => {
    setSaving(clave);
    setOk(null);
    const { error } = await supabaseV2.from('parametros').update({ valor }).eq('clave', clave);
    setSaving(null);
    if (!error) {
      setOk(clave);
      setTimeout(() => setOk(null), 2500);
      load();
    }
  };

  if (loadingUser) return <div className="text-slate-500">Cargando…</div>;
  if (!canAdmin) return <div className="rounded bg-yellow-50 p-4 text-sm text-yellow-800">Solo administradores.</div>;
  if (loading) return <div className="text-slate-500">Cargando parámetros…</div>;

  return (
    <div className="max-w-2xl">
      {ok && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm text-white shadow-lg transition-opacity">
          <span className="text-base leading-none">✓</span>
          <span>Guardado: <strong>{ok}</strong></span>
        </div>
      )}
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Parámetros del sistema</h1>
      <p className="mb-6 text-sm text-slate-500">
        Configura los valores que usa Habitad. Los cambios se aplican inmediatamente.
      </p>

      <div className="space-y-5">
        <Card
          title="Plazo de separación"
          desc="Horas de vigencia de una separación. Al vencer se notifica para revisar el retiro; la liberación requiere confirmación."
          saved={ok === 'separacion_horas'}
          saving={saving === 'separacion_horas'}
        >
          <NumberField
            suffix="horas"
            value={Number(items.separacion_horas ?? 24)}
            min={1}
            max={168}
            onSave={(n) => save('separacion_horas', n)}
          />
        </Card>

        <Card
          title="Plazo para completar inicial"
          desc="Meses máximos desde la separación para completar el pago de la inicial."
          saved={ok === 'inicial_meses'}
          saving={saving === 'inicial_meses'}
        >
          <NumberField
            suffix="meses"
            value={Number(items.inicial_meses ?? 3)}
            min={1}
            max={12}
            onSave={(n) => save('inicial_meses', n)}
          />
        </Card>

        <Card
          title="Moneda base"
          desc="Moneda predeterminada al crear nuevas propiedades."
          saved={ok === 'moneda_base'}
          saving={saving === 'moneda_base'}
        >
          <SelectField
            value={String(items.moneda_base ?? 'USD')}
            options={[{ v: 'USD', l: 'Dólares (USD)' }, { v: 'PEN', l: 'Soles (PEN)' }]}
            onSave={(v) => save('moneda_base', v)}
          />
        </Card>

        <Card
          title="Bancos permitidos"
          desc="Lista de bancos que aparecerán al registrar un pago. Pulsa Enter para añadir."
          saved={ok === 'bancos_permitidos'}
          saving={saving === 'bancos_permitidos'}
        >
          <TagsField
            value={Array.isArray(items.bancos_permitidos) ? items.bancos_permitidos : []}
            onSave={(arr) => save('bancos_permitidos', arr)}
          />
        </Card>

        <Card
          title="Recordatorio de cuotas"
          desc="Días de anticipación para notificar el próximo vencimiento de cuota."
          saved={ok === 'notif_recordatorio_cuota_dias'}
          saving={saving === 'notif_recordatorio_cuota_dias'}
        >
          <NumberField
            suffix="días antes"
            value={Number(items.notif_recordatorio_cuota_dias ?? 3)}
            min={0}
            max={30}
            onSave={(n) => save('notif_recordatorio_cuota_dias', n)}
          />
        </Card>

        <Card
          title="Plantilla de contratos y hojas (cabecera, pie, logo, cláusulas)"
          desc="Render dinámico que se aplica a hoja de separación, contrato y cronograma. Las cláusulas son texto libre; van al final de cada documento."
          saved={ok === 'plantilla_contrato' || ok === 'plantilla_separacion'}
          saving={saving === 'plantilla_contrato' || saving === 'plantilla_separacion'}
        >
          <PlantillaEditor
            plantilla={(items.plantilla_contrato as any) ?? { version: 1 }}
            onSave={(p) => {
              save('plantilla_contrato', p);
              save('plantilla_separacion', { ...((items.plantilla_separacion as any) ?? { version: 1 }), cabecera: p.cabecera, pie: p.pie, logo_url: p.logo_url });
            }}
          />
        </Card>
      </div>

      {/* ========= DATOS LEGALES DE LA EMPRESA ========= */}
      <h2 className="mt-10 mb-3 text-lg font-semibold text-slate-900">Datos legales de la empresa</h2>
      <div className="space-y-5">
        <Card title="Razón social" desc="Nombre legal completo que aparece en los precontratos."
          saved={ok === 'empresa_nombre'} saving={saving === 'empresa_nombre'}>
          <TextField value={String(items.empresa_nombre ?? '')} onSave={(v) => save('empresa_nombre', v)} />
        </Card>
        <Card title="RUC" desc="RUC de la empresa."
          saved={ok === 'empresa_ruc'} saving={saving === 'empresa_ruc'}>
          <TextField value={String(items.empresa_ruc ?? '')} onSave={(v) => save('empresa_ruc', v)} />
        </Card>
        <Card title="Representante legal — Nombre" desc="Apoderada(o) que firma los precontratos."
          saved={ok === 'empresa_representante_nombre'} saving={saving === 'empresa_representante_nombre'}>
          <TextField value={String(items.empresa_representante_nombre ?? '')} onSave={(v) => save('empresa_representante_nombre', v)} />
        </Card>
        <Card title="Representante legal — DNI" desc="DNI del apoderado(a)."
          saved={ok === 'empresa_representante_dni'} saving={saving === 'empresa_representante_dni'}>
          <TextField value={String(items.empresa_representante_dni ?? '')} onSave={(v) => save('empresa_representante_dni', v)} />
        </Card>
        <Card title="Representante legal — Partida" desc="Partida electrónica de los poderes."
          saved={ok === 'empresa_representante_partida'} saving={saving === 'empresa_representante_partida'}>
          <TextField value={String(items.empresa_representante_partida ?? '')} onSave={(v) => save('empresa_representante_partida', v)} />
        </Card>
        <Card title="Domicilio fiscal" desc="Dirección fiscal completa que aparece en los precontratos."
          saved={ok === 'empresa_domicilio_fiscal'} saving={saving === 'empresa_domicilio_fiscal'}>
          <TextField value={String(items.empresa_domicilio_fiscal ?? '')} onSave={(v) => save('empresa_domicilio_fiscal', v)} />
        </Card>
      </div>

      {/* ========= DATOS DEL PROYECTO ========= */}
      <h2 className="mt-10 mb-3 text-lg font-semibold text-slate-900">Datos del proyecto inmobiliario</h2>
      <div className="space-y-5">
        <Card title="Nombre comercial del proyecto" desc="Nombre que se mencionará en los precontratos."
          saved={ok === 'proyecto_nombre'} saving={saving === 'proyecto_nombre'}>
          <TextField value={String(items.proyecto_nombre ?? '')} onSave={(v) => save('proyecto_nombre', v)} />
        </Card>
        <Card title="Partida registral del terreno matriz"
          desc="Número de partida registral donde está inscrito el terreno del proyecto."
          saved={ok === 'proyecto_partida_registral'} saving={saving === 'proyecto_partida_registral'}>
          <TextField value={String(items.proyecto_partida_registral ?? '')} onSave={(v) => save('proyecto_partida_registral', v)} />
        </Card>
        <Card title="Ubicación del proyecto"
          desc="Dirección descriptiva del terreno matriz (sector, lote, distrito, provincia, departamento)."
          saved={ok === 'proyecto_ubicacion'} saving={saving === 'proyecto_ubicacion'}>
          <TextField value={String(items.proyecto_ubicacion ?? '')} onSave={(v) => save('proyecto_ubicacion', v)} />
        </Card>
        <Card title="Área total del terreno" desc="Área del terreno matriz (ej. 70 Has)."
          saved={ok === 'proyecto_terreno_area'} saving={saving === 'proyecto_terreno_area'}>
          <TextField value={String(items.proyecto_terreno_area ?? '')} onSave={(v) => save('proyecto_terreno_area', v)} />
        </Card>
      </div>

      {/* ========= CUENTAS BANCARIAS ========= */}
      <h2 className="mt-10 mb-3 text-lg font-semibold text-slate-900">Cuentas bancarias recaudadoras (BANBIF)</h2>
      <div className="space-y-5">
        <Card title="Cuenta SIN DATA (separación/inicial)" desc="Nombre de la cuenta para separaciones e iniciales."
          saved={ok === 'cuenta_banbif_sin_data'} saving={saving === 'cuenta_banbif_sin_data'}>
          <TextField value={String(items.cuenta_banbif_sin_data ?? '')} onSave={(v) => save('cuenta_banbif_sin_data', v)} />
        </Card>
        <Card title="Cuenta CON DATA — Terrenos" desc="Nombre de la cuenta para cuotas de terrenos."
          saved={ok === 'cuenta_banbif_con_data_terreno'} saving={saving === 'cuenta_banbif_con_data_terreno'}>
          <TextField value={String(items.cuenta_banbif_con_data_terreno ?? '')} onSave={(v) => save('cuenta_banbif_con_data_terreno', v)} />
        </Card>
        <Card title="Cuenta CON DATA — Casas" desc="Nombre de la cuenta para cuotas de casas."
          saved={ok === 'cuenta_banbif_con_data_casas'} saving={saving === 'cuenta_banbif_con_data_casas'}>
          <TextField value={String(items.cuenta_banbif_con_data_casas ?? '')} onSave={(v) => save('cuenta_banbif_con_data_casas', v)} />
        </Card>
      </div>

      {/* ========= MORA Y PENALIDADES ========= */}
      <h2 className="mt-10 mb-3 text-lg font-semibold text-slate-900">Mora y penalidades</h2>
      <div className="space-y-5">
        <Card title="Mora diaria — Terreno" desc="Monto en soles por día de atraso en cuotas de terreno."
          saved={ok === 'mora_diaria_terreno'} saving={saving === 'mora_diaria_terreno'}>
          <NumberField suffix="S/ por día" value={Number(items.mora_diaria_terreno ?? 2.5)} min={0}
            onSave={(n) => save('mora_diaria_terreno', n)} />
        </Card>
        <Card title="Mora diaria — Casa" desc="Monto en soles por día de atraso en cuotas de casa."
          saved={ok === 'mora_diaria_casa'} saving={saving === 'mora_diaria_casa'}>
          <NumberField suffix="S/ por día" value={Number(items.mora_diaria_casa ?? 2)} min={0}
            onSave={(n) => save('mora_diaria_casa', n)} />
        </Card>
        <Card title="Tasa de mora anual" desc="Interés moratorio anual (%) cuando se vence el plazo."
          saved={ok === 'tasa_mora_anual'} saving={saving === 'tasa_mora_anual'}>
          <NumberField suffix="% anual" value={Number(items.tasa_mora_anual ?? 12)} min={0} max={100}
            onSave={(n) => save('tasa_mora_anual', n)} />
        </Card>
        <Card title="Tasa de interés CON DATA" desc="Tasa anual para cuotas con interés (default)."
          saved={ok === 'tasa_interes_con_data_default'} saving={saving === 'tasa_interes_con_data_default'}>
          <NumberField suffix="% anual" value={Number(items.tasa_interes_con_data_default ?? 8)} min={0} max={100}
            onSave={(n) => save('tasa_interes_con_data_default', n)} />
        </Card>
        <Card title="Penalidad por retiro — Terreno"
          desc="Monto a retener si el comprador se retira del contrato (terreno)."
          saved={ok === 'penalidad_retiro_terreno'} saving={saving === 'penalidad_retiro_terreno'}>
          <NumberField suffix="S/" value={Number(items.penalidad_retiro_terreno ?? 3500)} min={0}
            onSave={(n) => save('penalidad_retiro_terreno', n)} />
        </Card>
        <Card title="Penalidad por retiro — Casa"
          desc="Monto a retener si el comprador se retira del contrato (casa)."
          saved={ok === 'penalidad_retiro_casa'} saving={saving === 'penalidad_retiro_casa'}>
          <NumberField suffix="S/" value={Number(items.penalidad_retiro_casa ?? 3000)} min={0}
            onSave={(n) => save('penalidad_retiro_casa', n)} />
        </Card>
        <Card title="Penalidad MiVivienda — No elegible"
          desc="Penalidad si el expediente resulta no elegible (insubsanable)."
          saved={ok === 'penalidad_mivivienda_no_elegible'} saving={saving === 'penalidad_mivivienda_no_elegible'}>
          <NumberField suffix="S/" value={Number(items.penalidad_mivivienda_no_elegible ?? 5000)} min={0}
            onSave={(n) => save('penalidad_mivivienda_no_elegible', n)} />
        </Card>
        <Card title="Penalidad retiro post-bono"
          desc="Penalidad si el comprador se retira tras desembolsado el bono."
          saved={ok === 'penalidad_retiro_post_bono'} saving={saving === 'penalidad_retiro_post_bono'}>
          <NumberField suffix="S/" value={Number(items.penalidad_retiro_post_bono ?? 5000)} min={0}
            onSave={(n) => save('penalidad_retiro_post_bono', n)} />
        </Card>
      </div>

      {/* ========= CANALES DE COBRANZA ========= */}
      <h2 className="mt-10 mb-3 text-lg font-semibold text-slate-900">Canales de cobranza</h2>
      <div className="space-y-5">
        <Card title="WhatsApp de cobranza" desc="Número al que los clientes envían vouchers."
          saved={ok === 'whatsapp_cobranza'} saving={saving === 'whatsapp_cobranza'}>
          <TextField value={String(items.whatsapp_cobranza ?? '')} onSave={(v) => save('whatsapp_cobranza', v)} />
        </Card>
        <Card title="Email de cobranza" desc="Email al que los clientes envían vouchers como alternativa al WhatsApp."
          saved={ok === 'email_cobranza'} saving={saving === 'email_cobranza'}>
          <TextField value={String(items.email_cobranza ?? '')} onSave={(v) => save('email_cobranza', v)} />
        </Card>
      </div>
    </div>
  );
}

function Card({ title, desc, saved, saving, children }: { title: string; desc: string; saved?: boolean; saving?: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {saving && <span className="text-xs text-slate-500">Guardando…</span>}
        {saved && <span className="text-xs text-green-600">✓ Guardado</span>}
      </div>
      <p className="mb-3 text-xs text-slate-500">{desc}</p>
      {children}
    </div>
  );
}

function NumberField({ value, min, max, suffix, onSave }: { value: number; min?: number; max?: number; suffix?: string; onSave: (n: number) => void }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <div className="flex items-center gap-3">
      <input
        type="number"
        value={v}
        min={min}
        max={max}
        onChange={(e) => setV(Number(e.target.value))}
        className="h-10 w-28 rounded-md border border-slate-300 px-3 text-sm"
      />
      {suffix && <span className="text-sm text-slate-600">{suffix}</span>}
      {v !== value && (
        <button
          onClick={() => onSave(v)}
          className="ml-auto rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500"
        >
          Guardar
        </button>
      )}
    </div>
  );
}

function SelectField({ value, options, onSave }: { value: string; options: { v: string; l: string }[]; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <div className="flex items-center gap-3">
      <select
        value={v}
        onChange={(e) => setV(e.target.value)}
        className="h-10 w-56 rounded-md border border-slate-300 px-3 text-sm"
      >
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
      {v !== value && (
        <button
          onClick={() => onSave(v)}
          className="ml-auto rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500"
        >
          Guardar
        </button>
      )}
    </div>
  );
}

function TextField({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <div className="flex items-center gap-3">
      <input
        type="text"
        value={v}
        onChange={(e) => setV(e.target.value)}
        className="h-10 flex-1 rounded-md border border-slate-300 px-3 text-sm"
      />
      {v !== value && (
        <button
          onClick={() => onSave(v)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500"
        >
          Guardar
        </button>
      )}
    </div>
  );
}

function TagsField({ value, onSave }: { value: string[]; onSave: (arr: string[]) => void }) {
  const [tags, setTags] = useState<string[]>(value);
  const [input, setInput] = useState('');
  useEffect(() => setTags(value), [value]);

  const add = () => {
    const t = input.trim();
    if (!t || tags.includes(t)) return;
    setTags([...tags, t]);
    setInput('');
  };

  const remove = (t: string) => setTags(tags.filter((x) => x !== t));

  const changed = JSON.stringify(tags) !== JSON.stringify(value);

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-800">
            {t}
            <button onClick={() => remove(t)} className="text-slate-400 hover:text-slate-700">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-xs text-slate-400">Sin bancos</span>}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          placeholder="Añadir banco (ej: BCP)"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          className="h-10 flex-1 rounded-md border border-slate-300 px-3 text-sm"
        />
        <button
          onClick={add}
          disabled={!input.trim()}
          className="inline-flex h-10 items-center gap-1 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Añadir
        </button>
        {changed && (
          <button
            onClick={() => onSave(tags)}
            className="ml-auto rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500"
          >
            Guardar
          </button>
        )}
      </div>
    </div>
  );
}

interface PlantillaConfig {
  version?: number;
  cabecera?: string;
  pie?: string;
  logo_url?: string;
  clausulas?: string[];
}

function PlantillaEditor({ plantilla, onSave }: { plantilla: PlantillaConfig; onSave: (p: PlantillaConfig) => void }) {
  const [cabecera, setCabecera] = useState(plantilla.cabecera ?? 'COPRODELI');
  const [pie, setPie] = useState(plantilla.pie ?? '');
  const [logoUrl, setLogoUrl] = useState(plantilla.logo_url ?? '');
  const [clausulas, setClausulas] = useState<string[]>(plantilla.clausulas ?? []);
  const [nuevaClausula, setNuevaClausula] = useState('');

  useEffect(() => {
    setCabecera(plantilla.cabecera ?? 'COPRODELI');
    setPie(plantilla.pie ?? '');
    setLogoUrl(plantilla.logo_url ?? '');
    setClausulas(plantilla.clausulas ?? []);
  }, [plantilla]);

  const changed =
    cabecera !== (plantilla.cabecera ?? 'COPRODELI') ||
    pie !== (plantilla.pie ?? '') ||
    logoUrl !== (plantilla.logo_url ?? '') ||
    JSON.stringify(clausulas) !== JSON.stringify(plantilla.clausulas ?? []);

  const addClausula = () => {
    const t = nuevaClausula.trim();
    if (!t) return;
    setClausulas([...clausulas, t]);
    setNuevaClausula('');
  };

  const removeClausula = (i: number) => setClausulas(clausulas.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Cabecera (nombre que aparece arriba)</label>
        <input
          type="text"
          value={cabecera}
          onChange={(e) => setCabecera(e.target.value)}
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">URL del logo (opcional, se renderiza en la cabecera)</label>
        <input
          type="text"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://… o ruta del bucket de Supabase"
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
        />
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="preview" className="mt-2 h-12 w-auto rounded border border-slate-200 bg-white p-1" />
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Pie de página (texto al final de cada documento)</label>
        <textarea
          value={pie}
          onChange={(e) => setPie(e.target.value)}
          rows={2}
          placeholder="Ej: Coprodeli — Av. Guardia Chalaca 1371, Callao · cobranza@coprodeli.org · WhatsApp 989 172 061"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Cláusulas adicionales (se imprimen al final del precontrato)</label>
        <div className="space-y-2">
          {clausulas.map((c, i) => (
            <div key={i} className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 p-2">
              <span className="mt-1 text-xs font-medium text-slate-500">{i + 1}.</span>
              <textarea
                value={c}
                onChange={(e) => {
                  const next = [...clausulas];
                  next[i] = e.target.value;
                  setClausulas(next);
                }}
                rows={2}
                className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
              />
              <button onClick={() => removeClausula(i)} className="mt-1 text-red-500 hover:text-red-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {clausulas.length === 0 && <p className="text-xs italic text-slate-400">Sin cláusulas adicionales.</p>}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="text"
            value={nuevaClausula}
            onChange={(e) => setNuevaClausula(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addClausula())}
            placeholder="Nueva cláusula"
            className="h-9 flex-1 rounded-md border border-slate-300 px-3 text-sm"
          />
          <button
            onClick={addClausula}
            disabled={!nuevaClausula.trim()}
            className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-300 bg-white px-3 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Añadir
          </button>
        </div>
      </div>

      {changed && (
        <button
          onClick={() => onSave({ version: 1, cabecera, pie, logo_url: logoUrl, clausulas })}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500"
        >
          Guardar plantilla
        </button>
      )}
    </div>
  );
}

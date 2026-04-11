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
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Parámetros del sistema</h1>
      <p className="mb-6 text-sm text-slate-500">
        Configura los valores que usa Habitad. Los cambios se aplican inmediatamente.
      </p>

      <div className="space-y-5">
        <Card
          title="Plazo de separación"
          desc="Horas que una separación está vigente antes de liberarse automáticamente."
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
          title="Cabecera del contrato"
          desc="Nombre de la empresa que aparece en la plantilla del contrato y de la hoja de separación."
          saved={ok === 'plantilla_contrato'}
          saving={saving === 'plantilla_contrato'}
        >
          <TextField
            value={String((items.plantilla_contrato as any)?.cabecera ?? 'COPRODELI')}
            onSave={(v) => {
              const current = (items.plantilla_contrato as any) ?? { version: 1 };
              save('plantilla_contrato', { ...current, cabecera: v });
              save('plantilla_separacion', { ...((items.plantilla_separacion as any) ?? { version: 1 }), cabecera: v });
            }}
          />
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

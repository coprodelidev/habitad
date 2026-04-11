'use client';

import { useEffect, useState } from 'react';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { useV2User } from '@/lib/v2/useV2User';
import { isAdmin } from '@/lib/v2/permissions';

interface Param { clave: string; valor: any; descripcion: string | null; }

export default function ParametrosPage() {
  const { user, loading: loadingUser } = useV2User();
  const [items, setItems] = useState<Param[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const canAdmin = isAdmin(user?.roleCode);

  const load = async () => {
    setLoading(true);
    const { data } = await supabaseV2.from('parametros').select('*').order('clave');
    setItems((data ?? []) as Param[]);
    const d: Record<string, string> = {};
    for (const p of data ?? []) d[p.clave] = JSON.stringify(p.valor);
    setDrafts(d);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async (clave: string) => {
    setSaving(clave);
    try {
      const parsed = JSON.parse(drafts[clave] ?? 'null');
      await supabaseV2.from('parametros').update({ valor: parsed }).eq('clave', clave);
      await load();
    } catch (e) {
      alert('JSON inválido');
    } finally {
      setSaving(null);
    }
  };

  if (loadingUser) return <div className="text-slate-500">Cargando…</div>;
  if (!canAdmin) return <div className="rounded bg-yellow-50 p-4 text-sm text-yellow-800">Solo administradores.</div>;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Parámetros</h1>
      {loading ? (
        <div>Cargando…</div>
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <div key={p.clave} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-1 flex items-center justify-between">
                <div>
                  <code className="text-sm font-semibold text-slate-900">{p.clave}</code>
                  {p.descripcion && <div className="text-xs text-slate-500">{p.descripcion}</div>}
                </div>
                <button
                  onClick={() => save(p.clave)}
                  disabled={saving === p.clave}
                  className="rounded bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {saving === p.clave ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
              <textarea
                className="mt-2 h-20 w-full rounded border border-slate-300 px-2 py-1 font-mono text-xs"
                value={drafts[p.clave] ?? ''}
                onChange={(e) => setDrafts({ ...drafts, [p.clave]: e.target.value })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

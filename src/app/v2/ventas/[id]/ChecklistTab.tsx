'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseV2, supabasePublic } from '@/lib/v2/supabaseV2';
import type { Venta } from '@/lib/v2/types';
import { formatDateTime } from '@/lib/v2/format';
import { DocumentDrawer } from '@/components/v2/DocumentDrawer';

interface ChecklistItem {
  id: string;
  item: string;
  completado: boolean;
  url?: string | null;
  completado_at?: string | null;
}

const DEFAULT_ITEMS = [
  { key: 'dni', label: 'DNI del cliente' },
  { key: 'voucher_separacion', label: 'Voucher de separación' },
  { key: 'hoja_firmada', label: 'Hoja de separación firmada' },
];

export function ChecklistTab({ venta, canOperate }: { venta: Venta; canOperate: boolean }) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingItem, setUploadingItem] = useState<string | null>(null);
  const [viewing, setViewing] = useState<{ path: string; title: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabaseV2.from('checklist_venta').select('*').eq('venta_id', venta.id);
    setItems((data ?? []) as ChecklistItem[]);
    setLoading(false);
  }, [venta.id]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (itemKey: string, file: File | null) => {
    if (!file) return;
    setUploadingItem(itemKey);
    const ext = file.name.split('.').pop();
    const path = `${venta.id}/checklist_${itemKey}_${Date.now()}.${ext}`;
    const up = await supabasePublic.storage.from('v2-documentos').upload(path, file, { upsert: true });
    if (!up.error && up.data) {
      const existing = items.find((i) => i.item === itemKey);
      if (existing) {
        await supabaseV2.from('checklist_venta').update({
          completado: true,
          url: up.data.path,
          completado_at: new Date().toISOString(),
        }).eq('id', existing.id);
      } else {
        await supabaseV2.from('checklist_venta').insert({
          venta_id: venta.id,
          item: itemKey,
          completado: true,
          url: up.data.path,
          completado_at: new Date().toISOString(),
        });
      }
    }
    setUploadingItem(null);
    load();
  };

  const toggle = async (itemKey: string, completado: boolean) => {
    const existing = items.find((i) => i.item === itemKey);
    if (existing) {
      await supabaseV2.from('checklist_venta').update({
        completado,
        completado_at: completado ? new Date().toISOString() : null,
      }).eq('id', existing.id);
    } else {
      await supabaseV2.from('checklist_venta').insert({
        venta_id: venta.id,
        item: itemKey,
        completado,
        completado_at: completado ? new Date().toISOString() : null,
      });
    }
    load();
  };

  if (loading) return <div className="text-slate-500">Cargando checklist…</div>;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Checklist documental</h3>
      <p className="text-xs text-slate-500">
        Físico máximo 3 días. Sube los documentos escaneados aquí para tener el respaldo centralizado.
      </p>
      <div className="rounded-lg border border-slate-200 bg-white">
        {DEFAULT_ITEMS.map((d) => {
          const item = items.find((i) => i.item === d.key);
          return (
            <div key={d.key} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0">
              <input
                type="checkbox"
                checked={!!item?.completado}
                disabled={!canOperate}
                onChange={(e) => toggle(d.key, e.target.checked)}
                className="h-4 w-4"
              />
              <div className="flex-1">
                <div className="font-medium text-slate-900">{d.label}</div>
                {item?.completado_at && (
                  <div className="text-xs text-slate-500">Completado {formatDateTime(item.completado_at)}</div>
                )}
              </div>
              {item?.url && (
                <button
                  onClick={() => setViewing({ path: item.url!, title: d.label })}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Ver
                </button>
              )}
              {canOperate && (
                <label className="cursor-pointer rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50">
                  {uploadingItem === d.key ? 'Subiendo…' : item?.url ? 'Reemplazar' : 'Subir'}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => handleUpload(d.key, e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>
      {viewing && (
        <DocumentDrawer
          bucket="v2-documentos"
          path={viewing.path}
          title={viewing.title}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}

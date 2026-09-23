'use client';

import { useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { formatMoney } from '@/lib/v2/format';
import { MOTIVOS_RETIRO, PENALIDAD_RETIRO_SUGERIDA, type MotivoRetiro } from '@/lib/v2/retiros';
import type { Propiedad, Venta } from '@/lib/v2/types';

export function RetiroModal({ venta, propiedad, onClose, onCreated }: {
  venta: Venta;
  propiedad: Propiedad;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [motivo, setMotivo] = useState<MotivoRetiro | ''>('');
  const [penalidad, setPenalidad] = useState(String(PENALIDAD_RETIRO_SUGERIDA));
  const [observacion, setObservacion] = useState('');
  const [confirmado, setConfirmado] = useState(false);
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const seleccionado = MOTIVOS_RETIRO.find((m) => m.codigo === motivo);
  const monto = seleccionado?.penalidad ? Number(penalidad) : 0;
  const montoValido = !seleccionado?.penalidad || (/^\d+(\.\d{1,2})?$/.test(penalidad) && monto > 0 && monto < 10000000000);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seleccionado || !confirmado || !montoValido || submitting.current) return;
    submitting.current = true;
    setSaving(true);
    setError(null);
    try {
      const result = await supabaseV2.rpc('registrar_retiro', {
        p_venta_id: venta.id, p_motivo: motivo, p_penalidad: monto,
        p_observacion: observacion.trim() || null, p_confirmado: confirmado,
      });
      if (result.error) throw result.error;
      onCreated();
    } catch (err) {
      setError((err as { message?: string }).message ?? 'No se pudo registrar el retiro. Intente nuevamente.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !submitting.current) onClose(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Retirar cliente y liberar ubicación</DialogTitle>
          <DialogDescription>Mz {propiedad.manzana ?? '—'} - Lt {propiedad.lote ?? '—'} · {propiedad.cuh}</DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p>Al confirmar se cancelará esta venta y la ubicación quedará disponible para otro cliente. El expediente pasará a <strong>Retirados</strong> para gestionar la devolución. Los pagos y el historial se conservarán.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium">Motivo del retiro *
            <select required value={motivo} disabled={saving} onChange={(e) => { setMotivo(e.target.value as MotivoRetiro | ''); setConfirmado(false); }} className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2">
              <option value="">Seleccione un motivo</option>
              {MOTIVOS_RETIRO.map((m) => <option key={m.codigo} value={m.codigo}>{m.label} ({m.penalidad ? 'con penalidad' : 'sin penalidad'})</option>)}
            </select>
          </label>
          {seleccionado && (seleccionado.penalidad ? (
            <label className="block text-sm font-medium">Penalidad en soles (S/) *
              <input type="number" inputMode="decimal" min="0.01" max="9999999999.99" step="0.01" required disabled={saving} value={penalidad}
                onChange={(e) => { setPenalidad(e.target.value); setConfirmado(false); }} className="mt-1 w-full rounded-md border border-slate-300 p-2" />
              <span className="mt-1 block text-xs font-normal text-slate-500">Monto sugerido: S/ 3,700.00. Revise y ajuste el importe antes de confirmar. La penalidad se registra en soles, incluso si la venta está en dólares.</span>
            </label>
          ) : <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">Este motivo no tiene penalidad: S/ 0.00.</p>)}
          <label className="block text-sm font-medium">Observación inicial (opcional)
            <textarea value={observacion} disabled={saving} maxLength={2000} rows={3} onChange={(e) => setObservacion(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2" placeholder="Indique los detalles que el equipo debe revisar." />
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={confirmado} disabled={saving || !seleccionado || !montoValido} onChange={(e) => setConfirmado(e.target.checked)} className="mt-1" />
            <span>He revisado el motivo y {seleccionado?.penalidad ? `la penalidad de ${formatMoney(monto, 'PEN')}` : 'la ausencia de penalidad'}. Confirmo el retiro del cliente y la liberación de la ubicación.</span>
          </label>
          {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" disabled={saving} onClick={onClose} className="rounded-md border px-4 py-2 text-sm disabled:opacity-50">Volver</button>
            <button type="submit" disabled={saving || !seleccionado || !confirmado || !montoValido} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">{saving ? 'Registrando retiro…' : 'Confirmar retiro y liberar'}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

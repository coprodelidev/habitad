'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabaseV2 } from '@/lib/v2/supabaseV2';
import { useV2User } from '@/lib/v2/useV2User';
import { isStaff, isAdmin } from '@/lib/v2/permissions';
import { formatDate, formatDateTime, formatMoney, timeRemaining } from '@/lib/v2/format';
import type { Venta, Propiedad, Cliente, Pago, Cuota, SaldoVenta } from '@/lib/v2/types';
import { ResumenTab } from './ResumenTab';
import { SeparacionTab } from './SeparacionTab';
import { InicialTab } from './InicialTab';
import { ContratoTab } from './ContratoTab';
import { CuotasTab } from './CuotasTab';
import { ChecklistTab } from './ChecklistTab';
import { MiViviendaTab } from './MiViviendaTab';
import { CorteCancelacionTab } from './CorteCancelacionTab';

type Tab = 'resumen' | 'separacion' | 'inicial' | 'contrato' | 'cuotas' | 'checklist' | 'mivivienda' | 'corte';

export default function VentaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useV2User();
  const [venta, setVenta] = useState<Venta | null>(null);
  const [propiedad, setPropiedad] = useState<Propiedad | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [saldos, setSaldos] = useState<SaldoVenta | null>(null);
  const [tab, setTab] = useState<Tab>('resumen');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canOperate = isStaff(user?.roleCode);
  const canAdmin = isAdmin(user?.roleCode);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const v = await supabaseV2.from('ventas').select('*').eq('id', id).maybeSingle();
    if (v.error || !v.data) {
      setError(v.error?.message ?? 'Venta no encontrada');
      setLoading(false);
      return;
    }
    const vnta = v.data as Venta;
    setVenta(vnta);
    const [p, c, pgs, cts, sd] = await Promise.all([
      supabaseV2.from('propiedades').select('*').eq('id', vnta.propiedad_id).maybeSingle(),
      supabaseV2.from('clientes').select('*').eq('id', vnta.cliente_id).maybeSingle(),
      supabaseV2.from('pagos').select('*').eq('venta_id', id).order('fecha_deposito'),
      supabaseV2.from('cuotas').select('*').eq('venta_id', id).order('numero'),
      supabaseV2.from('vw_saldos_venta').select('*').eq('venta_id', id).maybeSingle(),
    ]);
    setPropiedad((p.data ?? null) as Propiedad | null);
    setCliente((c.data ?? null) as Cliente | null);
    setPagos((pgs.data ?? []) as Pago[]);
    setCuotas((cts.data ?? []) as Cuota[]);
    setSaldos((sd.data ?? null) as SaldoVenta | null);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="text-slate-500">Cargando…</div>;
  if (error || !venta) return <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error ?? 'No encontrada'}</div>;

  const tabs: Array<{ k: Tab; label: string; visible: boolean }> = [
    { k: 'resumen', label: 'Resumen', visible: true },
    { k: 'separacion', label: 'Separación', visible: true },
    { k: 'checklist', label: 'Checklist', visible: true },
    { k: 'inicial', label: 'Inicial', visible: venta.estado !== 'separacion' || !!venta.fecha_pago_separacion },
    { k: 'contrato', label: 'Contrato', visible: ['inicial', 'cuotas', 'entregada'].includes(venta.estado) },
    { k: 'cuotas', label: 'Cuotas', visible: ['cuotas', 'entregada'].includes(venta.estado) },
    { k: 'mivivienda', label: 'MiVivienda', visible: propiedad?.tipo === 'casa' && venta.modalidad_pago === 'bono_mivivienda' },
    { k: 'corte', label: 'Corte cancelacion', visible: propiedad?.tipo === 'casa' && ['cuotas', 'entregada'].includes(venta.estado) },
  ];

  return (
    <div>
      <div className="mb-4">
        <Link href="/v2/ventas" className="text-xs text-slate-500 hover:text-slate-700">← Ventas</Link>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {propiedad?.cuh} · {cliente?.nombres} {cliente?.apellidos}
            </h1>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
              <span>DNI {cliente?.dni}</span>
              <span>·</span>
              <span>Mz {propiedad?.manzana} / Lt {propiedad?.lote}</span>
              <span>·</span>
              <span>{propiedad?.tipo}</span>
              <span>·</span>
              <span>Separado {formatDate(venta.fecha_separacion)}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <EstadoBadge estado={venta.estado} />
            {venta.estado === 'separacion' && (
              <span className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                ⏱ {timeRemaining(venta.fecha_vencimiento_separacion)}
              </span>
            )}
            <span className="text-sm text-slate-700">{formatMoney(venta.precio_acordado, venta.moneda)}</span>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.filter((t) => t.visible).map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.k
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'resumen' && <ResumenTab venta={venta} propiedad={propiedad} cliente={cliente} saldos={saldos} pagos={pagos} />}
      {tab === 'separacion' && <SeparacionTab venta={venta} pagos={pagos} canOperate={canOperate} canAdmin={canAdmin} onChange={load} />}
      {tab === 'checklist' && <ChecklistTab venta={venta} canOperate={canOperate} />}
      {tab === 'inicial' && <InicialTab venta={venta} propiedad={propiedad} pagos={pagos} canOperate={canOperate} canAdmin={canAdmin} onChange={load} />}
      {tab === 'contrato' && <ContratoTab venta={venta} propiedad={propiedad} cliente={cliente} pagos={pagos} cuotas={cuotas} canOperate={canOperate} onChange={load} />}
      {tab === 'cuotas' && <CuotasTab venta={venta} cuotas={cuotas} pagos={pagos} canOperate={canOperate} canAdmin={canAdmin} onChange={load} />}
      {tab === 'mivivienda' && <MiViviendaTab venta={venta} canOperate={canOperate} onChange={load} />}
      {tab === 'corte' && <CorteCancelacionTab venta={venta} saldos={saldos} canOperate={canOperate} onChange={load} />}
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const c: Record<string, string> = {
    separacion: 'bg-yellow-100 text-yellow-800',
    inicial: 'bg-orange-100 text-orange-800',
    cuotas: 'bg-indigo-100 text-indigo-800',
    cancelada: 'bg-red-100 text-red-800',
    entregada: 'bg-green-100 text-green-800',
  };
  return <span className={`rounded px-2 py-1 text-xs capitalize ${c[estado] ?? 'bg-slate-100 text-slate-700'}`}>{estado}</span>;
}

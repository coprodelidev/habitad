'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { ArrowLeft, Download } from 'lucide-react';
import { supabasePublic, supabaseV2 } from '@/lib/v2/supabaseV2';
import { useV2User } from '@/lib/v2/useV2User';
import { isAdmin, isAuditor, isStaff } from '@/lib/v2/permissions';
import {
  buildCodPromotorAoa,
  buildMaestroClientesAoa,
  buildOrdenesCodigosAoa,
  buildOrdenesVentaAoa,
  buildSeparacionTerrenoAoa,
  buildSeparacionViviendaAoa,
  type SapPromotorProfile,
  type SapVentaLike,
} from '@/lib/v2/sapExport';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonth() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function downloadWorkbook(wb: XLSX.WorkBook, fileName: string) {
  XLSX.writeFile(wb, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
}

function buildUbigeoAoa(ventas: SapVentaLike[]) {
  const out: unknown[][] = [['Code', 'Distrito', 'Provincia', 'Departamento']];
  const seen = new Set<string>();
  for (const v of ventas) {
    const code = String(v.cliente?.ubigeo_code ?? v.cliente?.ubigeo ?? '').trim();
    const distrito = String(v.cliente?.distrito ?? '').trim();
    const provincia = String(v.cliente?.provincia ?? '').trim();
    const departamento = String(v.cliente?.departamento ?? '').trim();
    if (!code && !distrito && !provincia && !departamento) continue;
    const key = [code, distrito, provincia, departamento].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push([code, distrito, provincia, departamento]);
  }
  return out;
}

export default function ExportacionSapPage() {
  const { user, loading: loadingUser } = useV2User();

  const canAccess = useMemo(
    () => isAdmin(user?.roleCode) || isAuditor(user?.roleCode) || isStaff(user?.roleCode),
    [user?.roleCode],
  );

  const [desde, setDesde] = useState(firstOfMonth());
  const [hasta, setHasta] = useState(today());
  const [ventas, setVentas] = useState<SapVentaLike[]>([]);
  const [promotores, setPromotores] = useState<SapPromotorProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { data: ventasData, error: ventasError } = await supabaseV2
        .from('ventas')
        .select(
          `
          id, estado, precio_acordado, moneda, fecha_separacion, fecha_inicial_completa, fecha_contrato,
          promotor_id, meses_cuotas, monto_inicial_objetivo,
          concepto_cliente, valor_adicional_cv, abonos_cv,
          fmv_precio, fmv_bono_real, fmv_abono_cliente, fmv_donacion_coprodeli, fmv_gastos_administrativos, fmv_saldo, fmv_origen_bono, fmv_fecha_desembolso, fmv_estado_expediente,
          propiedad:propiedades(cuh, tipo, modelo, manzana, lote, area_m2, moneda, adicionales, etapa:etapas(codigo, nombre), sap_item_mapping(item_code, warehouse_code, ubicacion_sap)),
          cliente:clientes(nombres, apellidos, segundo_nombre, apellido_paterno, apellido_materno, dni, telefono, email, direccion, tipo_via, zona_nombre, direccion_mz, direccion_lt, numero_puerta, interior, referencia, ubigeo_cod, urbanizacion),
          cuotas:cuotas(numero, fecha_vencimiento, monto, estado),
          pagos:pagos(tipo, fecha_deposito, monto, moneda, tc_sbs, estado)
        `,
        )
        .gte('fecha_separacion', desde)
        .lte('fecha_separacion', `${hasta}T23:59:59`)
        .order('fecha_separacion', { ascending: false })
        .limit(5000);

      if (ventasError) throw ventasError;

      let ventasList = (ventasData ?? []) as unknown as SapVentaLike[];

      // Enriquecer con ubigeos (PostgREST no resuelve FK cross-schema automáticamente
      // para ubigeos cuando supabaseV2 ya está en v2). Hacemos join en cliente.
      const ubigeoCods = Array.from(new Set(ventasList.map((v) => v.cliente?.ubigeo_cod).filter(Boolean))) as string[];
      if (ubigeoCods.length > 0) {
        const { data: ubigeos } = await supabaseV2.from('ubigeos').select('*').in('codigo', ubigeoCods);
        const byCod: Record<string, any> = {};
        for (const u of (ubigeos ?? []) as any[]) byCod[u.codigo] = u;
        ventasList = ventasList.map((v) => {
          if (!v.cliente?.ubigeo_cod) return v;
          const u = byCod[v.cliente.ubigeo_cod];
          if (!u) return v;
          return { ...v, cliente: { ...v.cliente, distrito: u.distrito, provincia: u.provincia, departamento: u.departamento } };
        });
      }

      // Mover sap_item_mapping de propiedad → venta (sapExport lo lee a nivel venta)
      ventasList = ventasList.map((v: any) => {
        const mapping = Array.isArray(v.propiedad?.sap_item_mapping)
          ? v.propiedad.sap_item_mapping[0]
          : v.propiedad?.sap_item_mapping;
        return { ...v, sap_item_mapping: mapping ?? null };
      });

      // Enriquecer con comisión calculada del backend. PostgREST .in()
      // construye una URL ?venta_id=in.(uuid1,uuid2,...) que con >200 ids
      // supera el límite de 8KB. Fetcheamos en chunks de 200.
      const ventaIds = ventasList.map((v: any) => v.id);
      if (ventaIds.length > 0) {
        const byVenta: Record<string, number> = {};
        const CHUNK = 200;
        for (let i = 0; i < ventaIds.length; i += CHUNK) {
          const slice = ventaIds.slice(i, i + CHUNK);
          const { data: comisiones } = await supabaseV2
            .from('vw_comisiones_promotor')
            .select('venta_id, comision_calculada')
            .in('venta_id', slice);
          for (const c of (comisiones ?? []) as any[]) byVenta[c.venta_id] = Number(c.comision_calculada);
        }
        ventasList = ventasList.map((v: any) => ({ ...v, comision_calculada: byVenta[v.id] ?? null }));
      }

      setVentas(ventasList);

      const promoterIds = Array.from(
        new Set(ventasList.map((v) => v.promotor_id).filter((id): id is string => !!id)),
      );

      if (promoterIds.length > 0) {
        const { data: promotoresData, error: promotoresError } = await supabasePublic
          .from('profiles')
          .select('id, first_name, last_name, email, sap_sales_person_code')
          .in('id', promoterIds);
        if (promotoresError) throw promotoresError;
        setPromotores((promotoresData ?? []) as unknown as SapPromotorProfile[]);
      } else {
        setPromotores([]);
      }

      setMessage(`Datos cargados: ${ventasList.length} ventas en el rango.`);
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setVentas([]);
      setPromotores([]);
    } finally {
      setLoading(false);
    }
  };

  const exportMaestroClientes = () => {
    const data = buildMaestroClientesAoa(ventas, promotores);
    if (data.length <= 1) {
      setError('No hay datos para exportar maestro de clientes.');
      return;
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), 'CLIENTE NUEVO SAP 1');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(buildUbigeoAoa(ventas)), 'COD UBIGEO');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(buildCodPromotorAoa(promotores)), 'COD_PROMOTOR');
    downloadWorkbook(wb, `02_Maestro_de_Clientes_Habitat_${today()}.xlsx`);
  };

  const exportOrdenesVenta = () => {
    const data = buildOrdenesVentaAoa(ventas, promotores);
    if (data.length <= 1) {
      setError('No hay datos para exportar ordenes de venta.');
      return;
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), 'Cabecera_00 COPR - PLANTILLA OR');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(buildOrdenesCodigosAoa(promotores)), 'CODIGOS');
    downloadWorkbook(wb, `05_Ordenes_de_Venta_${today()}.xlsx`);
  };

  const exportSeparacion = () => {
    const viviendas = buildSeparacionViviendaAoa(ventas, promotores);
    const terrenos = buildSeparacionTerrenoAoa(ventas, promotores);
    if (viviendas.length <= 1 && terrenos.length <= 1) {
      setError('No hay datos para exportar formato de separacion.');
      return;
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(viviendas), 'VIVIENDA');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(terrenos), 'TERRENO');
    downloadWorkbook(wb, `MODELO_SEPARACION_INICIAL_${today()}.xlsx`);
  };

  if (loadingUser) return <div className="text-slate-500">Cargando...</div>;
  if (!canAccess) return <div className="rounded bg-yellow-50 p-4 text-sm text-yellow-800">No tienes permiso para exportaciones SAP.</div>;

  return (
    <div>
      <div className="mb-4">
        <Link href="/v2/reportes" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-3 w-3" /> Volver a reportes
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Exportacion SAP</h1>
        <p className="text-sm text-slate-500">Genera los 3 formatos solicitados por el cliente: maestro, ordenes y separacion.</p>
      </div>

      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="text-xs text-slate-600">
            Desde
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
            />
          </label>
          <label className="text-xs text-slate-600">
            Hasta
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
            />
          </label>
          <div className="flex items-end">
            <button
              onClick={loadData}
              disabled={loading}
              className="h-9 rounded-md bg-indigo-600 px-4 text-sm text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Cargar datos'}
            </button>
          </div>
          <div className="flex items-end text-xs text-slate-500">
            Ventas cargadas: <strong className="ml-1">{ventas.length}</strong>
          </div>
        </div>
      </div>

      {error && <div className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {message && <div className="mb-3 rounded bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <button
          onClick={exportMaestroClientes}
          disabled={ventas.length === 0}
          className="flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> 02 Maestro de Clientes
        </button>
        <button
          onClick={exportOrdenesVenta}
          disabled={ventas.length === 0}
          className="flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> 05 Ordenes de Venta
        </button>
        <button
          onClick={exportSeparacion}
          disabled={ventas.length === 0}
          className="flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> Modelo Separacion
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        Nota: si faltan codigos SAP maestros (item/account/cost center/partida/subpartida), los campos salen en blanco
        o con valores por defecto configurables en propiedad.adicionales.
      </div>
    </div>
  );
}

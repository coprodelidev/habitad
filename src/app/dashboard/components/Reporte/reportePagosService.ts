import { supabase } from "@/lib/supabaseClient";

/** Escenarios de pago */
export type PagoStage = "reserva" | "inicial" | "final";

/** Tablas base (tipos relajados) */
export type Cliente = {
  id: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  documento_identidad: string | null;
  tipo_documento: string | null;
  country_code: string | null;
  phone_number: string | null;
  email: string | null;
};

export type Propiedad = {
  id: string;
  etapa: number;
  codigo_cuh: string;
  modelo: string;
  partida: string;
  manzana: number;
  lote: number;
  ubicacion: string | null;
  area_lote: number | null;
  precio_cuh: number;
  precio_promotor: number | null;
  tipo?: number | null; // 1=casa, 0=terreno
};

export type Reserva = {
  id: string;
  cuh_id: string;
  promotor_id: string;
  cliente_id: string;
  estado: string;
  required_amount: number | null;
  expires_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Pago = {
  id: string;
  reserva_id: string;
  stage: PagoStage;
  amount: number;
  file_path: string | null;
  created_at: string;
};

export type PaymentReportRow = {
  // Pago
  pago_id: string;
  pago_fecha: string;  // ISO
  stage: PagoStage;
  monto: number;

  // Reserva
  reserva_id: string;
  reserva_estado: string;
  reserva_required_amount: number | null;
  reserva_expires_at: string | null;

  // Cliente
  cliente_id: string;
  cliente_documento: string | null;
  cliente_nombre: string;
  cliente_email: string | null;
  cliente_phone: string | null;

  // Promotor
  promotor_id: string;
  promotor_nombre: string | null;
  promotor_email: string | null;

  // Propiedad
  propiedad_id: string;
  codigo: string;
  modelo: string;
  etapa_cuh: number;
  mz: number;
  lt: number;
  partida: string;
  tipo: "casa" | "terreno" | null;
  precio_cuh: number;
};

function must<T>(p: Promise<{ data?: T; error?: any }>): Promise<T> {
  return p.then(({ data, error }) => {
    if (error) throw error;
    return data as T;
  });
}

function nombreCompleto(p?: {
  first_name?: string | null;
  second_name?: string | null;
  last_name?: string | null;
  second_last_name?: string | null;
} | null): string | null {
  if (!p) return null;
  const parts = [p.first_name, p.second_name, p.last_name, p.second_last_name].filter(Boolean) as string[];
  return parts.length ? parts.join(" ") : null;
}

function tipoLabel(n?: number | null): "casa" | "terreno" | null {
  if (n == null) return null;
  return Number(n) === 1 ? "casa" : "terreno";
}

/** Trae pagos a nivel de transacción con todos los joins necesarios */
export async function listPagosDetallado(): Promise<PaymentReportRow[]> {
  // 1) Pagos
  const pagos = await must<Pago[]>(
    (supabase as any)
      .from("payments")
      .select("id, reserva_id, stage, amount, file_path, created_at")
      .order("created_at", { ascending: false })
  );
  if (!pagos?.length) return [];

  // 2) Reservas
  const reservaIds = Array.from(new Set(pagos.map(p => p.reserva_id)));
  const reservas = await must<Reserva[]>(
    (supabase as any)
      .from("reservas")
      .select("id, cuh_id, promotor_id, cliente_id, estado, required_amount, expires_at, created_at, updated_at")
      .in("id", reservaIds)
  );
  const resById = new Map(reservas.map(r => [r.id, r]));

  // 3) CUH, clientes, promotores
  const cuhIds = Array.from(new Set(reservas.map(r => r.cuh_id)));
  const clienteIds = Array.from(new Set(reservas.map(r => r.cliente_id)));
  const promIds = Array.from(new Set(reservas.map(r => r.promotor_id)));

  const [propsBatch, clientesBatch, promosBatch] = await Promise.all([
    must<Propiedad[]>(
      (supabase as any).from("cuh").select(`
        id, etapa, codigo_cuh, modelo, partida, manzana, lote, ubicacion,
        area_lote, precio_cuh, precio_promotor, tipo
      `).in("id", cuhIds)
    ),
    must<Cliente[]>(
      (supabase as any).from("clientes").select(`
        id, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
        documento_identidad, tipo_documento, country_code, phone_number, email
      `).in("id", clienteIds)
    ),
    must<any[]>(
      (supabase as any).from("profiles").select(`
        id, first_name, second_name, last_name, second_last_name, email
      `).in("id", promIds)
    ),
  ]);

  const byProp = new Map<string, Propiedad>(propsBatch.map(p => [p.id, p]));
  const byCli  = new Map<string, Cliente>(clientesBatch.map(c => [c.id, c]));
  const byProm = new Map<string, any>(promosBatch.map(p => [p.id, p]));

  // 4) Armar filas
  const rows: PaymentReportRow[] = [];
  for (const p of pagos) {
    const res = resById.get(p.reserva_id);
    if (!res) continue;
    const prop = byProp.get(res.cuh_id);
    const cli  = byCli.get(res.cliente_id);
    const prom = byProm.get(res.promotor_id);
    if (!prop || !cli) continue;

    const cliente_phone = [cli.country_code ?? "", cli.phone_number ?? ""].join(" ").trim() || null;

    rows.push({
      pago_id: p.id,
      pago_fecha: p.created_at,
      stage: p.stage,
      monto: Number(p.amount) || 0,

      reserva_id: res.id,
      reserva_estado: res.estado,
      reserva_required_amount: res.required_amount,
      reserva_expires_at: res.expires_at,

      cliente_id: cli.id,
      cliente_documento: cli.documento_identidad,
      cliente_nombre: [cli.primer_nombre, cli.segundo_nombre, cli.primer_apellido, cli.segundo_apellido].filter(Boolean).join(" "),
      cliente_email: cli.email,
      cliente_phone,

      promotor_id: res.promotor_id,
      promotor_nombre: nombreCompleto(prom),
      promotor_email: prom?.email ?? null,

      propiedad_id: prop.id,
      codigo: prop.codigo_cuh,
      modelo: prop.modelo,
      etapa_cuh: prop.etapa,
      mz: prop.manzana,
      lt: prop.lote,
      partida: prop.partida,
      tipo: tipoLabel(prop.tipo ?? null),
      precio_cuh: Number(prop.precio_cuh || 0),
    });
  }

  return rows;
}

/** Helpers de formato */
export const fmtMoney = (n?: number | null) =>
  Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

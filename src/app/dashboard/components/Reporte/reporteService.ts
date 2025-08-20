// src/app/dashboard/components/Reporte/reporteService.ts
import { supabase } from "@/lib/supabaseClient";

/** Tipos base (relajados para evitar choques de tipos locales) */
export type DocumentoTipo = "dni" | "anexo1" | "anexoA2";
export type PagoStage = "reserva" | "inicial" | "final";

export type Cliente = {
  id: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  documento_identidad: string | null;
  tipo_documento: string | null;
  country_code: string;
  phone_number: string;
  full_phone: string | null;
  email: string; // USER-DEFINED en BD => usamos string
  tipo: string;
  created_at: string;
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

export type ReportRow = {
  // CUH
  propiedad_id: string;
  etapa: number;
  codigo: string;
  modelo: string;
  tipo: "casa" | "terreno" | null;
  precio_cuh: number;
  precio_promotor: number | null;
  partida: string;
  mz: number;
  lt: number;
  ubicacion: string | null;
  area: number | null;

  // Promotor
  promotor_id: string;
  promotor: string | null;
  promotor_email: string | null;

  // Otros
  geo: string | null;
  estado: string;

  // Cliente
  cliente_id: string;
  cliente_documento: string | null;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  cliente_email: string | null;
  cliente_phone: string | null;

  // Reserva
  reserva_id: string;
  required_amount: number | null;
  created_at: string | null;
  expires_at: string | null;

  // URLs firmadas
  dni_url: string | null;
  anexo1_url: string | null;
  anexoA2_url: string | null;

  // Resumen pagos por etapa
  reserva_objetivo: number;
  reserva_pagado: number;
  reserva_restante: number;

  inicial_objetivo: number;
  inicial_pagado: number;
  inicial_restante: number;

  final_objetivo: number;
  final_pagado: number;
  final_restante: number;
};

const BUCKET_DOCS = "client-docs";
const storage = (supabase as any).storage;

async function must<T>(p: Promise<{ data?: T; error?: any }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw error;
  return data as T;
}

/* ========= Helpers ========= */

function nombrePromotor(p?: {
  first_name?: string | null;
  second_name?: string | null;
  last_name?: string | null;
  second_last_name?: string | null;
} | null): string | null {
  if (!p) return null;
  const parts = [p.first_name, p.second_name, p.last_name, p.second_last_name].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

function tipoLabel(n?: number | null): "casa" | "terreno" | null {
  if (n == null) return null;
  return Number(n) === 1 ? "casa" : "terreno";
}

/* ========= Servicio principal ========= */

export async function listReporte(): Promise<ReportRow[]> {
  const reservas = await must<any[]>(
    (supabase as any)
      .from("reservas")
      .select("id, cuh_id, promotor_id, cliente_id, estado, required_amount, expires_at, created_at, updated_at")
      .order("created_at", { ascending: false })
  );

  if (!reservas || reservas.length === 0) return [];

  const clienteIds = Array.from(new Set(reservas.map(r => r.cliente_id)));
  const cuhIds     = Array.from(new Set(reservas.map(r => r.cuh_id)));
  const promIds    = Array.from(new Set(reservas.map(r => r.promotor_id)));
  const reservaIds = reservas.map(r => r.id);

  const [clientesBatch, propsBatch, promosBatch, pagosBatch, docsBatch] = await Promise.all([
    must<any[]>(
      (supabase as any).from("clientes").select(`
        id, created_at, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
        documento_identidad, tipo_documento, country_code, phone_number, full_phone, email, tipo
      `).in("id", clienteIds)
    ),
    must<any[]>(
      (supabase as any).from("cuh").select(`
        id, etapa, codigo_cuh, modelo, partida, manzana, lote, ubicacion,
        area_lote, precio_cuh, precio_promotor, tipo
      `).in("id", cuhIds)
    ),
    must<any[]>(
      (supabase as any).from("profiles").select(`
        id, first_name, second_name, last_name, second_last_name, email
      `).in("id", promIds)
    ),
    must<any[]>(
      (supabase as any).from("payments").select(`
        id, reserva_id, stage, amount, file_path, created_at
      `).in("reserva_id", reservaIds)
    ),
    must<any[]>(
      (supabase as any).from("reservation_docs").select(`
        reserva_id, tipo, file_path
      `).in("reserva_id", reservaIds)
    ),
  ]);

  const byCliente = new Map<string, Cliente>((clientesBatch || []).map((c: any) => [c.id, c]));
  const byProp    = new Map<string, Propiedad>((propsBatch || []).map((p: any) => [p.id, p]));
  const byProm    = new Map<string, any>((promosBatch || []).map((p: any) => [p.id, p]));

  const pagosByReserva = new Map<string, Pago[]>();
  for (const p of pagosBatch || []) {
    const arr = pagosByReserva.get(p.reserva_id) ?? [];
    arr.push(p as Pago);
    pagosByReserva.set(p.reserva_id, arr);
  }

  const docsByReserva: Record<string, Partial<Record<DocumentoTipo, string | null>>> = {};
  const signedUrlPromises: Promise<void>[] = [];
  for (const d of docsBatch || []) {
    const rid = d.reserva_id as string;
    const tipo = d.tipo as DocumentoTipo;
    const path = d.file_path as string | null;
    docsByReserva[rid] = docsByReserva[rid] || {};
    if (path && storage) {
      signedUrlPromises.push(
        (async () => {
          const { data, error } = await storage.from(BUCKET_DOCS).createSignedUrl(path, 3600);
          docsByReserva[rid]![tipo] = error ? null : data?.signedUrl ?? null;
        })()
      );
    } else {
      docsByReserva[rid]![tipo] = null;
    }
  }
  await Promise.all(signedUrlPromises);

  const out: ReportRow[] = [];

  for (const r of reservas) {
    const prop = byProp.get(r.cuh_id);
    const cli  = byCliente.get(r.cliente_id);
    const prom = byProm.get(r.promotor_id);
    if (!prop || !cli) continue;

    const pagos = pagosByReserva.get(r.id) || [];
    const sum = (stage: PagoStage) =>
      pagos.filter(p => p.stage === stage).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    const precio = Number(prop.precio_cuh || 0);
    const objetivoInicial = Math.round(precio * 0.05 * 100) / 100;
    const objetivoReserva = Number(r.required_amount ?? 0);
    const objetivoFinal   = Math.max(0, precio - objetivoInicial);

    const pagadoReserva = sum("reserva");
    const pagadoInicial = sum("inicial");
    const pagadoFinal   = sum("final");

    out.push({
      propiedad_id: prop.id,
      etapa: prop.etapa,
      codigo: prop.codigo_cuh,
      modelo: prop.modelo,
      tipo: tipoLabel(prop.tipo ?? null),
      precio_cuh: Number(prop.precio_cuh || 0),
      precio_promotor: prop.precio_promotor ?? null,
      partida: prop.partida,
      mz: prop.manzana,
      lt: prop.lote,
      ubicacion: prop.ubicacion,
      area: prop.area_lote,

      promotor_id: r.promotor_id,
      promotor: nombrePromotor(prom) ?? null,
      promotor_email: prom?.email ?? null,

      geo: null,
      estado: r.estado,

      cliente_id: r.cliente_id,
      cliente_documento: cli.documento_identidad,
      primer_nombre: cli.primer_nombre,
      segundo_nombre: cli.segundo_nombre,
      primer_apellido: cli.primer_apellido,
      segundo_apellido: cli.segundo_apellido,
      cliente_email: cli.email || null,
      // FIX 5076: paréntesis para no mezclar ?? y ||
      cliente_phone: (cli.full_phone ?? `${cli.country_code ?? ""} ${cli.phone_number ?? ""}`.trim()) || null,

      reserva_id: r.id,
      required_amount: r.required_amount,
      created_at: r.created_at,
      expires_at: r.expires_at,

      dni_url: docsByReserva[r.id]?.dni ?? null,
      anexo1_url: docsByReserva[r.id]?.anexo1 ?? null,
      anexoA2_url: docsByReserva[r.id]?.anexoA2 ?? null,

      reserva_objetivo: objetivoReserva,
      reserva_pagado: pagadoReserva,
      reserva_restante: Math.max(0, objetivoReserva - pagadoReserva),

      inicial_objetivo: objetivoInicial,
      inicial_pagado: pagadoInicial,
      inicial_restante: Math.max(0, objetivoInicial - pagadoInicial),

      final_objetivo: objetivoFinal,
      final_pagado: pagadoFinal,
      final_restante: Math.max(0, objetivoFinal - pagadoFinal),
    });
  }

  return out;
}

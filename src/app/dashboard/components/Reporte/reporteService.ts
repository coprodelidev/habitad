// src/app/dashboard/components/Reporte/reporteService.ts
import { supabase } from "@/lib/supabaseClient";

/** Tipos base (relajados para evitar choques de tipos locales) */
export type DocumentoTipo = "dni" | "anexo1" | "anexoA2";

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
};

export type Reserva = {
  id: string;
  cuh_id: string;
  promotor_id: string;
  cliente_id: string;
  estado: string;
  created_at: string | null;
  updated_at: string | null;
};

export type PagoInicial = {
  id: string;
  reserva_id: string;
  amount: number;
  file_path: string | null;
  created_at: string;
};

export type ReportRow = {
  // CUH
  etapa: number;
  codigo: string;
  modelo: string;
  precio_cuh: number;
  partida: string;
  mz: number;
  lt: number;
  ubicacion: string | null;
  area: number | null;

  // Promotor
  promotor: string | null;       // nombre compuesto si existe en profiles, sino null
  promotor_email: string | null; // email desde profiles si existe

  // Otros
  geo: string | null;            // si no tienes columna geo, dejamos null
  estado: string;

  // Cliente
  cliente_documento: string | null;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;

  // Propiedad (repetido para la columna "Propiedad")
  propiedad: string;

  // URLs firmadas (si hay doc)
  dni_url: string | null;
  anexo1_url: string | null;
  anexoA2_url: string | null;

  // Resumen cuotas
  cuotas_pagado: number;
  cuotas_objetivo: number;   // = cuh.precio_promotor
  cuotas_restante: number;
};

const BUCKET_DOCS = "client-docs";
const storage = (supabase as any).storage;

async function must<T>(p: Promise<{ data?: T; error?: any }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw error;
  return data as T;
}

/* ========= Fetch helpers ========= */

async function getCliente(id: string): Promise<Cliente | null> {
  const data = await must<any>(
    (supabase as any)
      .from("clientes")
      .select(`
        id,
        created_at,
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        documento_identidad,
        tipo_documento,
        country_code,
        phone_number,
        full_phone,
        email,
        tipo
      `)
      .eq("id", id)
      .maybeSingle()
  );
  return (data || null) as Cliente | null;
}

async function getPropiedadById(cuh_id: string): Promise<Propiedad | null> {
  const data = await must<any>(
    (supabase as any)
      .from("cuh")
      .select(`
        id,
        etapa,
        codigo_cuh,
        modelo,
        partida,
        manzana,
        lote,
        ubicacion,
        area_lote,
        precio_cuh,
        precio_promotor
      `)
      .eq("id", cuh_id)
      .maybeSingle()
  );
  return (data || null) as Propiedad | null;
}

/** Profiles puede tener nombres en inglés (first_name/last_name) o nada.
 *  Devolvemos nombre y email si existen, o nulls.
 */
async function getPromotorBasic(promotor_id: string): Promise<{ name: string | null; email: string | null }> {
  const prof = await must<any>(
    (supabase as any)
      .from("profiles")
      .select("first_name, second_name, last_name, second_last_name, email")
      .eq("id", promotor_id)
      .maybeSingle()
  );
  if (!prof) return { name: null, email: null };
  const name = [prof.first_name, prof.second_name, prof.last_name, prof.second_last_name]
    .filter(Boolean)
    .join(" ") || null;
  return { name, email: prof.email ?? null };
}

async function getDocSignedUrl(reservaId: string, tipo: DocumentoTipo): Promise<string | null> {
  if (!storage) return null;
  const reg = await must<any>(
    (supabase as any)
      .from("reservation_docs")
      .select("file_path")
      .eq("reserva_id", reservaId)
      .eq("tipo", tipo)
      .maybeSingle()
  );
  if (!reg?.file_path) return null;
  const { data, error } = await storage.from(BUCKET_DOCS).createSignedUrl(reg.file_path, 3600);
  if (error) return null;
  return data.signedUrl;
}

/** ✅ Objetivo de cuotas = precio_promotor de la CUH asociada a la reserva */
async function getResumenCuotas(reserva: Reserva): Promise<{ pagado: number; objetivo: number; restante: number }> {
  const pagos = await must<any[]>(
    (supabase as any)
      .from("payments")
      .select("amount")
      .eq("reserva_id", reserva.id)
  );
  const pagado = (pagos || []).reduce((acc, p) => acc + Number(p?.amount || 0), 0);

  const prop = await getPropiedadById(reserva.cuh_id);
  const objetivo = Number(prop?.precio_promotor ?? 0);

  const restante = Math.max(0, objetivo - pagado);
  return { pagado, objetivo, restante };
}

/* ========= Servicio principal ========= */

export async function listReporte(): Promise<ReportRow[]> {
  const reservas = await must<any[]>(
    (supabase as any)
      .from("reservas")
      .select("id, cuh_id, promotor_id, cliente_id, estado, created_at, updated_at") // ← SIN inicial_objetivo
      .order("created_at", { ascending: false })
  );

  const out: ReportRow[] = [];

  for (const r of reservas || []) {
    const [prop, cli, prom, dni, an1, an2, resumen] = await Promise.all([
      getPropiedadById(r.cuh_id),
      getCliente(r.cliente_id),
      getPromotorBasic(r.promotor_id),
      getDocSignedUrl(r.id, "dni"),
      getDocSignedUrl(r.id, "anexo1"),
      getDocSignedUrl(r.id, "anexoA2"),
      getResumenCuotas(r as Reserva),
    ]);

    if (!prop || !cli) continue;

    out.push({
      etapa: prop.etapa,
      codigo: prop.codigo_cuh,
      modelo: prop.modelo,
      precio_cuh: Number(prop.precio_cuh || 0),
      partida: prop.partida,
      mz: prop.manzana,
      lt: prop.lote,
      ubicacion: prop.ubicacion,
      area: prop.area_lote,

      promotor: prom.name,
      promotor_email: prom.email,

      geo: null, // si luego agregas columna geo en cuh, reemplaza aquí
      estado: r.estado,

      cliente_documento: cli.documento_identidad,
      primer_nombre: cli.primer_nombre,
      segundo_nombre: cli.segundo_nombre,
      primer_apellido: cli.primer_apellido,
      segundo_apellido: cli.segundo_apellido,

      propiedad: prop.codigo_cuh,

      dni_url: dni,
      anexo1_url: an1,
      anexoA2_url: an2,

      cuotas_pagado: resumen.pagado,
      cuotas_objetivo: resumen.objetivo,   // = precio_promotor
      cuotas_restante: resumen.restante,
    });
  }

  return out;
}

import { supabase } from "@/lib/supabaseClient";

/* ===================== Tipos ===================== */
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
  email: string;
  tipo: string; // cliente | interesado
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
  created_at?: string;
  updated_at?: string;
};

export type ReservaEstado = "reservado" | "separado" | string;

export type Reserva = {
  id: string;
  cuh_id: string;
  promotor_id: string;
  cliente_id: string;
  estado: ReservaEstado; // 'reservado' | 'separado' | ...
  required_amount: number | null; // 1000 (casa) / 500 (terreno)
  expires_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type GestionPagoRow = {
  reserva: Reserva;
  cliente: Cliente;
  propiedad: Propiedad;
  cliente_doc: string;
  promotor_nombre?: string;
};

export type DocRegistro = {
  id: string;
  reserva_id: string;
  tipo: DocumentoTipo;
  file_path: string;
  created_at: string;
};

export type Pago = {
  id: string;
  reserva_id: string;
  stage: PagoStage;         // << NUEVO (reserva | inicial | final)
  amount: number;
  file_path: string | null;
  created_at: string;
};

/* ============== Buckets & Helpers ============== */
const BUCKET_DOCS = "client-docs";
const BUCKET_PAYMENTS = "payments";
const storage = (supabase as any).storage;

async function must<T>(p: Promise<{ data?: T; error?: any }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw error;
  return data as T;
}

function labelUbicacion(u?: string | null, fallbackCorner?: boolean): string {
  const s = (u || "").trim();
  if (s) return s;
  return fallbackCorner ? "Esquina" : "Interior";
}

function nombreCompletoPromotor(p?: { first_name?: string|null; second_name?: string|null; last_name?: string|null; second_last_name?: string|null } | null) {
  if (!p) return undefined;
  const parts = [p.first_name, p.second_name, p.last_name, p.second_last_name].filter(Boolean);
  return parts.length ? parts.join(" ") : undefined;
}

/* ============== Lecturas base (batch) ============== */
/**
 * Devuelve gestiones SOLO de reservas activas (reservado/separado)
 */
export async function listGestiones(): Promise<GestionPagoRow[]> {
  const reservas = await must<Reserva[]>(
    (supabase as any)
      .from("reservas")
      .select("id, cuh_id, promotor_id, cliente_id, estado, required_amount, expires_at, created_at, updated_at")
      .in("estado", ["reservado", "separado"])
      .order("created_at", { ascending: false })
  );
  if (!reservas || reservas.length === 0) return [];

  const clienteIds = Array.from(new Set(reservas.map(r => r.cliente_id)));
  const cuhIds     = Array.from(new Set(reservas.map(r => r.cuh_id)));
  const promIds    = Array.from(new Set(reservas.map(r => r.promotor_id)));

  const [clientesBatch, propsBatch, promosBatch] = await Promise.all([
    must<any[]>(
      (supabase as any)
        .from("clientes")
        .select(`
          id, created_at, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
          documento_identidad, tipo_documento, country_code, phone_number, full_phone,
          email, tipo
        `).in("id", clienteIds)
    ),
    must<any[]>(
      (supabase as any)
        .from("cuh")
        .select(`
          id, etapa, codigo_cuh, modelo, partida, manzana, lote, ubicacion,
          area_lote, precio_cuh, precio_promotor, created_at, updated_at
        `).in("id", cuhIds)
    ),
    must<any[]>(
      (supabase as any)
        .from("profiles")
        .select("id, first_name, second_name, last_name, second_last_name")
        .in("id", promIds)
    ),
  ]);

  const byCliente: Record<string, Cliente> = Object.fromEntries(
    (clientesBatch || []).map((c: any) => [c.id, c as Cliente])
  );
  const byProp: Record<string, Propiedad> = Object.fromEntries(
    (propsBatch || []).map((p: any) => [p.id, p as Propiedad])
  );
  const byProm: Record<string, any> = Object.fromEntries(
    (promosBatch || []).map((p: any) => [p.id, p])
  );

  const out: GestionPagoRow[] = [];
  for (const r of reservas) {
    const cliente = byCliente[r.cliente_id];
    const propiedad = byProp[r.cuh_id];
    if (!cliente || !propiedad) continue;

    const _ = labelUbicacion(propiedad.ubicacion, (propiedad.ubicacion || "").toUpperCase().includes("ESQUINA"));

    const cliente_doc =
      cliente.documento_identidad ||
      cliente.full_phone ||
      cliente.email ||
      cliente.id;

    out.push({
      reserva: r,
      cliente,
      propiedad,
      cliente_doc: String(cliente_doc ?? ""),
      promotor_nombre: nombreCompletoPromotor(byProm[r.promotor_id])
    });
  }
  return out;
}

export async function getCliente(id: string): Promise<Cliente | null> {
  const data = await must<any>(
    (supabase as any)
      .from("clientes")
      .select(`
        id, created_at, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
        documento_identidad, tipo_documento, country_code, phone_number, full_phone, email, tipo
      `)
      .eq("id", id)
      .maybeSingle()
  );
  return (data || null) as Cliente | null;
}

export async function getPropiedadById(cuh_id: string): Promise<Propiedad | null> {
  const data = await must<any>(
    (supabase as any)
      .from("cuh")
      .select(`
        id, etapa, codigo_cuh, modelo, partida, manzana, lote, ubicacion,
        area_lote, precio_cuh, precio_promotor, created_at, updated_at
      `)
      .eq("id", cuh_id)
      .maybeSingle()
  );
  return (data || null) as Propiedad | null;
}

/* ============== Documentos (PDF) ============== */
export async function getDocumento(reservaId: string, tipo: DocumentoTipo): Promise<DocRegistro | null> {
  const data = await must<any>(
    (supabase as any)
      .from("reservation_docs")
      .select("id, reserva_id, tipo, file_path, created_at")
      .eq("reserva_id", reservaId)
      .eq("tipo", tipo)
      .maybeSingle()
  );
  return (data || null) as DocRegistro | null;
}

export async function uploadDocumento(reservaId: string, tipo: DocumentoTipo, file: File): Promise<DocRegistro> {
  if (!storage) throw new Error("Supabase Storage no disponible en este cliente.");
  const key = `${reservaId}/${tipo}/${Date.now()}_${file.name}`;

  const up = await storage.from(BUCKET_DOCS).upload(key, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: (file as any).type || "application/pdf",
  });
  if (up?.error) throw up.error;

  const file_path = key;

  await must(
    (supabase as any)
      .from("reservation_docs")
      .upsert({ reserva_id: reservaId, tipo, file_path } as any, { onConflict: "reserva_id,tipo" })
  );

  const data = await must<any>(
    (supabase as any)
      .from("reservation_docs")
      .select("id, reserva_id, tipo, file_path, created_at")
      .eq("reserva_id", reservaId)
      .eq("tipo", tipo)
      .single()
  );
  return data as DocRegistro;
}

export async function getSignedUrlFromDocs(path: string, expiresInSeconds = 3600): Promise<string> {
  if (!storage) throw new Error("Supabase Storage no disponible en este cliente.");
  const { data, error } = await storage.from(BUCKET_DOCS).createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

/* ============== Pagos (reserva, inicial, final) ============== */
export async function listPagos(reservaId: string, stage?: PagoStage): Promise<Pago[]> {
  let q = (supabase as any)
    .from("payments")
    .select("id, reserva_id, stage, amount, file_path, created_at")
    .eq("reserva_id", reservaId)
    .order("created_at", { ascending: false });

  if (stage) q = q.eq("stage", stage);

  const data = await must<any[]>(q);
  return (data || []) as Pago[];
}

export async function addPago(reservaId: string, stage: PagoStage, amount: number, file?: File | null): Promise<Pago> {
  if (!(amount > 0)) throw new Error("Monto inválido");

  let file_path: string | null = null;
  if (file) {
    if (!storage) throw new Error("Supabase Storage no disponible en este cliente.");
    const key = `${reservaId}/${stage}/${Date.now()}_${file.name}`;
    const up = await storage.from(BUCKET_PAYMENTS).upload(key, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: (file as any).type || "application/pdf",
    });
    if (up?.error) throw up.error;
    file_path = key;
  }

  await must(
    (supabase as any)
      .from("payments")
      .insert({ reserva_id: reservaId, stage, amount, file_path } as any)
  );

  const data = await must<any[]>(
    (supabase as any)
      .from("payments")
      .select("id, reserva_id, stage, amount, file_path, created_at")
      .eq("reserva_id", reservaId)
      .eq("stage", stage)
      .order("created_at", { ascending: false })
      .limit(1)
  );

  return (data && data[0]) as Pago;
}

export async function getSignedUrlFromPayments(path: string, expiresInSeconds = 3600): Promise<string> {
  if (!storage) throw new Error("Supabase Storage no disponible en este cliente.");
  const { data, error } = await storage.from(BUCKET_PAYMENTS).createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

/**
 * ✅ Resumen por etapas
 *   - Reserva: objetivo = required_amount (de la reserva)
 *   - Inicial: objetivo = 5% del precio_cuh
 *   - Final:   objetivo = precio_cuh - objetivoInicial
 */
export async function getResumenPagos(reserva: Reserva): Promise<{
  resumen: {
    reserva: { objetivo: number; pagado: number; restante: number; pagos: Pago[] };
    inicial: { objetivo: number; pagado: number; restante: number; pagos: Pago[] };
    final:   { objetivo: number; pagado: number; restante: number; pagos: Pago[] };
  };
  etapaActual: PagoStage | "completado";
}> {
  const propiedad = await getPropiedadById(reserva.cuh_id);
  const precio = Number(propiedad?.precio_cuh ?? 0);
  const objetivoInicial = Math.round(precio * 0.05 * 100) / 100;
  const objetivoReserva = Number(reserva.required_amount ?? 0);
  const objetivoFinal   = Math.max(0, precio - objetivoInicial);

  const [pagosRes, pagosIni, pagosFin] = await Promise.all([
    listPagos(reserva.id, "reserva"),
    listPagos(reserva.id, "inicial"),
    listPagos(reserva.id, "final"),
  ]);

  const sum = (arr: Pago[]) => arr.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  const pagadoRes = sum(pagosRes);
  const pagadoIni = sum(pagosIni);
  const pagadoFin = sum(pagosFin);

  const restanteRes = Math.max(0, objetivoReserva - pagadoRes);
  const restanteIni = Math.max(0, objetivoInicial - pagadoIni);
  const restanteFin = Math.max(0, objetivoFinal - pagadoFin);

  let etapaActual: PagoStage | "completado" = "reserva";
  if (restanteRes <= 0) etapaActual = "inicial";
  if (restanteRes <= 0 && restanteIni <= 0) etapaActual = "final";
  if (restanteRes <= 0 && restanteIni <= 0 && restanteFin <= 0) etapaActual = "completado";

  return {
    resumen: {
      reserva: { objetivo: objetivoReserva, pagado: pagadoRes, restante: restanteRes, pagos: pagosRes },
      inicial: { objetivo: objetivoInicial, pagado: pagadoIni, restante: restanteIni, pagos: pagosIni },
      final:   { objetivo: objetivoFinal,   pagado: pagadoFin, restante: restanteFin, pagos: pagosFin },
    },
    etapaActual,
  };
}

import { supabase } from "@/lib/supabaseClient";

// Tipos
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
  email: string;     // user-defined en BD => usar string
  tipo: string;      // cliente | interesado
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

export type Reserva = {
  id: string;
  cuh_id: string;
  promotor_id: string;
  cliente_id: string;
  estado: string;
  created_at: string | null;
  updated_at: string | null;
  // (ya no usamos inicial_objetivo aquí)
};

export type GestionPagoRow = {
  reserva: Reserva;
  cliente: Cliente;
  propiedad: Propiedad;
  cliente_doc: string;
};

export type DocRegistro = {
  id: string;
  reserva_id: string;
  tipo: DocumentoTipo;
  file_path: string;
  created_at: string;
};

export type PagoInicial = {
  id: string;
  reserva_id: string;
  amount: number;
  file_path: string | null;
  created_at: string;
};

// Buckets
const BUCKET_DOCS = "client-docs";
const BUCKET_PAYMENTS = "payments";

// Helpers
const storage = (supabase as any).storage;

async function must<T>(p: Promise<{ data?: T; error?: any }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw error;
  return data as T;
}

// ===== Lecturas base =====
export async function listGestiones(): Promise<GestionPagoRow[]> {
  const reservas = await must<any[]>(
    (supabase as any)
      .from("reservas")
      .select("id, cuh_id, promotor_id, cliente_id, estado, created_at, updated_at")
      .order("created_at", { ascending: false })
  );

  const out: GestionPagoRow[] = [];
  for (const r of reservas || []) {
    const [cliente, propiedad] = await Promise.all([
      getCliente(r.cliente_id),
      getPropiedadById(r.cuh_id),
    ]);
    if (!cliente || !propiedad) continue;

    const cliente_doc =
      cliente.documento_identidad ||
      cliente.full_phone ||
      cliente.email ||
      cliente.id;

    out.push({
      reserva: r as Reserva,
      cliente: cliente as Cliente,
      propiedad: propiedad as Propiedad,
      cliente_doc: String(cliente_doc ?? ""),
    });
  }
  return out;
}

export async function getCliente(id: string): Promise<Cliente | null> {
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

export async function getPropiedadById(cuh_id: string): Promise<Propiedad | null> {
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
        precio_promotor,
        created_at,
        updated_at
      `)
      .eq("id", cuh_id)
      .maybeSingle()
  );
  return (data || null) as Propiedad | null;
}

// ===== Documentos (DNI, Anexo1, AnexoA2) =====
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

// ===== Cuotas Iniciales =====
export async function listCuotas(reservaId: string): Promise<PagoInicial[]> {
  const data = await must<any[]>(
    (supabase as any)
      .from("payments")
      .select("id, reserva_id, amount, file_path, created_at")
      .eq("reserva_id", reservaId)
      .order("created_at", { ascending: false })
  );
  return (data || []) as PagoInicial[];
}

export async function addCuota(reservaId: string, amount: number, file?: File | null): Promise<PagoInicial> {
  let file_path: string | null = null;

  if (file) {
    if (!storage) throw new Error("Supabase Storage no disponible en este cliente.");
    const key = `${reservaId}/cuotas/${Date.now()}_${file.name}`;
    const up = await storage.from(BUCKET_PAYMENTS).upload(key, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: (file as any).type || "application/pdf",
    });
    if (up?.error) throw up.error;
    file_path = key;
  }

  await must((supabase as any).from("payments").insert({ reserva_id: reservaId, amount, file_path } as any));

  const data = await must<any[]>(
    (supabase as any)
      .from("payments")
      .select("id, reserva_id, amount, file_path, created_at")
      .eq("reserva_id", reservaId)
      .order("created_at", { ascending: false })
      .limit(1)
  );

  return (data && data[0]) as PagoInicial;
}

export async function getSignedUrlFromPayments(path: string, expiresInSeconds = 3600): Promise<string> {
  if (!storage) throw new Error("Supabase Storage no disponible en este cliente.");
  const { data, error } = await storage.from(BUCKET_PAYMENTS).createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

/** ✅ CORREGIDO: “Objetivo” = precio_promotor de la propiedad vinculada a la reserva */
export async function getResumenCuotaInicial(reserva: Reserva): Promise<{
  pagado: number; objetivo: number; restante: number; cuotas: PagoInicial[];
}> {
  const cuotas = await listCuotas(reserva.id);
  const pagado = cuotas.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

  // Tomar el precio_promotor desde CUH (propiedad de la reserva)
  const propiedad = await getPropiedadById(reserva.cuh_id);
  const objetivo = Number(propiedad?.precio_promotor ?? 0); // si es null, 0

  const restante = Math.max(0, objetivo - pagado);
  return { pagado, objetivo, restante, cuotas };
}

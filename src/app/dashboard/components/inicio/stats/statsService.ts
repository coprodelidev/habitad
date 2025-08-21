import { supabase } from "@/lib/supabaseClient";

export type Counts = {
  clientes: number;   // total de filas en clientes
  oferta: number;     // CUH disponibles (sin reservas activas)
  activas: number;    // reservas en 'reservado' o 'separado'
  recaudado: number;  // suma de payments.amount
};

/** #1 Total de clientes (SIN filtros) */
async function countClientes(): Promise<number> {
  const { count, error } = await (supabase as any)
    .from("clientes")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

/** #2 Reservas activas: estados reservado/separado */
async function countReservasActivas(): Promise<number> {
  const { count, error } = await (supabase as any)
    .from("reservas")
    .select("id", { count: "exact", head: true })
    .in("estado", ["reservado", "separado"]);
  if (error) throw error;
  return count ?? 0;
}

/**
 * #3 Oferta de propiedades (DISPONIBLES)
 * disponible = total CUH - DISTINCT cuh_id en reservas con estado reservado/separado
 */
async function countOfertaPropiedades(): Promise<number> {
  // Total de CUH
  const total = await (supabase as any)
    .from("cuh")
    .select("id", { count: "exact", head: true });
  if (total.error) throw total.error;
  const totalCuh = total.count ?? 0;
  if (totalCuh === 0) return 0;

  // Cantidad de filas en reservas activas
  const headActivas = await (supabase as any)
    .from("reservas")
    .select("id", { count: "exact", head: true })
    .in("estado", ["reservado", "separado"]);
  if (headActivas.error) throw headActivas.error;

  const totalRows = headActivas.count ?? 0;
  if (totalRows === 0) return totalCuh; // nadie activo → todo disponible

  // Paginamos reservas activas y construimos un Set DISTINCT de cuh_id
  const pageSize = 1000;
  const pages = Math.ceil(totalRows / pageSize);
  const ocupados = new Set<string>();

  for (let i = 0; i < pages; i++) {
    const from = i * pageSize;
    const to = Math.min(from + pageSize - 1, totalRows - 1);

    const { data, error } = await (supabase as any)
      .from("reservas")
      .select("cuh_id")
      .in("estado", ["reservado", "separado"])
      .order("id", { ascending: true }) // paginación determinística
      .range(from, to);

    if (error) throw error;
    (data || []).forEach((r: any) => {
      if (r?.cuh_id) ocupados.add(String(r.cuh_id));
    });
  }

  const disponibles = Math.max(0, totalCuh - ocupados.size);
  return disponibles;
}

/** #4 Total recaudado: suma de todos los pagos (payments.amount) con paginación */
async function sumPagos(): Promise<number> {
  const head = await (supabase as any)
    .from("payments")
    .select("id", { count: "exact", head: true });
  if (head.error) throw head.error;

  const totalRows = head.count ?? 0;
  if (totalRows === 0) return 0;

  const pageSize = 1000;
  const pages = Math.ceil(totalRows / pageSize);
  let total = 0;

  for (let i = 0; i < pages; i++) {
    const from = i * pageSize;
    const to = Math.min(from + pageSize - 1, totalRows - 1);

    const { data, error } = await (supabase as any)
      .from("payments")
      .select("amount")
      .order("id", { ascending: true })
      .range(from, to);

    if (error) throw error;
    total += (data || []).reduce((acc: number, r: any) => acc + Number(r?.amount || 0), 0);
  }

  return total;
}

/** Fetch combinado */
export async function fetchCounts(): Promise<Counts> {
  const [clientes, oferta, activas, recaudado] = await Promise.all([
    countClientes(),
    countOfertaPropiedades(),
    countReservasActivas(),
    sumPagos(),
  ]);
  return { clientes, oferta, activas, recaudado };
}

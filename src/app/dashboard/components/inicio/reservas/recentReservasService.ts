// src/app/dashboard/components/recent/recentReservasService.ts
import { supabase } from "@/lib/supabaseClient";

export type RecentRow = {
  reserva_id: string;
  codigo: string;
  modelo: string;
  tipo: "casa" | "terreno" | null;
  precio_cuh: number;
  precio_promotor: number | null;
  ubicacion: string | null;
  estado: string;
  obj_reserva: number | null;     // reservas.required_amount
  vence: string | null;           // reservas.expires_at (ISO string)
  promotor: string | null;        // nombre completo del promotor
};

async function must<T>(p: Promise<{ data?: T; error?: any }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw error;
  return data as T;
}

function tipoLabel(n?: number | null): "casa" | "terreno" | null {
  if (n == null) return null;
  return Number(n) === 1 ? "casa" : "terreno";
}

function nombreCompletoPromotor(p?: {
  first_name?: string | null;
  second_name?: string | null;
  last_name?: string | null;
  second_last_name?: string | null;
} | null): string | null {
  if (!p) return null;
  const parts = [p.first_name, p.second_name, p.last_name, p.second_last_name].filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

/**
 * Devuelve hasta `limit` reservas recientes con datos de CUH y promotor.
 * Orden: más recientes primero (created_at desc).
 */
export async function listRecentReservas(limit = 10): Promise<RecentRow[]> {
  const reservas = await must<any[]>(
    (supabase as any)
      .from("reservas")
      .select("id, cuh_id, promotor_id, estado, required_amount, expires_at, created_at")
      .order("created_at", { ascending: false })
      .limit(limit)
  );

  if (!reservas || reservas.length === 0) return [];

  const cuhIds  = Array.from(new Set(reservas.map(r => r.cuh_id)));
  const promIds = Array.from(new Set(reservas.map(r => r.promotor_id)));

  const [propsBatch, promosBatch] = await Promise.all([
    must<any[]>(
      (supabase as any)
        .from("cuh")
        .select("id, codigo_cuh, modelo, tipo, precio_cuh, precio_promotor, ubicacion")
        .in("id", cuhIds)
    ),
    must<any[]>(
      (supabase as any)
        .from("profiles")
        .select("id, first_name, second_name, last_name, second_last_name")
        .in("id", promIds)
    ),
  ]);

  const byProp = new Map<string, any>((propsBatch || []).map((p: any) => [p.id, p]));
  const byProm = new Map<string, any>((promosBatch || []).map((p: any) => [p.id, p]));

  const rows: RecentRow[] = [];
  for (const r of reservas) {
    const prop = byProp.get(r.cuh_id);
    const prom = byProm.get(r.promotor_id);

    if (!prop) continue;

    rows.push({
      reserva_id: r.id,
      codigo: prop.codigo_cuh,
      modelo: prop.modelo,
      tipo: tipoLabel(prop.tipo ?? null),
      precio_cuh: Number(prop.precio_cuh || 0),
      precio_promotor: prop.precio_promotor ?? null,
      ubicacion: prop.ubicacion ?? null,
      estado: r.estado,
      obj_reserva: r.required_amount ?? null,
      vence: r.expires_at,
      promotor: nombreCompletoPromotor(prom),
    });
  }
  return rows;
}

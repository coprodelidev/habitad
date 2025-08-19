import { supabase } from "@/lib/supabaseClient";

type CuhRow = {
  etapa: number;
  codigo_cuh: string;
  modelo: string;
  precio_cuh: number;
  partida: string;
  manzana: number;
  lote: number;
  ubicacion?: string | null;
  area_lote?: number | null;
  precio_promotor?: number | null;
};

export async function upsertCuh(payload: CuhRow[]) {
  const { error } = await supabase
    .from('cuh')
    .upsert(payload, { onConflict: 'etapa,codigo_cuh', ignoreDuplicates: false });
  if (error) throw error;
}
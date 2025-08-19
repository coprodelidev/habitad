import { supabase } from "@/lib/supabaseClient";

type Cliente = {
  id: string;
  country_code: string;
  phone_number: string;
  email: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  full_phone: string | null;
  created_at: string;
  tipo: "cliente" | "interesado" | string;
  documento_identidad: string | null;
  tipo_documento: string | null;
};

export async function fetchClientesPage(from: number, toPlusOne: number, whereFilter: string | null) {
  let query = supabase
    .from("clientes")
    .select("*")
    .order("created_at", { ascending: false })
    .range(from, toPlusOne);

  if (whereFilter) {
    query = query.or(
      `email.ilike.%${whereFilter}%,phone_number.ilike.%${whereFilter}%,full_phone.ilike.%${whereFilter}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Cliente[]) ?? [];
}

export async function insertCliente(payload: any) {
  const { error } = await supabase.from("clientes").insert(payload);
  if (error) throw error;
}
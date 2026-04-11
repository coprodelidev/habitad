import { supabase } from '@/lib/supabaseClient';

// Cliente Supabase limitado al schema v2.
// Reutilizamos la misma sesión (storage key por defecto) para que el login
// hecho desde public funcione sin duplicar credenciales ni perder sesión.
export const supabaseV2 = supabase.schema('v2' as any) as any;

export { supabase as supabasePublic };

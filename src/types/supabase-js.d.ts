declare module '@supabase/supabase-js' {
  export interface User {
    id: string;
    user_metadata: Record<string, any>;
  }
  export interface SupabaseClient {
    auth: {
      signInWithPassword(opts: { email: string; password: string }): Promise<{ data: { user: User | null }; error: Error | null }>;
      signUp(opts: { email: string; password: string; options: { data: Record<string, any> } }): Promise<{ data: any; error: Error | null }>;
    };
    from(table: string): {
      upsert(payload: { etapa: number; codigo_cuh: string; modelo: string; precio_cuh: number; partida: string; manzana: number; lote: number; ubicacion?: string | null; area_lote?: number | null; precio_promotor?: number | null; }[], arg1: { onConflict: string; ignoreDuplicates: boolean; }): { error: any; } | PromiseLike<{ error: any; }>;
      insert(arg0: { id: any; email: string; phone: string; first_name: string; last_name: string; country_code: string; role_code: string; }): { error: any; } | PromiseLike<{ error: any; }>;
      select: (query: string) => any;
      update: (values: Record<string, any>) => any;
      eq: (column: string, value: any) => any;
      single: () => any;
    };
  }
  export function createClient(url: string, key: string): SupabaseClient;
}

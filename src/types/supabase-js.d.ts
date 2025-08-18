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
      select: (query: string) => any;
      update: (values: Record<string, any>) => any;
      eq: (column: string, value: any) => any;
      single: () => any;
    };
  }
  export function createClient(url: string, key: string): SupabaseClient;
}

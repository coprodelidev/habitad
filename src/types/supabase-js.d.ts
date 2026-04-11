declare module '@supabase/supabase-js' {
  export interface User {
    id: string;
    email?: string | null;
    user_metadata: Record<string, any>;
  }
  export interface SupabaseClient {
    auth: {
      signOut(): any;
      getUser(): Promise<{ data: { user: User | null }; error: any }>;
      signInWithPassword(opts: { email: string; password: string }): Promise<{ data: { user: User | null }; error: Error | null }>;
      signUp(opts: { email: string; password: string; options: { data: Record<string, any> } }): Promise<{ data: any; error: Error | null }>;
    };
    from(table: string): any;
    rpc(fn: string, args?: Record<string, any>): any;
    schema(name: string): SupabaseClient;
    storage: {
      from(bucket: string): {
        upload(path: string, file: File | Blob | ArrayBuffer, options?: { upsert?: boolean; contentType?: string }): Promise<{ data: { path: string } | null; error: any }>;
        download(path: string): Promise<{ data: Blob | null; error: any }>;
        getPublicUrl(path: string): { data: { publicUrl: string } };
        createSignedUrl(path: string, expiresIn: number): Promise<{ data: { signedUrl: string } | null; error: any }>;
        remove(paths: string[]): Promise<{ data: any; error: any }>;
      };
    };
  }
  export function createClient(url: string, key: string, options?: any): SupabaseClient;
}

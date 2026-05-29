import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Promueve un batch ya cargado en v2.import_cuh_staging.
// Body: { batch_id: uuid }. Devuelve métricas de la función.
// La función fn_promote_staging es SECURITY DEFINER, por lo que opera
// con permisos elevados, pero EXECUTE está GRANT solo a 'authenticated'.
// Usamos el cliente con el access token del usuario; RLS valida que es
// admin via la policy de import_cuh_staging.

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ error: 'supabase env missing (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY)' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: 'unauthorized — missing bearer token' }, { status: 401 });

  const userClient = createClient(url, anon, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  let body: { batch_id?: string };
  try { body = await req.json(); } catch { body = {}; }
  if (!body.batch_id) {
    return NextResponse.json({ error: 'batch_id required' }, { status: 400 });
  }

  const v2 = userClient.schema('v2' as any) as any;
  const { data, error } = await v2.rpc('fn_promote_staging', { p_batch: body.batch_id });
  if (error) {
    const isRls = error.code === '42501' || (error.message ?? '').includes('row-level security') || (error.message ?? '').includes('permission denied');
    return NextResponse.json(
      { error: isRls ? 'forbidden — admin only' : error.message },
      { status: isRls ? 403 : 500 },
    );
  }
  return NextResponse.json({ ok: true, result: data?.[0] ?? data });
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Promueve un batch ya cargado en v2.import_cuh_staging.
// Body: { batch_id: uuid }.
//
// AUTHZ EXPLÍCITO: fn_promote_staging es SECURITY DEFINER (bypassa RLS al
// ejecutar). NO podemos confiar en RLS para protegerla — debemos verificar
// el rol del caller manualmente antes de invocar la función.
// El check se hace via SELECT a v2.is_admin() que usa auth.uid() del JWT.

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ error: 'supabase env missing' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: 'unauthorized — missing bearer token' }, { status: 401 });

  const userClient = createClient(url, anon, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  // Verificar identidad del JWT
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: 'invalid session' }, { status: 401 });
  }

  // Verificar rol admin explícitamente (NO confiar en RLS porque la función es SECURITY DEFINER)
  const v2 = userClient.schema('v2' as any) as any;
  const { data: isAdminResult, error: roleErr } = await v2.rpc('is_admin');
  if (roleErr || !isAdminResult) {
    return NextResponse.json({ error: 'forbidden — admin only' }, { status: 403 });
  }

  let body: { batch_id?: string };
  try { body = await req.json(); } catch { body = {}; }
  if (!body.batch_id) {
    return NextResponse.json({ error: 'batch_id required' }, { status: 400 });
  }
  // Validar UUID format antes de pasar a Postgres
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.batch_id)) {
    return NextResponse.json({ error: 'invalid batch_id format' }, { status: 400 });
  }

  const { data, error } = await v2.rpc('fn_promote_staging', { p_batch: body.batch_id });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, result: data?.[0] ?? data });
}

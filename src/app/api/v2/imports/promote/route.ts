import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Promueve un batch ya cargado en v2.import_cuh_staging.
// Body: { batch_id: uuid }. Devuelve métricas de la función.

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !service || !anon) {
    return NextResponse.json({ error: 'supabase env missing' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : null;
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const userClient = createClient(url, anon, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: 'invalid session' }, { status: 401 });
  }

  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { data: profile } = await admin
    .from('profiles')
    .select('roles:role_id(code)')
    .eq('id', userData.user.id)
    .single();
  if ((profile as any)?.roles?.code !== 'administrador') {
    return NextResponse.json({ error: 'forbidden — admin only' }, { status: 403 });
  }

  let body: { batch_id?: string };
  try { body = await req.json(); } catch { body = {}; }
  if (!body.batch_id) {
    return NextResponse.json({ error: 'batch_id required' }, { status: 400 });
  }

  const v2 = admin.schema('v2' as any) as any;
  const { data, error } = await v2.rpc('fn_promote_staging', { p_batch: body.batch_id });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, result: data?.[0] ?? data });
}

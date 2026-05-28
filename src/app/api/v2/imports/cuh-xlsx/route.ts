import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Endpoint server-side para insertar filas de staging del XLSX
// "CUH SAN FERNANDO 2026 CMR". El cliente parsea el XLSX en el browser
// (libre del límite de 4.5MB de Vercel Hobby) y manda chunks de filas
// ya mapeadas como objetos staging.
//
// Auth: Bearer token de la sesión del usuario. Validamos contra
// public.profiles que el role es 'administrador' antes de insertar.

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Payload = {
  batch_id: string;
  rows: Array<Record<string, unknown>>;
};

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!url || !service || !anon) {
    return NextResponse.json({ error: 'supabase env missing' }, { status: 500 });
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const userClient = createClient(url, anon, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: 'invalid session' }, { status: 401 });
  }
  const userId = userData.user.id;

  const admin = createClient(url, service, { auth: { persistSession: false } });
  const { data: profile, error: profErr } = await admin
    .from('profiles')
    .select('role_id, roles:role_id(code)')
    .eq('id', userId)
    .single();
  if (profErr || !profile) {
    return NextResponse.json({ error: 'profile not found' }, { status: 403 });
  }
  const roleCode = (profile as any).roles?.code;
  if (roleCode !== 'administrador') {
    return NextResponse.json({ error: 'forbidden — admin only' }, { status: 403 });
  }

  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  if (!body.batch_id || !Array.isArray(body.rows) || body.rows.length === 0) {
    return NextResponse.json({ error: 'batch_id and rows[] required' }, { status: 400 });
  }
  if (body.rows.length > 5000) {
    return NextResponse.json({ error: 'max 5000 rows per chunk' }, { status: 400 });
  }

  const v2 = admin.schema('v2' as any) as any;
  const enriched = body.rows.map((r) => {
    const out: any = { ...r, import_batch_id: body.batch_id, status: 'pending' };
    if (typeof out.row_num === 'string') out.row_num = parseInt(out.row_num, 10);
    return out;
  });

  const { error: insertErr, count } = await v2
    .from('import_cuh_staging')
    .insert(enriched, { count: 'exact' });

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, batch_id: body.batch_id, inserted: count ?? enriched.length });
}

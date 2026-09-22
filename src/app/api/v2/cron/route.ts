import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Endpoint protegido llamado por Vercel Cron (diario 12:00 UTC) para:
//   - Alertar sobre separaciones e iniciales vencidas para revisión de retiro.
//   - Recordar los trámites pendientes de clientes retirados.
//   - Marcar cuotas como vencidas (por fecha) → v2.fn_marcar_cuotas_vencidas()
//
// Autenticación: Vercel Cron inyecta automáticamente
//   Authorization: Bearer <CRON_SECRET>
// también aceptamos `x-cron-secret` para invocaciones manuales.
//
// Las funciones SQL son SECURITY DEFINER y tienen GRANT EXECUTE a anon,
// por lo que NO necesitamos SUPABASE_SERVICE_ROLE_KEY (que no está
// configurada en Vercel — descubierto en auditoría externa 4ª ronda).
// El endpoint está protegido por CRON_SECRET; cualquier acceso anon que
// alguien hiciera a las RPCs solo dispararía las mismas acciones idempotentes
// (notificar pendientes; las liberaciones requieren confirmación administrativa).

export const dynamic = 'force-dynamic';

async function runCron(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  const authHeader = req.headers.get('authorization') ?? '';
  const bearer = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : null;
  const manual = req.headers.get('x-cron-secret');
  if (bearer !== expected && manual !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ error: 'supabase env missing (URL or ANON_KEY)' }, { status: 500 });
  }

  // Anon client: las funciones SQL son SECURITY DEFINER con GRANT a authenticated
  // y a anon — no requieren service-role.
  const sb = createClient(url, anon, { auth: { persistSession: false } });
  const v2 = sb.schema('v2' as any) as any;

  const { data, error } = await v2.rpc('fn_cron_run');
  if (error) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ts: new Date().toISOString(), ...data });
}

export async function GET(req: NextRequest) {
  return runCron(req);
}

export async function POST(req: NextRequest) {
  return runCron(req);
}

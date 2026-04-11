import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Endpoint protegido llamado por Vercel Cron (hourly) para:
//   - Liberar separaciones vencidas (24h) → v2.liberar_separaciones_vencidas()
//   - Cancelar iniciales vencidas (3m) → v2.cancelar_iniciales_vencidas()
//   - Marcar cuotas como vencidas (por fecha)
//
// Autenticación: Vercel Cron inyecta automáticamente
//   Authorization: Bearer <CRON_SECRET>
// cuando existe el env var CRON_SECRET en el proyecto. Aceptamos también
// `x-cron-secret` como fallback para invocaciones manuales de admin.

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) {
    return NextResponse.json({ error: 'supabase env missing' }, { status: 500 });
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const v2 = sb.schema('v2' as any) as any;

  const results: Record<string, unknown> = {};

  // 1) Liberar separaciones — la función vive en schema v2, debemos targetearla
  const liberar = await v2.rpc('liberar_separaciones_vencidas');
  results.separaciones_liberadas = liberar.data ?? liberar.error?.message ?? 0;

  // 2) Cancelar iniciales vencidas
  const cancelar = await v2.rpc('cancelar_iniciales_vencidas');
  results.iniciales_canceladas = cancelar.data ?? cancelar.error?.message ?? 0;

  // 3) Marcar cuotas vencidas
  const hoy = new Date().toISOString().slice(0, 10);
  const vencidas = await v2
    .from('cuotas')
    .update({ estado: 'vencida' })
    .eq('estado', 'pendiente')
    .lt('fecha_vencimiento', hoy)
    .select('id');
  results.cuotas_marcadas_vencidas = vencidas.data?.length ?? 0;

  return NextResponse.json({ ok: true, ts: new Date().toISOString(), ...results });
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Endpoint protegido para ser llamado por Vercel Cron / GitHub Actions / cualquier scheduler externo.
// Tareas:
//   - Liberar separaciones vencidas (24h) → llama a v2.liberar_separaciones_vencidas()
//   - Cancelar iniciales vencidas (3m) → llama a v2.cancelar_iniciales_vencidas()
//   - Marcar cuotas como vencidas (por fecha)
//
// Autenticación: header `x-cron-secret` debe coincidir con CRON_SECRET.

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
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

  // 1) Liberar separaciones
  const liberar = await sb.rpc('liberar_separaciones_vencidas' as any);
  results.separaciones_liberadas = (liberar as any).data ?? liberar.error?.message ?? 0;

  // 2) Cancelar iniciales vencidas
  const cancelar = await sb.rpc('cancelar_iniciales_vencidas' as any);
  results.iniciales_canceladas = (cancelar as any).data ?? cancelar.error?.message ?? 0;

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

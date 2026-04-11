'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/v2/Sidebar';
import { useV2User } from '@/lib/v2/useV2User';
import { isCliente } from '@/lib/v2/permissions';

export default function V2Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useV2User();

  // /v2/print/* son páginas standalone (para imprimir). Saltan el sidebar y los guards de rol.
  // El cliente SÍ necesita poder abrirlas para ver sus propios documentos emitidos.
  const isPrintRoute = pathname?.startsWith('/v2/print') ?? false;

  useEffect(() => {
    if (isPrintRoute) return; // print rutas: sin guards
    if (!loading && !user) {
      router.replace('/');
      return;
    }
    if (!user) return;
    // Cliente: solo puede estar en /v2/portal (o subrutas). Cualquier otro path → portal.
    if (isCliente(user.roleCode) && !pathname?.startsWith('/v2/portal')) {
      router.replace('/v2/portal');
      return;
    }
    // Promotor aterriza en el plano — su herramienta operativa principal
    if (user.roleCode === 'promotor' && pathname === '/v2') {
      router.replace('/v2/plano');
    }
  }, [loading, user, router, pathname, isPrintRoute]);

  if (isPrintRoute) {
    // Standalone: el /v2/print/layout.tsx se encarga del shell mínimo
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-500">Cargando…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar role={user.roleCode} email={user.email} />
      <main className="ml-64 min-h-screen p-6">
        {children}
      </main>
    </div>
  );
}

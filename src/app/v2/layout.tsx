'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu as MenuIcon } from 'lucide-react';
import { Sidebar } from '@/components/v2/Sidebar';
import { useV2User } from '@/lib/v2/useV2User';
import { isCliente } from '@/lib/v2/permissions';

export default function V2Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useV2User();
  const [menuOpen, setMenuOpen] = useState(true);

  const isPrintRoute = pathname?.startsWith('/v2/print') ?? false;

  useEffect(() => {
    if (isPrintRoute) return;
    if (!loading && !user) {
      router.replace('/');
      return;
    }
    if (!user) return;
    if (isCliente(user.roleCode) && !pathname?.startsWith('/v2/portal')) {
      router.replace('/v2/portal');
      return;
    }
    if (user.roleCode === 'promotor' && pathname === '/v2') {
      router.replace('/v2/plano');
    }
  }, [loading, user, router, pathname, isPrintRoute]);

  if (isPrintRoute) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-slate-500">Cargando…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {menuOpen && (
        <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-[rgb(14,8,201)] text-white pt-20">
          <Sidebar role={user.roleCode} email={user.email} />
        </aside>
      )}

      <button
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Toggle menu"
        className={`fixed top-4 left-4 z-50 p-2 rounded-md transition-colors ${
          menuOpen ? 'bg-white text-blue-700 shadow' : 'bg-blue-700 text-white border border-gray-300'
        }`}
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      <main className={`flex-1 p-6 transition-all duration-300 ${menuOpen ? 'md:ml-64' : 'ml-0'} min-h-screen`}>
        <div className="mt-12">{children}</div>
      </main>
    </div>
  );
}

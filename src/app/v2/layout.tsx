'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/v2/Sidebar';
import { useV2User } from '@/lib/v2/useV2User';

export default function V2Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useV2User();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [loading, user, router]);

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

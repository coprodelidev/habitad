'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Map,
  Building2,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  ClipboardList,
  Eye,
  Bell,
} from 'lucide-react';
import { isAdmin, isStaff, isAuditor, isCliente, type RoleCode } from '@/lib/v2/permissions';

const isPromotor = (r: RoleCode | null) => r === 'promotor';
import { supabasePublic, supabaseV2 } from '@/lib/v2/supabaseV2';
import { useRouter } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  visible: (role: RoleCode | null) => boolean;
  badge?: number;
}

// Inicio solo para roles de supervisión (admin, gerente, coordinador, supervisor, asistente, auditor).
// El promotor no tiene dashboard — se redirige directamente al plano, su herramienta operativa.
const NAV_BASE: NavItem[] = [
  { href: '/v2', label: 'Inicio', icon: LayoutDashboard, visible: (r) => (isStaff(r) && !isPromotor(r)) || isAuditor(r) },
  { href: '/v2/plano', label: 'Plano', icon: Map, visible: (r) => isStaff(r) || isAuditor(r) },
  { href: '/v2/propiedades', label: 'Propiedades', icon: Building2, visible: (r) => isStaff(r) || isAuditor(r) },
  { href: '/v2/ventas', label: 'Ventas', icon: ClipboardList, visible: (r) => isStaff(r) || isAuditor(r) },
  { href: '/v2/pagos', label: 'Pagos', icon: CreditCard, visible: (r) => isStaff(r) || isAuditor(r) },
  { href: '/v2/reportes', label: 'Reportes', icon: BarChart3, visible: (r) => isStaff(r) || isAuditor(r) },
  { href: '/v2/notificaciones', label: 'Notificaciones', icon: Bell, visible: (r) => isStaff(r) || isAuditor(r) },
  { href: '/v2/admin', label: 'Administración', icon: Settings, visible: (r) => isAdmin(r) },
  { href: '/v2/portal', label: 'Mi cuenta', icon: Eye, visible: (r) => isCliente(r) },
];

export function Sidebar({ role, email }: { role: RoleCode | null; email: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { count } = await supabaseV2
        .from('notificaciones')
        .select('id', { count: 'exact', head: true })
        .eq('leida', false);
      if (active) setUnread(count ?? 0);
    };
    load();
    const t = setInterval(load, 30000);
    return () => { active = false; clearInterval(t); };
  }, [pathname]);

  const handleLogout = async () => {
    await supabasePublic.auth.signOut();
    router.push('/');
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-slate-900 text-slate-100">
      <div className="flex h-16 items-center px-6 text-lg font-semibold tracking-tight border-b border-slate-800">
        Habitad <span className="ml-2 rounded-md bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300">v2</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_BASE.filter((i) => i.visible(role)).map((item) => {
          const active = pathname === item.href || (item.href !== '/v2' && pathname?.startsWith(item.href));
          const Icon = item.icon;
          const showBadge = item.href === '/v2/notificaciones' && unread > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                active ? 'bg-indigo-500/20 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-800 p-4 text-xs">
        <div className="mb-2 text-slate-400">{email ?? 'Sin sesión'}</div>
        <div className="mb-3 inline-block rounded bg-slate-800 px-2 py-0.5 text-slate-300">
          {role ?? 'sin rol'}
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

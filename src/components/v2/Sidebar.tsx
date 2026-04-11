'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Map,
  Building2,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  ClipboardList,
  Eye,
  Bell,
} from 'lucide-react';
import { isAdmin, isStaff, isAuditor, isCliente, type RoleCode } from '@/lib/v2/permissions';
import { supabasePublic, supabaseV2 } from '@/lib/v2/supabaseV2';
import { useRouter } from 'next/navigation';

const isPromotor = (r: RoleCode | null) => r === 'promotor';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
  visible: (role: RoleCode | null) => boolean;
}

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
    <div className="flex h-full flex-col">
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-2">
        {NAV_BASE.filter((i) => i.visible(role)).map((item) => {
          const active = pathname === item.href || (item.href !== '/v2' && pathname?.startsWith(item.href));
          const Icon = item.icon;
          const showBadge = item.href === '/v2/notificaciones' && unread > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg p-3 text-white transition-colors duration-200 ${
                active ? 'bg-blue-900' : 'hover:bg-blue-800'
              }`}
            >
              <Icon size={20} />
              <span className="flex-1 font-medium">{item.label}</span>
              {showBadge && (
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-blue-900/60 p-4 text-xs text-white/80">
        <div className="mb-1 truncate">{email ?? 'Sin sesión'}</div>
        <div className="mb-3 inline-block rounded bg-blue-900 px-2 py-0.5 text-white">
          {role ?? 'sin rol'}
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg p-3 text-white transition-colors hover:bg-blue-800"
        >
          <LogOut size={18} /> <span className="font-medium">Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Users, Sliders, FileClock, Layers, DollarSign, Upload } from 'lucide-react';
import { useV2User } from '@/lib/v2/useV2User';
import { isAdmin } from '@/lib/v2/permissions';

const TILES = [
  { href: '/v2/admin/usuarios', icon: Users, title: 'Usuarios y roles', desc: 'Altas, bajas y asignación de roles' },
  { href: '/v2/admin/parametros', icon: Sliders, title: 'Parámetros', desc: 'Plazos, bancos, plantillas' },
  { href: '/v2/admin/auditoria', icon: FileClock, title: 'Auditoría', desc: 'Historial append-only de cambios' },
  { href: '/v2/admin/etapas', icon: Layers, title: 'Etapas', desc: 'Subproyectos y planos' },
  { href: '/v2/admin/tipo-cambio', icon: DollarSign, title: 'Tipo de cambio SBS', desc: 'Cache diario PEN/USD' },
  { href: '/v2/admin/imports', icon: Upload, title: 'Importar CUH', desc: 'Cargar XLSX operativo y promover a v2' },
];

export default function AdminHome() {
  const { user, loading } = useV2User();
  if (loading) {
    return <div className="text-slate-500">Cargando…</div>;
  }
  if (!isAdmin(user?.roleCode)) {
    return <div className="rounded bg-yellow-50 p-4 text-sm text-yellow-800">Solo administradores.</div>;
  }
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Administración</h1>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {TILES.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-indigo-400 hover:shadow"
          >
            <div className="mb-2 flex items-center gap-2 text-indigo-600">
              <t.icon className="h-5 w-5" />
              <span className="font-semibold text-slate-900">{t.title}</span>
            </div>
            <div className="text-sm text-slate-500">{t.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

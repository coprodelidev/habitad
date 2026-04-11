'use client';

import { useEffect, useState } from 'react';
import { supabasePublic } from '@/lib/v2/supabaseV2';
import { useV2User } from '@/lib/v2/useV2User';
import { isAdmin } from '@/lib/v2/permissions';
import { formatDate } from '@/lib/v2/format';

interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  role_id: string | null;
  use_v2: boolean;
  updated_at: string;
  roles?: { code: string; label: string } | null;
}

interface Role { id: string; code: string; label: string }

export default function UsuariosPage() {
  const { user } = useV2User();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const canAdmin = isAdmin(user?.roleCode);

  const load = async () => {
    setLoading(true);
    const [p, r] = await Promise.all([
      supabasePublic.from('profiles').select('id, email, first_name, last_name, role_id, use_v2, updated_at, roles ( code, label )').order('updated_at', { ascending: false }),
      supabasePublic.from('roles').select('id, code, label').order('label'),
    ]);
    setProfiles((p.data ?? []) as unknown as Profile[]);
    setRoles((r.data ?? []) as Role[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateRole = async (id: string, role_id: string) => {
    await supabasePublic.from('profiles').update({ role_id }).eq('id', id);
    load();
  };

  const toggleV2 = async (id: string, use_v2: boolean) => {
    await supabasePublic.from('profiles').update({ use_v2 }).eq('id', id);
    load();
  };

  if (!canAdmin) return <div className="rounded bg-yellow-50 p-4 text-sm text-yellow-800">Solo administradores.</div>;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Usuarios y roles</h1>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2">Usuario</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Rol</th>
              <th className="px-3 py-2">Usar v2</th>
              <th className="px-3 py-2">Actualizado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-500">Cargando…</td></tr>
            ) : profiles.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-3 py-1.5">{[p.first_name, p.last_name].filter(Boolean).join(' ') || '—'}</td>
                <td className="px-3 py-1.5">{p.email ?? '—'}</td>
                <td className="px-3 py-1.5">
                  <select
                    value={p.role_id ?? ''}
                    onChange={(e) => updateRole(p.id, e.target.value)}
                    className="rounded border border-slate-300 px-2 py-1 text-xs"
                  >
                    <option value="">—</option>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="checkbox"
                    checked={p.use_v2}
                    onChange={(e) => toggleV2(p.id, e.target.checked)}
                  />
                </td>
                <td className="px-3 py-1.5 text-xs text-slate-500">{formatDate(p.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Activa <strong>Usar v2</strong> para los usuarios que deban ser redirigidos al nuevo panel al iniciar sesión.
      </p>
    </div>
  );
}

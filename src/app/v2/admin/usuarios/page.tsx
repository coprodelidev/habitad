'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
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

interface Role {
  id: string;
  code: string;
  label: string;
}

export default function UsuariosPage() {
  const { user, loading: loadingUser } = useV2User();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePromotor, setShowCreatePromotor] = useState(false);
  const [creatingPromotor, setCreatingPromotor] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createOk, setCreateOk] = useState<string | null>(null);
  const [newPromotor, setNewPromotor] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });

  const canAdmin = isAdmin(user?.roleCode);
  const promotorRoleId = roles.find((r) => r.code === 'promotor')?.id ?? null;

  const load = async () => {
    setLoading(true);
    const [p, r] = await Promise.all([
      supabasePublic
        .from('profiles')
        .select('id, email, first_name, last_name, role_id, use_v2, updated_at, roles ( code, label )')
        .order('updated_at', { ascending: false }),
      supabasePublic.from('roles').select('id, code, label').order('label'),
    ]);
    setProfiles((p.data ?? []) as unknown as Profile[]);
    setRoles((r.data ?? []) as Role[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateRole = async (id: string, role_id: string) => {
    await supabasePublic.from('profiles').update({ role_id }).eq('id', id);
    load();
  };

  const toggleV2 = async (id: string, use_v2: boolean) => {
    await supabasePublic.from('profiles').update({ use_v2 }).eq('id', id);
    load();
  };

  const createPromotor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);
    setCreateOk(null);

    const email = newPromotor.email.trim().toLowerCase();
    const password = newPromotor.password;
    const firstName = newPromotor.first_name.trim();
    const lastName = newPromotor.last_name.trim();

    if (!email || !password || !firstName || !lastName) {
      setCreateError('Completa email, clave, nombres y apellidos.');
      return;
    }
    if (password.length < 6) {
      setCreateError('La clave debe tener al menos 6 caracteres.');
      return;
    }
    if (!promotorRoleId) {
      setCreateError('No existe el rol promotor. Revisa la tabla roles.');
      return;
    }

    setCreatingPromotor(true);
    try {
      // Isolated client so admin session is not replaced after sign up.
      const isolatedAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });

      const { data, error } = await isolatedAuth.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            second_name: '',
            second_last_name: '',
            role: 'promotor',
          },
        },
      });

      if (error) throw error;

      const createdUserId = (data as any)?.user?.id ?? (data as any)?.session?.user?.id ?? null;

      if (createdUserId) {
        await supabasePublic
          .from('profiles')
          .update({
            role_id: promotorRoleId,
            use_v2: true,
            first_name: firstName,
            last_name: lastName,
            email,
          })
          .eq('id', createdUserId);
      }

      setCreateOk('Promotor creado correctamente.');
      setNewPromotor({ email: '', password: '', first_name: '', last_name: '' });
      await load();
    } catch (err: any) {
      setCreateError(err?.message ?? 'No se pudo crear el promotor.');
    } finally {
      setCreatingPromotor(false);
    }
  };

  if (loadingUser) return <div className="text-slate-500">Cargando...</div>;
  if (!canAdmin) return <div className="rounded bg-yellow-50 p-4 text-sm text-yellow-800">Solo administradores.</div>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Usuarios y roles</h1>
        <button
          type="button"
          onClick={() => {
            setShowCreatePromotor((value) => !value);
            setCreateError(null);
            setCreateOk(null);
          }}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showCreatePromotor ? 'Cerrar alta' : 'Crear promotor'}
        </button>
      </div>

      {showCreatePromotor && (
        <form onSubmit={createPromotor} className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50/40 p-4">
          <div className="mb-3 text-sm font-medium text-slate-700">Alta rapida de promotor</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="text-xs text-slate-600">
              Email
              <input
                type="email"
                value={newPromotor.email}
                onChange={(e) => setNewPromotor((v) => ({ ...v, email: e.target.value }))}
                className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
                placeholder="promotor@empresa.com"
                required
              />
            </label>
            <label className="text-xs text-slate-600">
              Clave temporal
              <input
                type="password"
                value={newPromotor.password}
                onChange={(e) => setNewPromotor((v) => ({ ...v, password: e.target.value }))}
                className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
                placeholder="Minimo 6 caracteres"
                required
              />
            </label>
            <label className="text-xs text-slate-600">
              Nombres
              <input
                type="text"
                value={newPromotor.first_name}
                onChange={(e) => setNewPromotor((v) => ({ ...v, first_name: e.target.value }))}
                className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
                required
              />
            </label>
            <label className="text-xs text-slate-600">
              Apellidos
              <input
                type="text"
                value={newPromotor.last_name}
                onChange={(e) => setNewPromotor((v) => ({ ...v, last_name: e.target.value }))}
                className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
                required
              />
            </label>
          </div>

          {createError && <p className="mt-3 text-sm text-red-600">{createError}</p>}
          {createOk && <p className="mt-3 text-sm text-emerald-700">{createOk}</p>}

          <div className="mt-3 flex items-center gap-2">
            <button
              type="submit"
              disabled={creatingPromotor}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creatingPromotor ? 'Creando...' : 'Guardar promotor'}
            </button>
            <p className="text-xs text-slate-500">Se crea con rol promotor y uso v2 activado.</p>
          </div>
        </form>
      )}

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
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                  Cargando...
                </td>
              </tr>
            ) : (
              profiles.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-3 py-1.5">{[p.first_name, p.last_name].filter(Boolean).join(' ') || '-'}</td>
                  <td className="px-3 py-1.5">{p.email ?? '-'}</td>
                  <td className="px-3 py-1.5">
                    <select
                      value={p.role_id ?? ''}
                      onChange={(e) => updateRole(p.id, e.target.value)}
                      className="rounded border border-slate-300 px-2 py-1 text-xs"
                    >
                      <option value="">-</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-1.5">
                    <input type="checkbox" checked={p.use_v2} onChange={(e) => toggleV2(p.id, e.target.checked)} />
                  </td>
                  <td className="px-3 py-1.5 text-xs text-slate-500">{formatDate(p.updated_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Activa <strong>Usar v2</strong> para los usuarios que deban ser redirigidos al nuevo panel al iniciar sesion.
      </p>
    </div>
  );
}

'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
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
  sap_sales_person_code: number | null;
  use_v2: boolean;
  updated_at: string;
  roles?: { code: string; label: string } | null;
}

interface Role {
  id: string;
  code: string;
  label: string;
}

function parseSapCode(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  if (!/^\d+$/.test(t)) return Number.NaN;
  const n = Number(t);
  if (!Number.isInteger(n) || n <= 0) return Number.NaN;
  return n;
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
  const [sapCodes, setSapCodes] = useState<Record<string, string>>({});
  const [sapSavingId, setSapSavingId] = useState<string | null>(null);
  const [sapError, setSapError] = useState<string | null>(null);
  const [sapOk, setSapOk] = useState<string | null>(null);
  const [newPromotor, setNewPromotor] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    sap_sales_person_code: '',
  });

  const canAdmin = isAdmin(user?.roleCode);
  const promotorRoleId = useMemo(
    () => roles.find((r) => r.code === 'promotor')?.id ?? null,
    [roles],
  );

  const load = async () => {
    setLoading(true);
    const [p, r] = await Promise.all([
      supabasePublic
        .from('profiles')
        .select('id, email, first_name, last_name, role_id, sap_sales_person_code, use_v2, updated_at, roles ( code, label )')
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

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const p of profiles) next[p.id] = p.sap_sales_person_code != null ? String(p.sap_sales_person_code) : '';
    setSapCodes(next);
  }, [profiles]);

  const updateRole = async (id: string, role_id: string) => {
    await supabasePublic.from('profiles').update({ role_id }).eq('id', id);
    load();
  };

  const toggleV2 = async (id: string, use_v2: boolean) => {
    await supabasePublic.from('profiles').update({ use_v2 }).eq('id', id);
    load();
  };

  const saveSapCode = async (id: string) => {
    setSapError(null);
    setSapOk(null);

    const parsed = parseSapCode(sapCodes[id] ?? '');
    if (Number.isNaN(parsed)) {
      setSapError('Codigo SAP invalido. Usa solo numeros positivos.');
      return;
    }

    setSapSavingId(id);
    try {
      const { error } = await supabasePublic
        .from('profiles')
        .update({ sap_sales_person_code: parsed })
        .eq('id', id);
      if (error) throw error;
      setSapOk('Codigo SAP guardado.');
      await load();
    } catch (e: any) {
      setSapError(e?.message ?? 'No se pudo guardar el codigo SAP.');
    } finally {
      setSapSavingId(null);
    }
  };

  const createPromotor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);
    setCreateOk(null);

    const email = newPromotor.email.trim().toLowerCase();
    const password = newPromotor.password;
    const firstName = newPromotor.first_name.trim();
    const lastName = newPromotor.last_name.trim();
    const sapCodeParsed = parseSapCode(newPromotor.sap_sales_person_code);

    if (!email || !password || !firstName || !lastName) {
      setCreateError('Completa email, clave, nombres y apellidos.');
      return;
    }
    if (Number.isNaN(sapCodeParsed) || sapCodeParsed == null) {
      setCreateError('Debes ingresar un SalesPersonCode SAP numerico valido.');
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
            sap_sales_person_code: sapCodeParsed,
          },
        },
      });

      if (error) throw error;

      const createdUserId = (data as any)?.user?.id ?? (data as any)?.session?.user?.id ?? null;

      if (createdUserId) {
        const { error: profileError } = await supabasePublic
          .from('profiles')
          .update({
            role_id: promotorRoleId,
            use_v2: true,
            first_name: firstName,
            last_name: lastName,
            email,
            sap_sales_person_code: sapCodeParsed,
          })
          .eq('id', createdUserId);
        if (profileError) throw profileError;
      }

      setCreateOk('Promotor creado correctamente.');
      setNewPromotor({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        sap_sales_person_code: '',
      });
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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
              SalesPersonCode SAP
              <input
                type="text"
                inputMode="numeric"
                value={newPromotor.sap_sales_person_code}
                onChange={(e) => setNewPromotor((v) => ({ ...v, sap_sales_person_code: e.target.value }))}
                className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
                placeholder="Ej: 95"
                required
              />
            </label>
            <label className="text-xs text-slate-600 md:col-span-1">
              Nombres
              <input
                type="text"
                value={newPromotor.first_name}
                onChange={(e) => setNewPromotor((v) => ({ ...v, first_name: e.target.value }))}
                className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
                required
              />
            </label>
            <label className="text-xs text-slate-600 md:col-span-2">
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
            <p className="text-xs text-slate-500">Se crea con rol promotor, uso v2 y codigo SAP.</p>
          </div>
        </form>
      )}

      {sapError && <div className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">{sapError}</div>}
      {sapOk && <div className="mb-3 rounded bg-emerald-50 p-3 text-sm text-emerald-700">{sapOk}</div>}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2">Usuario</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Rol</th>
              <th className="px-3 py-2">SalesPersonCode SAP</th>
              <th className="px-3 py-2">Usar v2</th>
              <th className="px-3 py-2">Actualizado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
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
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={sapCodes[p.id] ?? ''}
                        onChange={(e) => setSapCodes((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        className="h-8 w-24 rounded border border-slate-300 px-2 text-xs"
                        placeholder="Codigo"
                      />
                      <button
                        type="button"
                        onClick={() => saveSapCode(p.id)}
                        disabled={sapSavingId === p.id}
                        className="h-8 rounded border border-slate-300 bg-white px-2 text-xs hover:bg-slate-50 disabled:opacity-50"
                      >
                        {sapSavingId === p.id ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
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

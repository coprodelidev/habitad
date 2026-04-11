'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabasePublic } from './supabaseV2';
import type { RoleCode } from './permissions';

export interface V2User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  roleCode: RoleCode | null;
  useV2: boolean;
}

export function useV2User() {
  const [user, setUser] = useState<V2User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: auth, error: authErr } = await supabasePublic.auth.getUser();
      if (authErr || !auth.user) {
        setUser(null);
        setLoading(false);
        return;
      }
      const { data: prof, error: profErr } = await supabasePublic
        .from('profiles')
        .select('id, email, first_name, last_name, use_v2, roles ( code )')
        .eq('id', auth.user.id)
        .single();
      if (profErr) throw profErr;
      const roleCode = (prof as any)?.roles?.code ?? null;
      setUser({
        id: auth.user.id,
        email: prof?.email ?? auth.user.email ?? null,
        firstName: (prof as any)?.first_name ?? null,
        lastName: (prof as any)?.last_name ?? null,
        roleCode: roleCode as RoleCode | null,
        useV2: !!(prof as any)?.use_v2,
      });
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { user, loading, error, reload: load };
}

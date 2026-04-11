'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { syncProfile as syncUserProfile } from './syncProfile';
import { useUser } from '@/contexts/UserContext';

interface Props { onAuthenticated?: (userId: string) => void; }
interface FormValues { email: string; password: string; }

export default function LoginForm({ onAuthenticated }: Props) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { refreshProfile } = useUser();

  const onSubmit = async (values: FormValues) => {
    setMessage(null);
    setLoading(true);

    console.log("🔐 Iniciando login con:", values.email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    console.log("📡 Respuesta de signInWithPassword:", { data, error });

    if (error) {
      setMessage(error.message.includes('Email not confirmed')
        ? 'Debes confirmar tu email antes de continuar.'
        : error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      console.log("👤 Sincronizando perfil para usuario:", data.user.id);
      await syncUserProfile(supabase, data.user);

      const { data: prof, error: profError } = await supabase
        .from('profiles')
        .select('role_id, use_v2, roles ( code )')
        .eq('id', data.user.id)
        .single();

      console.log("📊 Perfil obtenido:", { prof, profError });

      if (profError) {
        console.error("🚨 Error al obtener perfil:", profError.message);
      } else if (prof?.roles?.code) {
        try {
          sessionStorage.setItem('role_code', prof.roles.code);
          console.log("✅ Role code guardado en sessionStorage:", prof.roles.code);
        } catch {
          console.error("🚨 Error al guardar role_code en sessionStorage");
        }
      }

      onAuthenticated?.(data.user.id);
      console.log("🔄 Forzando actualización de UserContext");
      await refreshProfile();

      const target = prof?.use_v2 ? '/v2' : '/dashboard';
      console.log("➡️ Redirigiendo a", target);
      router.push(target);
    }

    setLoading(false);
  };

  const cls = "h-11 w-full rounded-md border border-gray-200 bg-slate-50 text-slate-900 px-3 " +
              "placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-700">Correo</label>
        <input type="email" disabled={loading} className={cls}
               autoComplete="email"
               {...register('email', { required: 'Email requerido' })} />
        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-700">Contraseña</label>
        <input type="password" disabled={loading} className={cls}
               autoComplete="current-password"
               {...register('password', { required: 'Contraseña requerida' })} />
        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
      </div>

      {message && <p className="text-sm text-red-500">{message}</p>}

      <button type="submit" disabled={loading}
        className="h-11 rounded-md bg-blue-600 px-4 text-white disabled:opacity-50">
        {loading
          ? <span className="mx-auto block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          : 'Iniciar sesión'}
      </button>
    </form>
  );
}
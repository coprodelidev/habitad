'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabaseClient';

const dialCodes = [
  { code: 'ES', dial: '+34', name: 'España' },
  { code: 'PE', dial: '+51', name: 'Perú' },
  { code: 'EC', dial: '+593', name: 'Ecuador' },
  { code: 'CO', dial: '+57', name: 'Colombia' },
  { code: 'BO', dial: '+591', name: 'Bolivia' },
];

type FormValues = {
  email: string;
  emailConfirm: string;
  password: string;
  passwordConfirm: string;
  phone_cc: string;         // ej. "+34"
  phone: string;            // solo dígitos
  first_name: string;
  second_name: string;      // NUEVO
  last_name: string;
  second_last_name: string; // NUEVO
};

export default function RegisterForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: { phone_cc: '+34' },
  });

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (v: FormValues) => {
    setLoading(true);
    setMessage(null);

    if (v.emailConfirm !== v.email) { setMessage('Los emails no coinciden'); setLoading(false); return; }
    if (v.passwordConfirm !== v.password) { setMessage('Las contraseñas no coinciden'); setLoading(false); return; }
    if (v.password.length < 6) { setMessage('La contraseña debe tener al menos 6 caracteres'); setLoading(false); return; }

    const digits = v.phone.replace(/\D/g, '');
    const e164 = `${v.phone_cc}${digits}`;
    if (!/^\+[1-9]\d{6,14}$/.test(e164)) {
      setMessage('Teléfono inválido. Formato internacional (E.164), p.ej. +34612345678');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: v.email.trim(),
        password: v.password,
        options: {
          data: {
            // Teléfono y país
            phone: e164,
            phone_prefix: v.phone_cc,
            country_code: v.phone_cc,

            // Nombres y apellidos
            first_name: v.first_name.trim(),
            second_name: (v.second_name || '').trim(),
            last_name: v.last_name.trim(),
            second_last_name: (v.second_last_name || '').trim(),

            // Rol por defecto
            role_code: 'usuario',
          },
          // emailRedirectTo: `${location.origin}/auth/callback`, // opcional
        },
      });

      if (error) throw error;

      if (data.user) setDone(true);
    } catch (err: any) {
      setMessage(err?.message || 'Error al registrarte');
      setLoading(false);
    }
  };

  if (done) {
    return (
      <p className="text-slate-800">
        Se ha enviado un correo para validar tu cuenta. Revisa tu bandeja de entrada (y spam).
      </p>
    );
  }

  const inputClass =
    "h-11 w-full rounded-md border border-gray-200 bg-slate-50 text-slate-900 px-3 placeholder:text-slate-400 " +
    "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4" autoComplete="on">
      {/* Email */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-700">Email</label>
        <input
          type="email"
          autoComplete="email"
          className={inputClass}
          disabled={loading}
          {...register('email', {
            required: 'Email requerido',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' }
          })}
        />
        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
      </div>

      {/* Confirmar Email */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-700">Confirmar email</label>
        <input
          type="email"
          autoComplete="email"
          className={inputClass}
          disabled={loading}
          {...register('emailConfirm', { required: 'Confirma tu email' })}
        />
        {errors.emailConfirm && <p className="text-sm text-red-500">{errors.emailConfirm.message}</p>}
      </div>

      {/* Contraseña */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-700">Contraseña</label>
        <input
          type="password"
          autoComplete="new-password"
          className={inputClass}
          disabled={loading}
          {...register('password', { required: 'Contraseña requerida', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })}
        />
        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
      </div>

      {/* Confirmar Contraseña */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-700">Confirmar contraseña</label>
        <input
          type="password"
          autoComplete="new-password"
          className={inputClass}
          disabled={loading}
          {...register('passwordConfirm', { required: 'Confirma tu contraseña' })}
        />
        {errors.passwordConfirm && <p className="text-sm text-red-500">{errors.passwordConfirm.message}</p>}
      </div>

      {/* Teléfono */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Código país</label>
          <select className={inputClass} disabled={loading} {...register('phone_cc')}>
            {dialCodes.map((c) => (
              <option key={c.code} value={c.dial}>{c.dial}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Teléfono</label>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={inputClass}
            disabled={loading}
            {...register('phone', {
              required: 'Teléfono requerido',
              pattern: { value: /^\d{6,15}$/, message: 'Solo dígitos (6-15)' }
            })}
          />
          {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
        </div>
      </div>

      {/* Nombres */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Primer nombre</label>
          <input
            type="text"
            autoComplete="given-name"
            className={inputClass}
            disabled={loading}
            {...register('first_name', { required: 'Nombre requerido' })}
          />
          {errors.first_name && <p className="text-sm text-red-500">{errors.first_name.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Segundo nombre</label>
          <input
            type="text"
            className={inputClass}
            disabled={loading}
            {...register('second_name')}
          />
        </div>
      </div>

      {/* Apellidos */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Primer apellido</label>
          <input
            type="text"
            autoComplete="family-name"
            className={inputClass}
            disabled={loading}
            {...register('last_name', { required: 'Apellido requerido' })}
          />
          {errors.last_name && <p className="text-sm text-red-500">{errors.last_name.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-700">Segundo apellido</label>
          <input
            type="text"
            className={inputClass}
            disabled={loading}
            {...register('second_last_name')}
          />
        </div>
      </div>

      {message && <p className="text-sm text-red-500">{message}</p>}

      <button type="submit" disabled={loading} className="h-11 rounded-md bg-blue-600 px-4 text-white disabled:opacity-50">
        {loading ? 'Registrando...' : 'Registrarse'}
      </button>
    </form>
  );
}

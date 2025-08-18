'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabaseClient';
import { countries } from './countries';

interface FormValues {
  email: string; emailConfirm: string;
  password: string; passwordConfirm: string;
  phone: string;
  first_name: string; second_name?: string;
  last_name1: string; last_name2: string;
  country_code: string;
}

export default function RegisterForm() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (v: FormValues) => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signUp({
      email: v.email,
      password: v.password,
      options: {
        data: {
          role: 'usuario',
          phone: v.phone,
          first_name: v.first_name,
          second_name: v.second_name,
          last_name1: v.last_name1,
          last_name2: v.last_name2,
          country_code: v.country_code,
        },
      },
    });
    setLoading(false);
    if (error) setMessage(error.message);
    else setDone(true);
  };

  if (done) return <p className="text-slate-800">Revisa tu correo para validar tu cuenta.</p>;

  const cls = "h-11 w-full rounded-md border border-gray-200 bg-slate-50 text-slate-900 px-3 " +
              "placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Email / Confirmación */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-700">Email</label>
        <input type="email" disabled={loading} className={cls}
               {...register('email', { required: 'Email requerido' })} />
        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-700">Confirmar email</label>
        <input type="email" disabled={loading} className={cls}
               {...register('emailConfirm', {
                 validate: (v) => v === watch('email') || 'Los emails no coinciden',
               })} />
        {errors.emailConfirm && <p className="text-sm text-red-500">{errors.emailConfirm.message}</p>}
      </div>

      {/* Password / Confirmación */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-700">Contraseña</label>
        <input type="password" disabled={loading} className={cls}
               {...register('password', {
                 required: 'Contraseña requerida',
                 pattern: {
                   value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/,
                   message: 'Contraseña débil',
                 },
               })} />
        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-700">Confirmar contraseña</label>
        <input type="password" disabled={loading} className={cls}
               {...register('passwordConfirm', {
                 validate: (v) => v === watch('password') || 'Las contraseñas no coinciden',
               })} />
        {errors.passwordConfirm && <p className="text-sm text-red-500">{errors.passwordConfirm.message}</p>}
      </div>

      {/* Teléfono / País */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-700">Teléfono</label>
        <input type="tel" disabled={loading} className={cls}
               {...register('phone', {
                 required: 'Teléfono requerido',
                 pattern: { value: /^\+\d{7,15}$/, message: 'Formato E.164 requerido' },
               })} />
        {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-700">País</label>
        <select disabled={loading} className={cls}
                {...register('country_code', { required: 'País requerido' })}>
          <option value="">Selecciona tu país</option>
          {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
        {errors.country_code && <p className="text-sm text-red-500">{errors.country_code.message}</p>}
      </div>

      {/* Nombres */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-700">Nombre</label>
        <input type="text" disabled={loading} className={cls}
               {...register('first_name', { required: 'Nombre requerido' })} />
        {errors.first_name && <p className="text-sm text-red-500">{errors.first_name.message}</p>}
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-700">Segundo nombre (opcional)</label>
        <input type="text" disabled={loading} className={cls} {...register('second_name')} />
      </div>

      {/* Apellidos */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-700">Apellido paterno</label>
        <input type="text" disabled={loading} className={cls}
               {...register('last_name1', { required: 'Apellido requerido' })} />
        {errors.last_name1 && <p className="text-sm text-red-500">{errors.last_name1.message}</p>}
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-700">Apellido materno</label>
        <input type="text" disabled={loading} className={cls}
               {...register('last_name2', { required: 'Segundo apellido requerido' })} />
        {errors.last_name2 && <p className="text-sm text-red-500">{errors.last_name2.message}</p>}
      </div>

      {message && <p className="md:col-span-2 text-sm text-red-500">{message}</p>}

      <button
        type="submit"
        disabled={loading}
        className="md:col-span-2 h-11 rounded-md bg-blue-600 px-4 text-white disabled:opacity-50"
      >
        {loading
          ? <span className="mx-auto block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          : 'Registrarse'}
      </button>
    </form>
  );
}

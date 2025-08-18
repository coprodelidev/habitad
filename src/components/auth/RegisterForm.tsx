'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabaseClient';
import { countries } from './countries';

interface FormValues {
  email: string;
  emailConfirm: string;
  password: string;
  passwordConfirm: string;
  phone: string;
  first_name: string;
  second_name?: string;
  last_name1: string;
  last_name2: string;
  country_code: string;
}

export default function RegisterForm() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          role: 'usuario',
          phone: values.phone,
          first_name: values.first_name,
          second_name: values.second_name,
          last_name1: values.last_name1,
          last_name2: values.last_name2,
          country_code: values.country_code,
        },
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setDone(true);
    }
    setLoading(false);
  };

  if (done) {
    return <p>Revisa tu correo para validar tu cuenta.</p>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <input
          type="email"
          placeholder="Email"
          disabled={loading}
          className="w-full rounded border p-2"
          {...register('email', { required: 'Email requerido' })}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>
      <div>
        <input
          type="email"
          placeholder="Confirmar email"
          disabled={loading}
          className="w-full rounded border p-2"
          {...register('emailConfirm', {
            validate: (v) => v === watch('email') || 'Los emails no coinciden',
          })}
        />
        {errors.emailConfirm && (
          <p className="text-sm text-red-500">{errors.emailConfirm.message}</p>
        )}
      </div>
      <div>
        <input
          type="password"
          placeholder="Contraseña"
          disabled={loading}
          className="w-full rounded border p-2"
          {...register('password', {
            required: 'Contraseña requerida',
            pattern: {
              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/,
              message: 'Contraseña débil',
            },
          })}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>
      <div>
        <input
          type="password"
          placeholder="Confirmar contraseña"
          disabled={loading}
          className="w-full rounded border p-2"
          {...register('passwordConfirm', {
            validate: (v) => v === watch('password') || 'Las contraseñas no coinciden',
          })}
        />
        {errors.passwordConfirm && (
          <p className="text-sm text-red-500">{errors.passwordConfirm.message}</p>
        )}
      </div>
      <div>
        <input
          type="tel"
          placeholder="Teléfono"
          disabled={loading}
          className="w-full rounded border p-2"
          {...register('phone', {
            required: 'Teléfono requerido',
            pattern: {
              value: /^\+\d{7,15}$/,
              message: 'Formato E.164 requerido',
            },
          })}
        />
        {errors.phone && (
          <p className="text-sm text-red-500">{errors.phone.message}</p>
        )}
      </div>
      <div>
        <input
          type="text"
          placeholder="Nombre"
          disabled={loading}
          className="w-full rounded border p-2"
          {...register('first_name', { required: 'Nombre requerido' })}
        />
        {errors.first_name && (
          <p className="text-sm text-red-500">{errors.first_name.message}</p>
        )}
      </div>
      <div>
        <input
          type="text"
          placeholder="Segundo nombre (opcional)"
          disabled={loading}
          className="w-full rounded border p-2"
          {...register('second_name')}
        />
      </div>
      <div>
        <input
          type="text"
          placeholder="Apellido paterno"
          disabled={loading}
          className="w-full rounded border p-2"
          {...register('last_name1', { required: 'Apellido requerido' })}
        />
        {errors.last_name1 && (
          <p className="text-sm text-red-500">{errors.last_name1.message}</p>
        )}
      </div>
      <div>
        <input
          type="text"
          placeholder="Apellido materno"
          disabled={loading}
          className="w-full rounded border p-2"
          {...register('last_name2', { required: 'Segundo apellido requerido' })}
        />
        {errors.last_name2 && (
          <p className="text-sm text-red-500">{errors.last_name2.message}</p>
        )}
      </div>
      <div>
        <select
          disabled={loading}
          className="w-full rounded border p-2"
          {...register('country_code', { required: 'País requerido' })}
        >
          <option value="">Selecciona tu país</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.country_code && (
          <p className="text-sm text-red-500">{errors.country_code.message}</p>
        )}
      </div>
      {message && <p className="text-sm text-red-500">{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? (
          <span className="mx-auto block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
        ) : (
          'Registrarse'
        )}
      </button>
    </form>
  );
}

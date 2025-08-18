'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { syncProfile } from './syncProfile';

interface Props {
  onAuthenticated?: (userId: string) => void;
}

interface FormValues {
  email: string;
  password: string;
}

export default function LoginForm({ onAuthenticated }: Props) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (values: FormValues) => {
    setMessage(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setMessage('Debes confirmar tu email antes de continuar.');
      } else {
        setMessage(error.message);
      }
    } else if (data.user) {
      await syncProfile(supabase, data.user);
      onAuthenticated?.(data.user.id);
      router.push('/dashboard');
    }
    setLoading(false);
  };

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
          type="password"
          placeholder="Contraseña"
          disabled={loading}
          className="w-full rounded border p-2"
          {...register('password', { required: 'Contraseña requerida' })}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
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
          'Iniciar sesión'
        )}
      </button>
    </form>
  );
}

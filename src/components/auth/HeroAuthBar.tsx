'use client';

import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

type Tab = 'login' | 'register' | null;

type Props = {
  className?: string;
  onAuthenticated?: (userId: string) => void;
};

export default function HeroAuthBar({ className = '', onAuthenticated }: Props) {
  const [tab, setTab] = useState<Tab>(null);
  const toggle = (t: Exclude<Tab, null>) => setTab(prev => (prev === t ? null : t));

  return (
    <div className={`w-full ${className}`}>
      {/* Píldora alineada a la derecha */}
      <div className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/95 p-1.5
                      shadow-[0_8px_20px_rgba(0,0,0,.1)] ring-1 ring-black/5
                      backdrop-blur supports-[backdrop-filter]:bg-white/85">
        {/* Registrarse a la izquierda */}
        <button
          type="button"
          onClick={() => toggle('register')}
          aria-pressed={tab === 'register'}
          className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-extrabold
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b1324]/40
                      ${tab === 'register' ? 'bg-black/5 text-[#0b1324]' : 'text-[#0b1324] hover:bg-black/5'}`}
        >
          Registrarse
        </button>
        {/* Iniciar sesión siempre a la derecha */}
        <button
          type="button"
          onClick={() => toggle('login')}
          aria-pressed={tab === 'login'}
          className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-extrabold
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b1324]/40
                      ${tab === 'login' ? 'bg-black/5 text-[#0b1324]' : 'text-[#0b1324] hover:bg-black/5'}`}
        >
          Iniciar sesión
        </button>
      </div>

      {/* Panel reducido 30% y alineado a la derecha */}
      {tab && (
        <div
          className="mt-3 ml-auto w-[min(92vw,392px)] rounded-2xl bg-white shadow-xl
                     ring-1 ring-black/10 max-h-[64vh] overflow-y-auto px-5 py-4"
        >
          {tab === 'login'
            ? <LoginForm onAuthenticated={onAuthenticated} />
            : <RegisterForm />}
        </div>
      )}
    </div>
  );
}

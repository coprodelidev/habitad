'use client';

import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

type Props = {
  className?: string;
  onAuthenticated?: (userId: string) => void;
};

export default function HeroAuthBar({ className = '', onAuthenticated }: Props) {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  return (
    <div className={`w-full ${className}`}>
      {/* Card alineada a la derecha, más compacta */}
      <div className="ml-auto w-[min(92vw,560px)] rounded-2xl bg-white shadow-xl ring-1 ring-black/10">
        {/* Tabs con subrayado */}
        <div className="flex gap-8 px-5 pt-4 border-b">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`pb-3 -mb-px text-sm font-semibold
                        ${tab === 'login'
                          ? 'border-b-2 border-blue-600 text-slate-900'
                          : 'border-b-2 border-transparent text-slate-500 hover:text-slate-700'}`}
            aria-pressed={tab === 'login'}
            aria-controls="auth-panel"
          >
            Iniciar sesión
          </button>

          <button
            type="button"
            onClick={() => setTab('register')}
            className={`pb-3 -mb-px text-sm font-semibold
                        ${tab === 'register'
                          ? 'border-b-2 border-blue-600 text-slate-900'
                          : 'border-b-2 border-transparent text-slate-500 hover:text-slate-700'}`}
            aria-pressed={tab === 'register'}
            aria-controls="auth-panel"
          >
            Registrarse
          </button>
        </div>

        {/* Contenido con scroll interno y padding */}
        <div
          id="auth-panel"
          className="max-h-[64vh] overflow-y-auto px-5 py-4"
        >
          {tab === 'login'
            ? <LoginForm onAuthenticated={onAuthenticated} />
            : <RegisterForm />}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface Props {
  onAuthenticated?: (userId: string) => void;
}

export default function HeroAuthBar({ onAuthenticated }: Props) {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  return (
    <div>
      <div className="inline-flex rounded-full bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setTab('login')}
          className={`px-6 py-3 rounded-full text-sm ${tab === 'login' ? 'bg-white font-bold shadow' : 'text-gray-500'}`}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => setTab('register')}
          className={`px-6 py-3 rounded-full text-sm ${tab === 'register' ? 'bg-white font-bold shadow' : 'text-gray-500'}`}
        >
          Registrarse
        </button>
      </div>
      <div className="mt-6">
        {tab === 'login' ? (
          <LoginForm onAuthenticated={onAuthenticated} />
        ) : (
          <RegisterForm />
        )}
      </div>
    </div>
  );
}

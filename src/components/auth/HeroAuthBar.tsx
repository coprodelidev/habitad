'use client';

import Link from 'next/link';

type Props = {
  className?: string; // para posicionarlo (absolute, margins, etc.)
};

export default function HeroAuthBar({ className = '' }: Props) {
  return (
    <nav
      aria-label="Acceso"
      className={
        `inline-flex items-center gap-1 rounded-full bg-white/95 p-1.5
         shadow-[0_8px_20px_rgba(0,0,0,.1)] ring-1 ring-black/5
         backdrop-blur supports-[backdrop-filter]:bg-white/85 ${className}`
      }
    >
      <Link
        href="/login"
        className="inline-flex items-center rounded-full px-4 py-2 text-sm font-extrabold
                   text-[#0b1324] hover:bg-black/5 focus-visible:outline-none
                   focus-visible:ring-2 focus-visible:ring-[#0b1324]/40"
      >
        Iniciar sesión
      </Link>

      <Link
        href="/register"
        className="inline-flex items-center rounded-full px-4 py-2 text-sm font-extrabold
                   text-[#0b1324] hover:bg-black/5 focus-visible:outline-none
                   focus-visible:ring-2 focus-visible:ring-[#0b1324]/40"
      >
        Registrarse
      </Link>
    </nav>
  );
}

'use client';

import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const Nav: React.FC = () => {
  const [isUrbanizacionesOpen, setIsUrbanizacionesOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const pathname = usePathname();
  const isHome = pathname === '/';

  const basePill =
    'inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ring-offset-2 ring-offset-[#0E08C9]';
  const inactivePill = `${basePill} text-white bg-white/10 ring-1 ring-white/25 shadow-sm hover:bg-white hover:text-[#0b1324]`;
  const activePill = `${basePill} bg-white text-[#0b1324] ring-1 ring-white/70 shadow-md`;

  const subItems = [
    'Ica San Fernando Lotes y Viviendas',
  ];

  const openMenu = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setIsUrbanizacionesOpen(true);
  };

  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setIsUrbanizacionesOpen(false);
      closeTimer.current = null;
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <nav className="bg-[#0E08C9] border-b border-white/10">
      <div className="mx-auto max-w-[1200px] px-5">
        <div className="flex items-center justify-between py-4">
          {/* Menu a la izquierda */}
          <div className="flex flex-wrap gap-3 md:gap-[14px]">
            <Link
              href="/"
              className={isHome ? activePill : inactivePill}
              aria-current={isHome ? 'page' : undefined}
            >
              Inicio
            </Link>

            <div
              className="relative"
              onMouseEnter={openMenu}
              onMouseLeave={scheduleClose}
            >
              <button
                type="button"
                className={isUrbanizacionesOpen ? activePill : inactivePill}
                aria-haspopup="true"
                aria-expanded={isUrbanizacionesOpen}
                onClick={() => setIsUrbanizacionesOpen((v) => !v)}
                onKeyDown={(e) => e.key === 'Escape' && setIsUrbanizacionesOpen(false)}
              >
                Urbanizaciones
              </button>

              {isUrbanizacionesOpen && (
                <ul
                  role="menu"
                  className="absolute left-0 top-full mt-2 z-50 min-w-[260px] rounded-[12px] border border-[#eef2f6] bg-white py-2 shadow-[0_12px_30px_rgba(16,24,40,.12)]"
                  onMouseEnter={openMenu}
                  onMouseLeave={scheduleClose}
                >
                  {subItems.map((txt) => (
                    <li key={txt} className="list-none">
                      <Link
                        href="/proyectos"
                        className="block whitespace-nowrap px-4 py-2.5 font-semibold text-[#0b1324] hover:bg-[#f8fafc]"
                        role="menuitem"
                        onClick={() => setIsUrbanizacionesOpen(false)}
                      >
                        {txt}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Logo a la derecha */}
          <div className="z-20">
            <Link href="https://www.coprodeli.org" aria-label="Ir al inicio" className="block">
              <div className="rounded-3xl bg-white p-4 md:p-5 shadow-lg ring-1 ring-slate-120/80">
                <Image
                  src="/images/logo.jpg"
                  alt="Habitat"
                  width={120}
                  height={80}
                  priority
                  className="block w-[120px] md:w-[80px] h-auto"
                />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { usePathname } from 'next/navigation';

const Nav: React.FC = () => {
  const [isUrbanizacionesOpen, setIsUrbanizacionesOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';

  const basePill =
    'inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ring-offset-2 ring-offset-[#0E08C9]';
  const inactivePill =
    `${basePill} text-white bg-white/10 ring-1 ring-white/25 shadow-sm hover:bg-white hover:text-[#0b1324]`;
  const activePill =
    `${basePill} bg-white text-[#0b1324] ring-1 ring-white/70 shadow-md`;

  const subItems = [
    'Ica San Fernando',
    'Ica el Huarango',
    'Casas y Lotes',
    'Pisco Condominio',
    'Ica San Bernardo',
  ];

  return (
    <nav className="bg-[#0E08C9] border-b border-white/10">
      <div className="mx-auto max-w-[1200px] px-5">
        <div className="flex items-center gap-5 py-4">

          {/* Menu */}
          <div className="flex flex-wrap gap-3 md:gap-[14px]">
            {/* Inicio activo por ruta */}
            <Link
              href="/"
              className={isHome ? activePill : inactivePill}
              aria-current={isHome ? 'page' : undefined}
            >
              Inicio
            </Link>

            {/* Urbanizaciones con submenu */}
            <div
              className="relative"
              onMouseEnter={() => setIsUrbanizacionesOpen(true)}
              onMouseLeave={() => setIsUrbanizacionesOpen(false)}
            >
              <button
                type="button"
                className={isUrbanizacionesOpen ? activePill : inactivePill}
                aria-haspopup="true"
                aria-expanded={isUrbanizacionesOpen}
                onClick={() => setIsUrbanizacionesOpen(v => !v)}
                onKeyDown={(e) => e.key === 'Escape' && setIsUrbanizacionesOpen(false)}
              >
                Urbanizaciones
              </button>

              {isUrbanizacionesOpen && (
                <ul
                  role="menu"
                  className="absolute left-0 top-[calc(100%+10px)] z-50 min-w-[260px] rounded-[12px] border border-[#eef2f6] bg-white py-2 shadow-[0_12px_30px_rgba(16,24,40,.12)]"
                >
                  {subItems.map((txt) => (
                    <li key={txt} className="list-none">
                      <Link
                        href="#"
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

            <Link href="#" className={inactivePill}>Proveedores y Contratistas</Link>
            <Link href="#" className={inactivePill}>Trabaja con nosotros</Link>
            <Link href="#" className={inactivePill}>Camposanto</Link>
            <Link href="#" className={inactivePill}>Construcción para terceros</Link>
            <Link href="#" className={inactivePill}>Preguntas frecuentes</Link>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Nav;

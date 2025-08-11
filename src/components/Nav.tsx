'use client';

import Link from 'next/link';
import React, { useState } from 'react';

const Nav: React.FC = () => {
  const [isUrbanizacionesOpen, setIsUrbanizacionesOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-[#eef2f6]">
      <div className="mx-auto max-w-[1200px] px-5">
        <div className="flex items-center gap-5 py-4">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 font-extrabold text-[22px] text-[#155e8a]">
            <span className="h-7 w-10 rounded-[6px] bg-gradient-to-br from-[#ffd54f] to-[#ffb300]" />
            Habitat
          </Link>

          {/* Menu */}
          <div className="flex gap-[22px] font-semibold text-[#1f2937]">
            <Link href="#" className="hover:text-[#155e8a]">Inicio</Link>

            {/* Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setIsUrbanizacionesOpen(true)}
              onMouseLeave={() => setIsUrbanizacionesOpen(false)}
            >
              <button
                type="button"
                className="bg-transparent px-0 font-semibold text-[#1f2937] hover:text-[#155e8a]"
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
                  {[
                    'Ica San Fernando',
                    'Ica El Huarango',
                    'Casas y Lotes',
                    'Pisco Condominio',
                    'Ica San Bernardo',
                    'Proceso',
                    'Preguntas Frecuentes',
                    'Inscríbete',
                  ].map((txt) => (
                    <li key={txt} className="list-none">
                      <Link
                        href="#"
                        className="block whitespace-nowrap px-4 py-2.5 font-semibold text-[#1f2937] hover:bg-[#f8fafc] hover:text-[#155e8a]"
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

            <Link href="#" className="hover:text-[#155e8a]">Proveedores y contratistas</Link>
            <Link href="#" className="hover:text-[#155e8a]">Trabaja con nosotros</Link>
            <Link href="#" className="hover:text-[#155e8a]">Camposanto</Link>
            <Link href="#" className="hover:text-[#155e8a]">Construimos para terceros</Link>
          </div>

          {/* CTA */}
          <Link
            href="#"
            className="ml-auto rounded-full bg-[#ffc107] px-5 py-3 font-extrabold text-[#0b1324] hover:brightness-95"
          >
            Contacto
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Nav;

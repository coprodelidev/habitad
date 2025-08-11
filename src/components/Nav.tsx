'use client';

import Link from 'next/link';
import React, { useState } from 'react';

const Nav: React.FC = () => {
  const [isUrbanizacionesOpen, setIsUrbanizacionesOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-5">
        <div className="flex items-center gap-5 py-4">
          <Link className="flex items-center gap-3 font-extrabold text-2xl text-[#155e8a]" href="/">
            <span className="w-10 h-7 rounded-md bg-gradient-to-br from-[#ffd54f] to-[#ffb300]" />
            Habitat
          </Link>

          <div className="flex gap-6 font-semibold text-gray-800">
            <Link href="#">Inicio</Link>

            <div
              className="relative"
              onMouseEnter={() => setIsUrbanizacionesOpen(true)}
              onMouseLeave={() => setIsUrbanizacionesOpen(false)}
            >
              <button
                className="bg-transparent border-0 font-inherit text-gray-800 font-semibold cursor-pointer p-0"
                type="button"
                aria-haspopup="true"
                aria-expanded={isUrbanizacionesOpen}
                onClick={() => setIsUrbanizacionesOpen(v => !v)}
              >
                Urbanizaciones
              </button>

              {isUrbanizacionesOpen && (
                <ul className="absolute top-full left-0 mt-2.5 min-w-[260px] bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50" role="menu">
                  <li><Link className="block px-4 py-2.5 text-gray-800 font-semibold whitespace-nowrap hover:bg-lp-bg hover:text-[#155e8a]" href="#">Ica San Fernando</Link></li>
                  <li><Link className="block px-4 py-2.5 text-gray-800 font-semibold whitespace-nowrap hover:bg-lp-bg hover:text-[#155e8a]" href="#">Ica El Huarango</Link></li>
                  <li><Link className="block px-4 py-2.5 text-gray-800 font-semibold whitespace-nowrap hover:bg-lp-bg hover:text-[#155e8a]" href="#">Casas y Lotes</Link></li>
                  <li><Link className="block px-4 py-2.5 text-gray-800 font-semibold whitespace-nowrap hover:bg-lp-bg hover:text-[#155e8a]" href="#">Pisco Condominio</Link></li>
                  <li><Link className="block px-4 py-2.5 text-gray-800 font-semibold whitespace-nowrap hover:bg-lp-bg hover:text-[#155e8a]" href="#">Ica San Bernardo</Link></li>
                  <li><Link className="block px-4 py-2.5 text-gray-800 font-semibold whitespace-nowrap hover:bg-lp-bg hover:text-[#155e8a]" href="#">Proceso</Link></li>
                  <li><Link className="block px-4 py-2.5 text-gray-800 font-semibold whitespace-nowrap hover:bg-lp-bg hover:text-[#155e8a]" href="#">Preguntas Frecuentes</Link></li>
                  <li><Link className="block px-4 py-2.5 text-gray-800 font-semibold whitespace-nowrap hover:bg-lp-bg hover:text-[#155e8a]" href="#">Inscríbete</Link></li>
                </ul>
              )}
            </div>

            <Link href="#">Proveedores y contratistas</Link>
            <Link href="#">Trabaja con nosotros</Link>
            <Link href="#">Camposanto</Link>
            <Link href="#">Construimos para terceros</Link>
          </div>

          <Link className="ml-auto bg-lp-yellow px-5 py-3 rounded-full font-extrabold" href="#">
            Contacto
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Nav;

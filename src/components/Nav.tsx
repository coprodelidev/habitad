'use client';

import Link from 'next/link';
import React, { useState } from 'react';

const Nav: React.FC = () => {
  const [isUrbanizacionesOpen, setIsUrbanizacionesOpen] = useState(false);

  const toggleMenu = () => {
    console.log('toggle urbanizaciones', !isUrbanizacionesOpen);
    setIsUrbanizacionesOpen(v => !v);
  };

  return (
    <nav className="bg-white border-b border-[#eef2f6]">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="flex items-center gap-5 py-4">
          <Link className="flex items-center gap-3 font-extrabold text-[22px] text-[#155e8a]" href="/">
            <span className="w-10 h-7 rounded bg-gradient-to-br from-[#ffd54f] to-[#ffb300]" />
            Habitat
          </Link>

          <div className="flex gap-6 font-semibold text-[#1f2937]">
            <Link href="#">Inicio</Link>

            <div
              className="relative"
              onMouseEnter={() => {
                console.log('hover urbanizaciones', true);
                setIsUrbanizacionesOpen(true);
              }}
              onMouseLeave={() => {
                console.log('hover urbanizaciones', false);
                setIsUrbanizacionesOpen(false);
              }}
            >
              <button
                className="font-semibold" type="button"
                aria-haspopup="true"
                aria-expanded={isUrbanizacionesOpen}
                onClick={toggleMenu}
              >
                Urbanizaciones
              </button>
              {isUrbanizacionesOpen && (
                <ul className="absolute left-0 top-full mt-2 min-w-[260px] bg-white border border-[#eef2f6] rounded-xl shadow-[0_12px_30px_rgba(16,24,40,0.12)] p-2 z-50">
                  <li className="list-none"><Link className="block px-4 py-2 font-semibold hover:bg-[#f8fafc] hover:text-[#155e8a]" href="#">Ica San Fernando</Link></li>
                  <li className="list-none"><Link className="block px-4 py-2 font-semibold hover:bg-[#f8fafc] hover:text-[#155e8a]" href="#">Ica El Huarango</Link></li>
                  <li className="list-none"><Link className="block px-4 py-2 font-semibold hover:bg-[#f8fafc] hover:text-[#155e8a]" href="#">Casas y Lotes</Link></li>
                  <li className="list-none"><Link className="block px-4 py-2 font-semibold hover:bg-[#f8fafc] hover:text-[#155e8a]" href="#">Pisco Condominio</Link></li>
                  <li className="list-none"><Link className="block px-4 py-2 font-semibold hover:bg-[#f8fafc] hover:text-[#155e8a]" href="#">Ica San Bernardo</Link></li>
                  <li className="list-none"><Link className="block px-4 py-2 font-semibold hover:bg-[#f8fafc] hover:text-[#155e8a]" href="#">Proceso</Link></li>
                  <li className="list-none"><Link className="block px-4 py-2 font-semibold hover:bg-[#f8fafc] hover:text-[#155e8a]" href="#">Preguntas Frecuentes</Link></li>
                  <li className="list-none"><Link className="block px-4 py-2 font-semibold hover:bg-[#f8fafc] hover:text-[#155e8a]" href="#">Inscríbete</Link></li>
                </ul>
              )}
            </div>

            <Link href="#">Proveedores y contratistas</Link>
            <Link href="#">Trabaja con nosotros</Link>
            <Link href="#">Camposanto</Link>
            <Link href="#">Construimos para terceros</Link>
          </div>

          <Link className="ml-auto bg-[#ffc107] py-3 px-5 rounded-full font-extrabold" href="#">
            Contacto
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Nav;

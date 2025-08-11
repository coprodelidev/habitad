'use client';

import Link from 'next/link';
import React, { useState } from 'react';

const Nav: React.FC = () => {
  const [isUrbanizacionesOpen, setIsUrbanizacionesOpen] = useState(false);

  return (
    <nav className="nav">
      <div className="container">
        <div className="row">
          <Link className="brand" href="/">
            <span className="mark" />
            Habitat
          </Link>

          <div className="menu">
            <Link href="#">Inicio</Link>

            <div
              className="dropdown"
              onMouseEnter={() => setIsUrbanizacionesOpen(true)}
              onMouseLeave={() => setIsUrbanizacionesOpen(false)}
            >
              <button
                className="dropdown-toggle"
                type="button"
                aria-haspopup="true"
                aria-expanded={isUrbanizacionesOpen}
                onClick={() => setIsUrbanizacionesOpen(v => !v)}
              >
                Urbanizaciones
              </button>

              {isUrbanizacionesOpen && (
                <ul className="dropdown-menu" role="menu">
                  <li><Link href="#">Ica San Fernando</Link></li>
                  <li><Link href="#">Ica El Huarango</Link></li>
                  <li><Link href="#">Casas y Lotes</Link></li>
                  <li><Link href="#">Pisco Condominio</Link></li>
                  <li><Link href="#">Ica San Bernardo</Link></li>
                  <li><Link href="#">Proceso</Link></li>
                  <li><Link href="#">Preguntas Frecuentes</Link></li>
                  <li><Link href="#">Inscríbete</Link></li>
                </ul>
              )}
            </div>

            <Link href="#">Proveedores y contratistas</Link>
            <Link href="#">Trabaja con nosotros</Link>
            <Link href="#">Camposanto</Link>
            <Link href="#">Construimos para terceros</Link>
          </div>

          <Link className="cta" href="#">
            Contacto
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Nav;

'use client';

import Link from 'next/link';
import React from 'react';
import { useState } from 'react';

const Nav: React.FC = () => {
  const [isUrbanizacionesOpen, setIsUrbanizacionesOpen] = useState(false);

  return (
    <nav className="nav">
      <div className="container">
        <div className="row">
          <Link className="brand" href="/">
            <span className="mark"></span>
            Habitat
          </Link>
          <div className="menu">
            <Link href="#">Inicio</Link>
            <div
              className="dropdown"
              onMouseEnter={() => setIsUrbanizacionesOpen(true)}
              onMouseLeave={() => setIsUrbanizacionesOpen(false)}
            >
              <span className="dropdown-toggle">Urbanizaciones</span>
              {isUrbanizacionesOpen && (
                <ul className="dropdown-menu">
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
            <Link href="#">Construimos para terceros</Link> {/* This should likely be part of the dropdown too, but following your explicit instruction. */}
          </div>
          <Link className="cta" href="#">
            Tempor Incididunt
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
import Link from 'next/link';
import React from 'react';

const Nav: React.FC = () => {
  return (
    <nav className="nav">
      <div className="container">
        <div className="row">
          <Link className="brand" href="/">
            <span className="mark"></span>
            Los Portales
          </Link>
          <div className="menu">
            <Link href="#">Proyectos</Link>
            <Link href="#">Condominios</Link>
            <Link href="#">Lotes</Link>
            <Link href="#">Casas</Link>
            <Link href="#">Reﬁere y gana</Link>
          </div>
          <Link className="cta" href="#">
            Contáctanos
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
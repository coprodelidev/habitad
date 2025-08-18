// src/app/dashboard/components/menu/menu.tsx
import Link from 'next/link';
import React from 'react';

const Menu: React.FC = () => {
  return (
    <nav className="p-4">
      <ul className="space-y-2">
        <li><Link href="/dashboard" className="hover:underline">Inicio</Link></li>
        <li><Link href="/dashboard/components/catalogo" className="hover:underline">Catálogo</Link></li>
        <li><Link href="/dashboard/components/stock" className="hover:underline">Stock</Link></li> {/* 👈 nuevo */}
      </ul>
    </nav>
  );
};
export default Menu;

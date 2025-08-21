'use client';

import React, { useState } from 'react';
import Menu from './components/menu/menu';
import { Menu as MenuIcon } from 'lucide-react';
import { UserProvider } from '@/contexts/UserContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  const toggleMenu = () => setIsMenuOpen((open) => !open);

  return (
    <UserProvider>
      <div className="flex min-h-screen">
        {/* Contenedor del menú con posición relativa para el botón absoluto */}
        <div className="relative ">
          {isMenuOpen && (
            <aside className="pt-20 fixed inset-y-0 left-0 w-64 bg-[rgb(14,8,201)] h-full">
              <Menu />
            </aside>
          )}
          
          {/* Botón de menú flotante sobre el menú */}
          <button
            onClick={toggleMenu}
            className={`fixed top-4 left-4 z-50 p-2 rounded-md transition-colors ${isMenuOpen ? 'bg-white text-blue-700' : 'bg-blue-700 text-white border border-gray-300'}`}
            aria-label="Toggle menu"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
        </div>
        
        <main className={`flex-1 p-4 transition-all duration-300 ${isMenuOpen ? 'md:ml-64' : 'ml-0'} bg-gray-50 min-h-screen`}>
          <div className="mt-16"> {/* Espacio para el botón flotante */}
            {children}
          </div>
        </main>
      </div>
    </UserProvider>
  );
};

export default DashboardLayout;
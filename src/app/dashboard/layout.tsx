"use client";

import React, { useState } from 'react';
import Menu from './components/menu';
import { Menu as MenuIcon } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  const toggleMenu = () => setIsMenuOpen((open) => !open);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="p-4 border-b">
        <button onClick={toggleMenu} className="p-2" aria-label="Toggle menu">
          <MenuIcon className="h-6 w-6" />
        </button>
      </header>
      <div className="flex flex-1 flex-col md:flex-row">
        {isMenuOpen && (
          <aside className="w-full md:w-[15%] bg-gray-100">
            <Menu />
          </aside>
        )}
        <main className={`flex-1 p-4 ${isMenuOpen ? 'md:w-[85%]' : 'w-full'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

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
      <div className="flex min-h-screen flex-col">
        <header className="p-4 border-b bg-[rgb(14,8,201)] text-white">
          <button onClick={toggleMenu} className="p-2" aria-label="Toggle menu">
            <MenuIcon className="h-6 w-6" />
          </button>
        </header>
        <div className="flex flex-1 flex-col md:flex-row">
          {isMenuOpen && (
            <aside className="w-full md:w-[15%] bg-[rgb(14,8,201)]">
              <Menu />
            </aside>
          )}
          <main className={`flex-1 p-4 ${isMenuOpen ? 'md:w-[85%]' : 'w-full'} bg-gray-50`}>
            {children}
          </main>
        </div>
      </div>
    </UserProvider>
  );
};

export default DashboardLayout;
import React from 'react';
import Menu from './components/menu';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="w-full md:w-[15%] bg-gray-100">
        <Menu />
      </aside>
      <main className="w-full md:w-[85%] p-4">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;

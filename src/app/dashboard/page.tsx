

import React from 'react';
import StatsOverview from './components/inicio/stats/StatsOverview';
import RecentReservasTable from './components/inicio/reservas/RecentReservasTable';

const DashboardPage: React.FC = () => {
  return (
    <div>
   {/* === Nuevo bloque de métricas en vivo === */}
   <StatsOverview />
   <RecentReservasTable />
    </div>
  );
};

export default DashboardPage;

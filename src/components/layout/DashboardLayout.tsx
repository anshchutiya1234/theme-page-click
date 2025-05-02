
import React from 'react';
import { Outlet } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import MobileNav from './MobileNav';
import { useIsMobile } from '@/hooks/use-mobile';

const DashboardLayout = () => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <main className={`px-3 py-4 ${isMobile ? 'pb-24' : 'py-6 pb-20 px-4'} lg:py-10 lg:pb-10 lg:px-8 max-w-7xl mx-auto`}>
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
};

export default DashboardLayout;


import React from 'react';
import { Outlet } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import MobileNav from './MobileNav';
import { useIsMobile } from '@/hooks/use-mobile';

const DashboardLayout = () => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-partner-lightGray">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <main className={`${isMobile ? 'px-3 py-3 pb-24' : 'py-6 pb-20 px-6'} lg:py-8 lg:pb-8 lg:px-8 max-w-7xl mx-auto`}>
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
};

export default DashboardLayout;

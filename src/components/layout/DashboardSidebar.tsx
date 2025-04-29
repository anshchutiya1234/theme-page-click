
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ChartBarIcon, 
  Cog6ToothIcon, 
  CurrencyDollarIcon, 
  UserGroupIcon 
} from '@heroicons/react/24/outline';

const DashboardSidebar = () => {
  const location = useLocation();
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
    { name: 'Sub-Partners', href: '/sub-partners', icon: UserGroupIcon },
    { name: 'Withdrawals', href: '/withdrawals', icon: CurrencyDollarIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-white lg:flex">
      <div className="border-b p-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold">ClickFlow</span>
          <span className="text-sm font-medium">Partner Pulse</span>
        </Link>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="border-t p-4">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-full bg-gray-200" />
          <div className="flex-1 truncate">
            <p className="text-sm font-medium">Partner</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;


import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChartBarIcon, Cog6ToothIcon, CurrencyDollarIcon, UserGroupIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import UnreadMessagesIndicator from '../messages/UnreadMessagesIndicator';

const DashboardSidebar = () => {
  const location = useLocation();
  const {
    profile,
    signOut
  } = useAuth();
  
  const baseNavigation = [{
    name: 'Dashboard',
    href: '/dashboard',
    icon: ChartBarIcon
  }, {
    name: 'Sub-Partners',
    href: '/sub-partners',
    icon: UserGroupIcon
  }, {
    name: 'Withdrawals',
    href: '/withdrawals',
    icon: CurrencyDollarIcon
  }, {
    name: 'Messages',
    href: '/messages',
    icon: MessageSquare,
    indicator: true
  }, {
    name: 'Settings',
    href: '/settings',
    icon: Cog6ToothIcon
  }];

  // Add admin route if user is admin
  const navigation = profile?.is_admin ? [...baseNavigation, {
    name: 'Admin',
    href: '/admin',
    icon: ShieldCheckIcon
  }] : baseNavigation;
  
  return <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-white lg:flex">
      <div className="border-b p-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold">Trading </span>
          <span className="text-sm font-bold">Circle HQ</span>
        </Link>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {navigation.map(item => {
          const isActive = location.pathname === item.href;
          return <li key={item.name}>
                <Link to={item.href} className={`nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`}>
                  {item.name === 'Messages' ? (
                    <div className="relative">
                      <MessageSquare className="h-5 w-5" />
                      {item.indicator && (
                        <div className="absolute -top-2 -right-2">
                          <UnreadMessagesIndicator className="h-4 w-4 text-[10px]" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <item.icon className="h-5 w-5" />
                  )}
                  <span>{item.name}</span>
                </Link>
              </li>;
        })}
        </ul>
      </nav>
      
      <div className="border-t p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-200" />
            <div className="flex-1 truncate">
              <p className="text-sm font-medium">{profile?.name || 'Partner'}</p>
            </div>
          </div>
          <button onClick={() => signOut()} className="text-sm text-gray-500 hover:text-gray-700">
            Logout
          </button>
        </div>
      </div>
    </aside>;
};

export default DashboardSidebar;


import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChartBarIcon,
  Cog6ToothIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import UnreadMessagesIndicator from '../messages/UnreadMessagesIndicator';

const MobileNav = () => {
  const location = useLocation();
  const { profile } = useAuth();
  
  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: ChartBarIcon },
    { name: 'Withdrawals', href: '/withdrawals', icon: CurrencyDollarIcon },
    { name: 'Messages', href: '/messages', icon: MessageSquare, indicator: true },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];
  
  // Add admin route if user is admin
  const navigation = profile?.is_admin 
    ? [...baseNavigation, { name: 'Admin', href: '/admin', icon: ShieldCheckIcon }]
    : baseNavigation;

  return (
    <div className="fixed bottom-0 left-0 z-10 w-full border-t bg-white lg:hidden">
      <div className="grid h-16" style={{ gridTemplateColumns: `repeat(${navigation.length}, minmax(0, 1fr))` }}>
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center justify-center ${
                isActive ? 'text-partner-primary' : 'text-partner-mediumGray'
              }`}
            >
              <div className="relative">
                {item.name === 'Messages' ? (
                  <MessageSquare className="h-5 w-5" />
                ) : (
                  <item.icon className="h-5 w-5" />
                )}
                {item.indicator && (
                  <div className="absolute -top-2 -right-2">
                    <UnreadMessagesIndicator className="h-4 w-4 text-[10px]" />
                  </div>
                )}
              </div>
              <span className="text-xs">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNav;


import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChartBarIcon,
  Cog6ToothIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <motion.div 
      className="fixed bottom-0 left-0 z-10 w-full border-t bg-white lg:hidden shadow-lg"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="grid h-16" style={{ gridTemplateColumns: `repeat(${navigation.length}, minmax(0, 1fr))` }}>
        {navigation.map((item, index) => {
          const isActive = location.pathname === item.href;
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link
                to={item.href}
                className={`flex flex-col items-center justify-center h-full transition-all duration-200 hover:scale-110 ${
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
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default MobileNav;

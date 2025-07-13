import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChartBarIcon, Cog6ToothIcon, CurrencyDollarIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
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
  
  return <motion.aside 
      className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-white lg:flex shadow-lg"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <motion.div 
        className="border-b p-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Link to="/dashboard" className="flex items-center gap-2 hover:scale-105 transition-transform duration-200">
          <span className="text-xl font-bold text-partner-primary">Leverage Money</span>
        </Link>
      </motion.div>
      
      <nav className="flex-1 overflow-y-auto p-4">
        <motion.ul 
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {navigation.map((item, index) => {
          const isActive = location.pathname === item.href;
          return <motion.li 
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
            >
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
              </motion.li>;
        })}
        </motion.ul>
      </nav>
      
      <motion.div 
        className="border-t p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-partner-lightGray" />
            <div className="flex-1 truncate">
              <p className="text-sm font-medium">{profile?.name || 'Partner'}</p>
            </div>
          </div>
          <button 
            onClick={() => signOut()} 
            className="text-sm text-partner-mediumGray hover:text-partner-darkGray hover:scale-105 transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </motion.div>
    </motion.aside>;
};

export default DashboardSidebar;


import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LinkIcon, ChartBarIcon, UsersIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import StatsCard from '@/components/dashboard/StatsCard';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import RecentActivity from '@/components/dashboard/RecentActivity';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface UserStats {
  direct_clicks: number;
  bonus_clicks: number;
  total_earnings: number;
  sub_partners_count: number;
}

const Dashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!profile) return;

      try {
        const { data, error } = await supabase
          .rpc('get_user_stats', { user_id: profile.id });

        if (error) throw error;
        
        if (data && data[0]) {
          setStats(data[0]);
        } else {
          // Set default values if no data returned
          setStats({
            direct_clicks: 0,
            bonus_clicks: 0,
            total_earnings: 0,
            sub_partners_count: 0
          });
        }
      } catch (error: any) {
        console.error('Error fetching stats:', error);
        toast({
          title: "Error",
          description: "Failed to load your dashboard data. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserStats();
  }, [profile, toast]);

  if (isLoading || !profile) {
    return (
      <motion.div 
        className="flex justify-center items-center h-64"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="h-12 w-12 border-4 border-partner-primary border-t-transparent rounded-full" />
      </motion.div>
    );
  }

  // Calculate total clicks (direct + bonus)
  const totalClicks = (stats?.direct_clicks || 0) + (stats?.bonus_clicks || 0);

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-partner-darkGray">Partner Dashboard</h1>
        <p className="text-partner-mediumGray mt-1">
          Welcome back, {profile.name}
        </p>
      </motion.div>
      
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <StatsCard
            title="Total Direct Points"
            value={stats?.direct_clicks.toLocaleString() || '0'}
            icon={<LinkIcon className="h-5 w-5" />}
            trend={stats?.direct_clicks ? undefined : null}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <StatsCard
            title="Bonus Points"
            value={stats?.bonus_clicks.toLocaleString() || '0'}
            icon={<ChartBarIcon className="h-5 w-5" />}
            trend={stats?.bonus_clicks ? undefined : null}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <StatsCard
            title="Total Earnings"
            value={`$${stats?.total_earnings.toFixed(2) || '0.00'}`}
            icon={<CurrencyDollarIcon className="h-5 w-5" />}
            trend={stats?.total_earnings ? undefined : null}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <StatsCard
            title="Sub-Partners"
            value={stats?.sub_partners_count || 0}
            icon={<UsersIcon className="h-5 w-5" />}
            trend={stats?.sub_partners_count ? undefined : null}
          />
        </motion.div>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <PerformanceChart userId={profile.id} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <RecentActivity />
        </motion.div>
      </div>

    </motion.div>
  );
};

export default Dashboard;

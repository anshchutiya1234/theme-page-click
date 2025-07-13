
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LinkIcon, ChartBarIcon, UsersIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import StatsCard from '@/components/dashboard/StatsCard';
import PerformanceChart from '@/components/dashboard/PerformanceChart';


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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-partner-purple border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Calculate total clicks (direct + bonus)
  const totalClicks = (stats?.direct_clicks || 0) + (stats?.bonus_clicks || 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Partner Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {profile.name}
        </p>
      </div>
      
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Direct Points"
          value={stats?.direct_clicks.toLocaleString() || '0'}
          icon={<LinkIcon className="h-5 w-5" />}
          trend={stats?.direct_clicks ? undefined : null}
        />
        <StatsCard
          title="Bonus Points"
          value={stats?.bonus_clicks.toLocaleString() || '0'}
          icon={<ChartBarIcon className="h-5 w-5" />}
          trend={stats?.bonus_clicks ? undefined : null}
        />
        <StatsCard
          title="Total Earnings"
          value={`$${stats?.total_earnings.toFixed(2) || '0.00'}`}
          icon={<CurrencyDollarIcon className="h-5 w-5" />}
          trend={stats?.total_earnings ? undefined : null}
        />
        <StatsCard
          title="Sub-Partners"
          value={stats?.sub_partners_count || 0}
          icon={<UsersIcon className="h-5 w-5" />}
          trend={stats?.sub_partners_count ? undefined : null}
        />
      </div>
      
      <PerformanceChart userId={profile.id} />
      

    </div>
  );
};

export default Dashboard;

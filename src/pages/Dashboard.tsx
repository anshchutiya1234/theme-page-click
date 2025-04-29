
import React from 'react';
import { Link } from 'react-router-dom';
import { LinkIcon, ChartBarIcon, UsersIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import StatsCard from '@/components/dashboard/StatsCard';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import PartnerCodeCard from '@/components/dashboard/PartnerCodeCard';
import SubPartnersList from '@/components/dashboard/SubPartnersList';

const mockPartnerData = {
  username: 'crypto_trader',
  partnerCode: '38429',
  stats: {
    directClicks: 8547,
    bonusClicks: 1726,
    totalEarnings: '$1,027.30',
    subPartnersCount: 5
  }
};

const Dashboard = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Partner Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, @{mockPartnerData.username}
        </p>
      </div>
      
      <PartnerCodeCard partnerCode={mockPartnerData.partnerCode} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Direct Clicks"
          value={mockPartnerData.stats.directClicks.toLocaleString()}
          icon={<LinkIcon className="h-5 w-5" />}
          trend={{ value: '+12.5%', positive: true }}
        />
        <StatsCard
          title="Bonus Clicks"
          value={mockPartnerData.stats.bonusClicks.toLocaleString()}
          icon={<ChartBarIcon className="h-5 w-5" />}
          trend={{ value: '+8.3%', positive: true }}
        />
        <StatsCard
          title="Total Earnings"
          value={mockPartnerData.stats.totalEarnings}
          icon={<CurrencyDollarIcon className="h-5 w-5" />}
          trend={{ value: '+15.2%', positive: true }}
        />
        <StatsCard
          title="Sub-Partners"
          value={mockPartnerData.stats.subPartnersCount}
          icon={<UsersIcon className="h-5 w-5" />}
          trend={{ value: '+2', positive: true }}
        />
      </div>
      
      <PerformanceChart />
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Latest Sub-Partners</h2>
          <Link to="/sub-partners" className="text-partner-purple hover:underline text-sm">
            View All
          </Link>
        </div>
        <SubPartnersList />
      </div>
    </div>
  );
};

export default Dashboard;

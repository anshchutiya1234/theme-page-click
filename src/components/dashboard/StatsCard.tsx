import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: string | number;
    positive?: boolean;
  };
  className?: string;
}

const StatsCard = ({ title, value, icon, trend, className }: StatsCardProps) => {
  return (
    <div className={cn('stat-card', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-card-title">{title}</p>
          <p className="stat-card-value">{value}</p>
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      
      {trend !== null && trend && (
        <div className="mt-2 flex items-center text-sm">
          <span className={trend.positive ? 'text-green-600' : 'text-red-600'}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
          <span className="ml-1 text-gray-500">vs last period</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;

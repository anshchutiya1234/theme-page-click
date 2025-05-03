import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface DataPoint {
  date: string;
  clicks: number;
  bonus: number;
}

interface PerformanceChartProps {
  userId: string;
  days?: number;
}

const PerformanceChart = ({ userId, days = 30 }: PerformanceChartProps) => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalClicks, setTotalClicks] = useState(0);
  const [totalBonus, setTotalBonus] = useState(0);

  useEffect(() => {
    const fetchClicksData = async () => {
      try {
        // Create an array of the last X days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const dateArray: DataPoint[] = Array.from({ length: days }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (days - 1 - i));
          return {
            date: date.toISOString().split('T')[0],
            clicks: 0,
            bonus: 0,
          };
        });

        // Get direct clicks data
        const { data: directClicksData, error: directError } = await supabase
          .from('clicks')
          .select('created_at')
          .eq('user_id', userId)
          .eq('type', 'direct')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        if (directError) throw directError;

        // Get bonus clicks data
        const { data: bonusClicksData, error: bonusError } = await supabase
          .from('clicks')
          .select('created_at')
          .eq('user_id', userId)
          .eq('type', 'bonus')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        if (bonusError) throw bonusError;

        // Process direct clicks
        if (directClicksData) {
          directClicksData.forEach(click => {
            if (!click) return;
            const date = new Date(click.created_at).toISOString().split('T')[0];
            const dataPoint = dateArray.find(d => d.date === date);
            if (dataPoint) {
              dataPoint.clicks++;
            }
          });
        }

        // Process bonus clicks
        if (bonusClicksData) {
          bonusClicksData.forEach(click => {
            if (!click) return;
            const date = new Date(click.created_at).toISOString().split('T')[0];
            const dataPoint = dateArray.find(d => d.date === date);
            if (dataPoint) {
              dataPoint.bonus++;
            }
          });
        }

        // Calculate totals
        const totalDirectClicks = directClicksData ? directClicksData.length : 0;
        const totalBonusClicks = bonusClicksData ? bonusClicksData.length : 0;

        setData(dateArray);
        setTotalClicks(totalDirectClicks);
        setTotalBonus(totalBonusClicks);
      } catch (error) {
        console.error('Error fetching performance data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClicksData();
  }, [userId, days]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Chart</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-48">
          <div className="animate-spin h-8 w-8 border-4 border-partner-purple border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    );
  }

  const renderTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border rounded-md p-2 shadow-md">
          <p className="font-semibold text-gray-800">{payload[0].payload.date}</p>
          <p className="text-gray-600">Clicks: {payload[0].value}</p>
          <p className="text-gray-600">Bonus: {payload[1] ? payload[1].value : 0}</p>
        </div>
      );
    }

    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-500 mb-4">
          <p>
            <span className="font-medium">Total Direct Clicks:</span> {totalClicks}
          </p>
          <p>
            <span className="font-medium">Total Bonus Clicks:</span> {totalBonus}
          </p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="bonusGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip content={renderTooltip} />
            <Area type="monotone" dataKey="clicks" stroke="#8884d8" fillOpacity={1} fill="url(#clickGradient)" />
            <Area type="monotone" dataKey="bonus" stroke="#82ca9d" fillOpacity={1} fill="url(#bonusGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PerformanceChart;

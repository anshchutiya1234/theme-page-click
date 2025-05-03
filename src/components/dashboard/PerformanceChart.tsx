import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface PerformanceChartProps {
  userId: string;
}

interface PerformanceData {
  date: string;
  clicks: number;
  earnings: number;
}

const PerformanceChart = ({ userId }: PerformanceChartProps) => {
  const { toast } = useToast();
  const [chartData, setChartData] = useState<PerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');
  
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setIsLoading(true);
        
        let startDate;
        const endDate = new Date();
        
        switch (dateRange) {
          case 'week':
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'month':
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          case 'year':
            startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
        }
        
        const { data, error } = await supabase
          .from('clicks')
          .select('created_at')
          .eq('user_id', userId as any)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
          
        if (error) throw error;
        
        if (!data) {
          setChartData([]);
          return;
        }
        
        // Process data to group by date
        const groupedData: Record<string, { clicks: number; earnings: number }> = {};
        
        data.forEach(click => {
          const date = new Date(click.created_at).toISOString().split('T')[0];
          
          if (!groupedData[date]) {
            groupedData[date] = {
              clicks: 0,
              earnings: 0,
            };
          }
          
          groupedData[date].clicks += 1;
          groupedData[date].earnings += 0.1; // $0.10 per click
        });
        
        // Convert to array and sort by date
        const chartDataArray = Object.keys(groupedData).map(date => ({
          date,
          clicks: groupedData[date].clicks,
          earnings: +groupedData[date].earnings.toFixed(2),
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setChartData(chartDataArray);
      } catch (error) {
        console.error('Error fetching chart data:', error);
        toast({
          title: "Error",
          description: "Failed to load performance data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChartData();
  }, [userId, dateRange, toast]);
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-lg font-semibold">Performance Overview</h2>
        <div className="flex gap-2 mt-3 sm:mt-0">
          <button
            key="week"
            className={`px-3 py-1 text-sm rounded-md ${
              dateRange === 'week'
                ? 'bg-partner-purple text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setDateRange('week')}
          >
            Week
          </button>
          <button
            key="month"
            className={`px-3 py-1 text-sm rounded-md ${
              dateRange === 'month'
                ? 'bg-partner-purple text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setDateRange('month')}
          >
            Month
          </button>
          <button
            key="year"
            className={`px-3 py-1 text-sm rounded-md ${
              dateRange === 'year'
                ? 'bg-partner-purple text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setDateRange('year')}
          >
            Year
          </button>
        </div>
      </div>
      
      <div className="h-80">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin h-8 w-8 border-4 border-partner-purple border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#666' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.375rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }} 
              />
              <Area
                type="monotone"
                dataKey="clicks"
                name="Clicks"
                stroke="#5E51E7"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="earnings"
                name="Earnings"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default PerformanceChart;

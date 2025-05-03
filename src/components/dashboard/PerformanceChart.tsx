import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface ChartData {
  name: string;
  directClicks: number;
  bonusClicks: number;
}

interface PerformanceChartProps {
  userId: string;
}

// Update the interface to make the type field more flexible
interface ClicksData {
  created_at: string;
  type: 'direct' | 'bonus' | string; // Allow string as well to be more flexible
}

const PerformanceChart = ({ userId }: PerformanceChartProps) => {
  const [selectedRange, setSelectedRange] = useState('6M');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const ranges = ['1W', '1M', '3M', '6M', '1Y', 'ALL'];

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setIsLoading(true);
        
        // Calculate date range based on selected option
        let startDate = new Date();
        switch (selectedRange) {
          case '1W':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case '1M':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
          case '3M':
            startDate.setMonth(startDate.getMonth() - 3);
            break;
          case '6M':
            startDate.setMonth(startDate.getMonth() - 6);
            break;
          case '1Y':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
          case 'ALL':
            // No filter, get all data
            startDate = new Date(0); // Jan 1, 1970
            break;
          default:
            startDate.setMonth(startDate.getMonth() - 6);
        }

        // Fetch clicks from Supabase - make sure to include both direct and bonus clicks
        const { data: clicksData, error } = await supabase
          .from('clicks')
          .select('created_at, type')
          .eq('user_id', userId)
          .gte('created_at', startDate.toISOString());

        if (error) throw error;
        
        // Process the data for chart display
        // Use type assertion to satisfy TypeScript
        const typedClicksData = clicksData as ClicksData[] || [];
        const processedData = processClicksData(typedClicksData, selectedRange);
        setChartData(processedData);
      } catch (error) {
        console.error("Error fetching chart data:", error);
        // Fallback to default data if error occurs
        setChartData(generateFallbackData());
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [userId, selectedRange]);

  const processClicksData = (clicks: ClicksData[], range: string): ChartData[] => {
    if (!clicks.length) return generateFallbackData();

    const dateFormat = getDateFormat(range);
    const dataMap: Record<string, { directClicks: number, bonusClicks: number }> = {};
    
    // Initialize dataMap with empty values
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    
    if (range === '1W') {
      // For weekly view, show last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = date.toLocaleDateString(undefined, { weekday: 'short' });
        dataMap[key] = { directClicks: 0, bonusClicks: 0 };
      }
    } else if (range === '1M') {
      // For monthly view, show last 30 days by day
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = date.getDate().toString();
        dataMap[key] = { directClicks: 0, bonusClicks: 0 };
      }
    } else {
      // For other ranges, group by month
      let monthsToShow = 6;
      if (range === '3M') monthsToShow = 3;
      if (range === '1Y') monthsToShow = 12;
      if (range === 'ALL') monthsToShow = 12; // Show max 12 months for "ALL"
      
      for (let i = monthsToShow - 1; i >= 0; i--) {
        const monthIndex = (now.getMonth() - i + 12) % 12;
        dataMap[months[monthIndex]] = { directClicks: 0, bonusClicks: 0 };
      }
    }

    // Process clicks data
    clicks.forEach(click => {
      if (!click || !click.created_at) return;
      
      const date = new Date(click.created_at);
      let key;
      
      if (range === '1W') {
        key = date.toLocaleDateString(undefined, { weekday: 'short' });
      } else if (range === '1M') {
        key = date.getDate().toString();
      } else {
        key = months[date.getMonth()];
      }
      
      if (dataMap[key]) {
        // Normalize type to either 'direct' or 'bonus' for processing
        const clickType = click.type === 'direct' ? 'direct' : 'bonus';
        
        if (clickType === 'direct') {
          dataMap[key].directClicks++;
        } else {
          dataMap[key].bonusClicks++;
        }
      }
    });

    // Convert to chart data format
    return Object.keys(dataMap).map(key => ({
      name: key,
      directClicks: dataMap[key].directClicks,
      bonusClicks: dataMap[key].bonusClicks
    }));
  };

  const getDateFormat = (range: string): Intl.DateTimeFormatOptions => {
    switch (range) {
      case '1W':
        return { weekday: 'short' };
      case '1M':
        return { day: 'numeric' };
      default:
        return { month: 'short' };
    }
  };

  const generateFallbackData = (): ChartData[] => {
    // Return zero values for all months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      name: month,
      directClicks: 0,
      bonusClicks: 0
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-lg font-semibold">Performance Overview</h2>
        <div className="flex gap-2 mt-3 sm:mt-0">
          {ranges.map((range) => (
            <button
              key={range}
              className={`px-3 py-1 text-sm rounded-md ${
                selectedRange === range
                  ? 'bg-partner-purple text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setSelectedRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-80">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin h-8 w-8 border-4 border-partner-purple border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
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
              <Legend verticalAlign="top" height={36} />
              <Line
                type="monotone"
                dataKey="directClicks"
                name="Direct Clicks"
                stroke="#5E51E7"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="bonusClicks"
                name="Bonus Clicks"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default PerformanceChart;

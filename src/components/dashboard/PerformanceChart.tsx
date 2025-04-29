
import React from 'react';
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

const data = [
  {
    name: 'Jan',
    directClicks: 650,
    bonusClicks: 150,
  },
  {
    name: 'Feb',
    directClicks: 920,
    bonusClicks: 230,
  },
  {
    name: 'Mar',
    directClicks: 1450,
    bonusClicks: 320,
  },
  {
    name: 'Apr',
    directClicks: 1200,
    bonusClicks: 400,
  },
  {
    name: 'May',
    directClicks: 1800,
    bonusClicks: 500,
  },
  {
    name: 'Jun',
    directClicks: 2500,
    bonusClicks: 580,
  },
];

interface PerformanceChartProps {
  selectedRange?: string;
  onRangeChange?: (range: string) => void;
}

const PerformanceChart = ({ selectedRange = '6M', onRangeChange }: PerformanceChartProps) => {
  const ranges = ['1W', '1M', '3M', '6M', '1Y', 'ALL'];

  const handleRangeChange = (range: string) => {
    if (onRangeChange) onRangeChange(range);
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
              onClick={() => handleRangeChange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
      </div>
    </div>
  );
};

export default PerformanceChart;

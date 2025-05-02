
import React from 'react';
import { Input } from '@/components/ui/input';

interface SubPartnerFilterProps {
  totalBonusClicksEarned: number;
  searchTerm: string;
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SubPartnerFilter = ({ 
  totalBonusClicksEarned,
  searchTerm,
  onSearch 
}: SubPartnerFilterProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-6">
      <div>
        <h2 className="text-xl font-semibold">Your Sub-Partners</h2>
        <p className="text-sm text-gray-500 mt-1">
          You've earned {totalBonusClicksEarned.toLocaleString()} bonus clicks (20% of sub-partners' clicks)
        </p>
      </div>
      
      <div className="w-full md:w-64">
        <Input
          placeholder="Search by partner code..."
          value={searchTerm}
          onChange={onSearch}
        />
      </div>
    </div>
  );
};

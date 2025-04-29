
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SubPartner {
  id: string;
  username: string;
  joinDate: string;
  totalClicks: number;
  bonusClicksEarned: number;
  status: 'active' | 'inactive';
}

const mockSubPartners: SubPartner[] = [
  { id: '1', username: 'trader_max', joinDate: '2025-03-15', totalClicks: 7825, bonusClicksEarned: 1565, status: 'active' },
  { id: '2', username: 'crypto_sarah', joinDate: '2025-03-18', totalClicks: 5210, bonusClicksEarned: 1042, status: 'active' },
  { id: '3', username: 'investorjohn', joinDate: '2025-02-25', totalClicks: 4150, bonusClicksEarned: 830, status: 'active' },
  { id: '4', username: 'market_guru', joinDate: '2025-02-10', totalClicks: 2750, bonusClicksEarned: 550, status: 'active' },
  { id: '5', username: 'finance_pro', joinDate: '2025-02-05', totalClicks: 1980, bonusClicksEarned: 396, status: 'active' },
  { id: '6', username: 'stock_master', joinDate: '2025-01-28', totalClicks: 1650, bonusClicksEarned: 330, status: 'inactive' },
  { id: '7', username: 'trading_queen', joinDate: '2025-01-20', totalClicks: 1320, bonusClicksEarned: 264, status: 'active' },
  { id: '8', username: 'day_trader', joinDate: '2025-01-15', totalClicks: 950, bonusClicksEarned: 190, status: 'inactive' },
];

const SubPartners = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPartners, setFilteredPartners] = useState(mockSubPartners);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredPartners(mockSubPartners);
    } else {
      const filtered = mockSubPartners.filter(partner => 
        partner.username.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredPartners(filtered);
    }
  };

  const totalBonusClicksEarned = filteredPartners.reduce(
    (sum, partner) => sum + partner.bonusClicksEarned, 
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Sub-Partners</h1>
        <p className="text-gray-500 mt-1">
          Manage and track your sub-partners' performance
        </p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Your Sub-Partners</h2>
            <p className="text-sm text-gray-500 mt-1">
              You've earned a total of {totalBonusClicksEarned.toLocaleString()} bonus clicks from your sub-partners
            </p>
          </div>
          
          <div className="w-full md:w-64">
            <Input
              placeholder="Search by username..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="py-3 text-left font-medium text-gray-500">Username</th>
                <th className="py-3 text-left font-medium text-gray-500">Join Date</th>
                <th className="py-3 text-right font-medium text-gray-500">Total Clicks</th>
                <th className="py-3 text-right font-medium text-gray-500">Bonus Clicks Earned</th>
                <th className="py-3 text-right font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPartners.length > 0 ? (
                filteredPartners.map((partner) => (
                  <tr key={partner.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 font-medium">@{partner.username}</td>
                    <td className="py-4 text-gray-500">
                      {new Date(partner.joinDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right">{partner.totalClicks.toLocaleString()}</td>
                    <td className="py-4 text-right">{partner.bonusClicksEarned.toLocaleString()}</td>
                    <td className="py-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        partner.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {partner.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">
                    No sub-partners found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 text-sm text-gray-500">
          <p>You earn 20% of all clicks from your sub-partners. Encourage them to share their links for maximum earnings.</p>
        </div>
      </div>
    </div>
  );
};

export default SubPartners;

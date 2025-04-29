
import React from 'react';

interface SubPartner {
  id: string;
  username: string;
  totalClicks: number;
  bonusClicksEarned: number;
}

const demoSubPartners: SubPartner[] = [
  { id: '1', username: 'trader_max', totalClicks: 7825, bonusClicksEarned: 1565 },
  { id: '2', username: 'crypto_sarah', totalClicks: 5210, bonusClicksEarned: 1042 },
  { id: '3', username: 'investorjohn', totalClicks: 4150, bonusClicksEarned: 830 },
  { id: '4', username: 'market_guru', totalClicks: 2750, bonusClicksEarned: 550 },
  { id: '5', username: 'finance_pro', totalClicks: 1980, bonusClicksEarned: 396 },
];

const SubPartnersList = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">Your Sub-Partners</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="py-3 text-left font-medium text-gray-500">Username</th>
              <th className="py-3 text-right font-medium text-gray-500">Total Clicks</th>
              <th className="py-3 text-right font-medium text-gray-500">Bonus Clicks Earned</th>
            </tr>
          </thead>
          <tbody>
            {demoSubPartners.length > 0 ? (
              demoSubPartners.map((partner) => (
                <tr key={partner.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 font-medium">@{partner.username}</td>
                  <td className="py-4 text-right">{partner.totalClicks.toLocaleString()}</td>
                  <td className="py-4 text-right">{partner.bonusClicksEarned.toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="py-4 text-center text-gray-500">
                  No sub-partners yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {demoSubPartners.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          <p>You earn 20% of all clicks from your sub-partners.</p>
        </div>
      )}
    </div>
  );
};

export default SubPartnersList;

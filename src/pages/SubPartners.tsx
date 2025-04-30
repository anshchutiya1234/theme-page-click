
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubPartner {
  id: string;
  username: string;
  joinDate: string;
  totalClicks: number;
  bonusClicksEarned: number;
  status: 'active' | 'inactive';
}

const SubPartners = () => {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [subPartners, setSubPartners] = useState<SubPartner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<SubPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchSubPartners = async () => {
      if (!profile) return;
      
      try {
        // First get list of users that have referred_by matching this partner code
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, username, joined_at')
          .eq('referred_by', profile.partner_code);

        if (usersError) throw usersError;
        
        if (!usersData || usersData.length === 0) {
          setSubPartners([]);
          setFilteredPartners([]);
          setIsLoading(false);
          return;
        }
        
        // For each sub-partner, get their clicks count and bonus clicks they generated
        const fetchedSubPartners = await Promise.all(
          usersData.map(async (user) => {
            // Get all clicks for this user
            const { data: clicksData, error: clicksError } = await supabase
              .from('clicks')
              .select('type, created_at')
              .eq('user_id', user.id);
              
            if (clicksError) throw clicksError;
            
            const totalClicks = clicksData?.filter(c => c.type === 'direct').length || 0;
            const bonusClicksEarned = clicksData?.filter(c => c.type === 'bonus').length || 0;
            
            // Determine if the sub-partner is active (had activity in the last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            // Ensure clicksData exists and each item has created_at
            const recentClicksCount = clicksData?.filter(c => {
              // Make sure c has created_at property
              if ('created_at' in c) {
                return new Date(c.created_at as string) >= thirtyDaysAgo;
              }
              return false;
            }).length || 0;
            
            return {
              id: user.id,
              username: user.username,
              joinDate: user.joined_at,
              totalClicks,
              bonusClicksEarned,
              status: (recentClicksCount > 0) ? 'active' as const : 'inactive' as const
            };
          })
        );
        
        setSubPartners(fetchedSubPartners);
        setFilteredPartners(fetchedSubPartners);
      } catch (error) {
        console.error('Error fetching sub-partners:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubPartners();
  }, [profile]);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredPartners(subPartners);
    } else {
      const filtered = subPartners.filter(partner => 
        partner.username.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredPartners(filtered);
    }
  };

  const totalBonusClicksEarned = filteredPartners.reduce(
    (sum, partner) => sum + partner.bonusClicksEarned, 
    0
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-partner-purple border-t-transparent rounded-full"></div>
      </div>
    );
  }

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

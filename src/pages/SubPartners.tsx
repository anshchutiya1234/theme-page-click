
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

interface SubPartner {
  id: string;
  username: string;
  partnerCode: string;
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
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const fetchSubPartners = async () => {
      if (!profile) return;
      
      try {
        // First get list of users that have referred_by matching this partner code
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, username, joined_at, partner_code')
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
            // Get all direct clicks for this user
            const { data: directClicksData, error: directClicksError } = await supabase
              .from('clicks')
              .select('created_at')
              .eq('user_id', user.id)
              .eq('type', 'direct');
              
            if (directClicksError) throw directClicksError;
            
            // Get bonus clicks this partner received from this sub-partner
            const { data: bonusClicksData, error: bonusClicksError } = await supabase
              .from('clicks')
              .select('created_at')
              .eq('user_id', profile.id)
              .eq('source_user_id', user.id)
              .eq('type', 'bonus');
              
            if (bonusClicksError) throw bonusClicksError;
            
            const totalClicks = directClicksData?.length || 0;
            const bonusClicksEarned = bonusClicksData?.length || 0;
            
            // Determine if the sub-partner is active (had activity in the last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            // Check for recent clicks
            const recentClicksCount = directClicksData?.filter(c => {
              return new Date(c.created_at) >= thirtyDaysAgo;
            }).length || 0;
            
            return {
              id: user.id,
              username: user.username,
              partnerCode: user.partner_code,
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
        partner.username.toLowerCase().includes(term.toLowerCase()) ||
        partner.partnerCode.toLowerCase().includes(term.toLowerCase())
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Sub-Partners</h1>
        <p className="text-gray-500 mt-1">
          Manage and track your sub-partners' performance
        </p>
      </div>
      
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Your Sub-Partners</h2>
            <p className="text-sm text-gray-500 mt-1">
              You've earned {totalBonusClicksEarned.toLocaleString()} bonus clicks
            </p>
          </div>
          
          <div className="w-full md:w-64">
            <Input
              placeholder="Search by username or code..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        
        {isMobile ? (
          <div className="space-y-4">
            {filteredPartners.length > 0 ? (
              filteredPartners.map((partner) => (
                <div key={partner.id} className="border rounded-md p-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">{partner.partnerCode}</div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      partner.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {partner.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">@{partner.username}</div>
                  <div className="flex justify-between mt-2 text-sm">
                    <div>Bonus clicks: <span className="font-medium">{partner.bonusClicksEarned}</span></div>
                    <div>Total clicks: <span className="font-medium">{partner.totalClicks}</span></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">No sub-partners found</div>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Partner Code</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead className="text-right">Total Clicks</TableHead>
                <TableHead className="text-right">Bonus Clicks</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.length > 0 ? (
                filteredPartners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium">@{partner.username}</TableCell>
                    <TableCell>{partner.partnerCode}</TableCell>
                    <TableCell>{new Date(partner.joinDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">{partner.totalClicks.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{partner.bonusClicksEarned.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        partner.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {partner.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                    No sub-partners found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
        
        <div className="mt-6 text-sm text-gray-500">
          <p>You earn 20% of all clicks from your sub-partners. Encourage them to share their links for maximum earnings.</p>
        </div>
      </div>
    </div>
  );
};

export default SubPartners;

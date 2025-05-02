
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
            
            const totalClicks = directClicksData?.length || 0;
            
            // Calculate 20% of direct clicks as bonus
            const bonusClicksEarned = Math.floor(totalClicks * 0.2);
            
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
              You've earned {totalBonusClicksEarned.toLocaleString()} bonus clicks (20% of sub-partners' clicks)
            </p>
          </div>
          
          <div className="w-full md:w-64">
            <Input
              placeholder="Search by partner code..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        
        {isMobile ? (
          <div className="space-y-4">
            {filteredPartners.length > 0 ? (
              filteredPartners.map((partner) => (
                <Card key={partner.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium text-lg">{partner.partnerCode}</div>
                      <Badge variant={partner.status === 'active' ? "success" : "secondary"}>
                        {partner.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">Total Clicks</p>
                        <p className="font-medium">{partner.totalClicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Your Bonus (20%)</p>
                        <p className="font-medium">{partner.bonusClicksEarned.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">No sub-partners found</div>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner Code</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead className="text-right">Total Clicks</TableHead>
                <TableHead className="text-right">Your Bonus (20%)</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.length > 0 ? (
                filteredPartners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium">{partner.partnerCode}</TableCell>
                    <TableCell>{new Date(partner.joinDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">{partner.totalClicks.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{partner.bonusClicksEarned.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={partner.status === 'active' ? "success" : "secondary"}>
                        {partner.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-gray-500">
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

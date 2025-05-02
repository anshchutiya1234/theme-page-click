
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

interface SubPartner {
  id: string;
  username: string;
  partnerCode: string;
  totalClicks: number;
  bonusClicksEarned: number;
}

interface SubPartnersListProps {
  partnerCode: string;
  limit?: number;
}

const SubPartnersList = ({ partnerCode, limit = 5 }: SubPartnersListProps) => {
  const [subPartners, setSubPartners] = useState<SubPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchSubPartners = async () => {
      try {
        // First get list of users that have referred_by matching this partner code
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, username, partner_code')
          .eq('referred_by', partnerCode)
          .order('joined_at', { ascending: false })
          .limit(limit);

        if (usersError) throw usersError;
        
        if (!usersData || usersData.length === 0) {
          setSubPartners([]);
          setIsLoading(false);
          return;
        }
        
        // For each sub-partner, get their clicks count and bonus clicks they generated
        const subPartnersWithStats = await Promise.all(
          usersData.map(async (user) => {
            // Get direct clicks by this sub-partner
            const { data: directClicksData, error: directClicksError } = await supabase
              .from('clicks')
              .select('*', { count: 'exact', head: false })
              .eq('user_id', user.id)
              .eq('type', 'direct');
              
            if (directClicksError) throw directClicksError;
            
            // Get actual count of direct clicks
            const directClicksCount = directClicksData ? directClicksData.length : 0;
            
            // Calculate the 20% of direct clicks that should be credited to the referring partner
            const bonusClicksEarned = Math.floor(directClicksCount * 0.2);
            
            return {
              id: user.id,
              username: user.username,
              partnerCode: user.partner_code,
              totalClicks: directClicksCount,
              bonusClicksEarned: bonusClicksEarned
            };
          })
        );
        
        setSubPartners(subPartnersWithStats);
      } catch (error) {
        console.error('Error fetching sub-partners:', error);
        setSubPartners([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubPartners();
  }, [partnerCode, limit]);

  if (isLoading) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <div className="flex justify-center items-center h-24">
          <div className="animate-spin h-8 w-8 border-4 border-partner-purple border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">Your Sub-Partners</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              {!isMobile ? (
                <>
                  <th className="py-3 text-left font-medium text-gray-500">Username</th>
                  <th className="py-3 text-left font-medium text-gray-500">Partner Code</th>
                  <th className="py-3 text-right font-medium text-gray-500">Total Clicks</th>
                  <th className="py-3 text-right font-medium text-gray-500">Bonus Clicks (20%)</th>
                </>
              ) : (
                <>
                  <th className="py-3 text-left font-medium text-gray-500">Partner Code</th>
                  <th className="py-3 text-right font-medium text-gray-500">Bonus (20%)</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {subPartners.length > 0 ? (
              subPartners.map((partner) => (
                <tr key={partner.id} className="border-b hover:bg-gray-50">
                  {!isMobile ? (
                    <>
                      <td className="py-4 font-medium">@{partner.username}</td>
                      <td className="py-4">{partner.partnerCode}</td>
                      <td className="py-4 text-right">{partner.totalClicks.toLocaleString()}</td>
                      <td className="py-4 text-right">{partner.bonusClicksEarned.toLocaleString()}</td>
                    </>
                  ) : (
                    <>
                      <td className="py-4 font-medium">{partner.partnerCode}</td>
                      <td className="py-4 text-right">{partner.bonusClicksEarned.toLocaleString()}</td>
                    </>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isMobile ? 2 : 4} className="py-4 text-center text-gray-500">
                  No sub-partners yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {subPartners.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          <p>You earn 20% of all clicks from your sub-partners.</p>
        </div>
      )}
    </div>
  );
};

export default SubPartnersList;

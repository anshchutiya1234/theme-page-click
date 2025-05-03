
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SubPartner } from '@/types/partner';

export const useSubPartners = (profileId: string | undefined) => {
  const [subPartners, setSubPartners] = useState<SubPartner[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<SubPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchSubPartners = async () => {
      if (!profileId) return;
      
      try {
        // First get list of users that have referred_by matching this partner code
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, username, joined_at, partner_code')
          .eq('referred_by', profileId);

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
            const bonusClicksEarned = Math.ceil(totalClicks * 0.2);
            
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
        
        // Now let's verify the actual bonus clicks in the database
        for (const partner of fetchedSubPartners) {
          // Check for actual bonus clicks in the database for the parent partner
          const { data: bonusClicksData, error: bonusClicksError } = await supabase
            .from('clicks')
            .select('id')
            .eq('user_id', profileId)
            .eq('source_user_id', partner.id)
            .eq('type', 'bonus');
            
          if (!bonusClicksError && bonusClicksData) {
            // If there's a discrepancy, add the missing bonus clicks
            const actualBonusClicks = bonusClicksData.length;
            const expectedBonusClicks = partner.bonusClicksEarned;
            
            if (actualBonusClicks < expectedBonusClicks) {
              console.log(`Adding ${expectedBonusClicks - actualBonusClicks} missing bonus clicks for partner ${partner.partnerCode}`);
              
              // Add missing bonus clicks
              const missingBonusClicks = expectedBonusClicks - actualBonusClicks;
              if (missingBonusClicks > 0) {
                const bonusClicks = Array(missingBonusClicks).fill(null).map(() => ({
                  user_id: profileId,
                  source_user_id: partner.id,
                  type: 'bonus',
                  ip_address: '127.0.0.1',
                  user_agent: 'SYSTEM_BONUS_CORRECTION'
                }));
                
                const { error: insertError } = await supabase
                  .from('clicks')
                  .insert(bonusClicks);
                  
                if (insertError) {
                  console.error('Error adding missing bonus clicks:', insertError);
                }
              }
            }
          }
        }
        
        setSubPartners(fetchedSubPartners);
        setFilteredPartners(fetchedSubPartners);
      } catch (error) {
        console.error('Error fetching sub-partners:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubPartners();
  }, [profileId]);
  
  const handleSearch = (term: string) => {
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
  
  return {
    subPartners,
    filteredPartners,
    isLoading,
    handleSearch,
    totalBonusClicksEarned
  };
};

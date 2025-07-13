
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, TrendingUp, Calendar, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import LoadingLogo from '@/components/ui/loading-logo';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSubPartners } from '@/hooks/use-sub-partners';
import { SubPartnerFilter } from '@/components/sub-partners/SubPartnerFilter';
import { SubPartnerMobileCard } from '@/components/sub-partners/SubPartnerMobileCard';
import { SubPartnerTable } from '@/components/sub-partners/SubPartnerTable';

const SubPartners = () => {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useIsMobile();
  
  const {
    filteredPartners,
    isLoading,
    totalBonusClicksEarned,
    handleSearch
  } = useSubPartners(profile?.partner_code);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    handleSearch(term);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingLogo size="md" />
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
        <SubPartnerFilter 
          totalBonusClicksEarned={totalBonusClicksEarned}
          searchTerm={searchTerm}
          onSearch={handleSearchChange}
        />
        
        {isMobile ? (
          <div className="space-y-4">
            {filteredPartners.length > 0 ? (
              filteredPartners.map((partner) => (
                <SubPartnerMobileCard key={partner.id} partner={partner} />
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">No sub-partners found</div>
            )}
          </div>
        ) : (
          <SubPartnerTable partners={filteredPartners} />
        )}
        
        <div className="mt-6 text-sm text-gray-500">
          <p>You earn 20% of all clicks from your sub-partners. Encourage them to share their links for maximum earnings.</p>
        </div>
      </div>
    </div>
  );
};

export default SubPartners;

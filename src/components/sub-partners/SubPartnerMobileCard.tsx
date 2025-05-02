
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SubPartner } from '@/types/partner';

interface SubPartnerMobileCardProps {
  partner: SubPartner;
}

export const SubPartnerMobileCard = ({ partner }: SubPartnerMobileCardProps) => {
  return (
    <Card key={partner.id} className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="font-medium text-lg">{partner.partnerCode}</div>
          <Badge variant={partner.status === 'active' ? "default" : "secondary"}>
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
  );
};

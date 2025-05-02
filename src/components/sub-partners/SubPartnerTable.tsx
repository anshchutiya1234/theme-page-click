
import React from 'react';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SubPartner } from '@/types/partner';

interface SubPartnerTableProps {
  partners: SubPartner[];
}

export const SubPartnerTable = ({ partners }: SubPartnerTableProps) => {
  return (
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
        {partners.length > 0 ? (
          partners.map((partner) => (
            <TableRow key={partner.id}>
              <TableCell className="font-medium">{partner.partnerCode}</TableCell>
              <TableCell>{new Date(partner.joinDate).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">{partner.totalClicks.toLocaleString()}</TableCell>
              <TableCell className="text-right">{partner.bonusClicksEarned.toLocaleString()}</TableCell>
              <TableCell className="text-right">
                <Badge variant={partner.status === 'active' ? "default" : "secondary"}>
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
  );
};

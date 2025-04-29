
import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface PartnerCodeCardProps {
  partnerCode: string;
}

const PartnerCodeCard = ({ partnerCode }: PartnerCodeCardProps) => {
  const { toast } = useToast();
  const baseUrl = 'https://tradingcircle.space/join?ref=';
  const referralLink = `${baseUrl}${partnerCode}`;

  const copyToClipboard = (text: string, successMessage: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied!",
          description: successMessage,
        });
      },
      (err) => {
        toast({
          title: "Error",
          description: "Could not copy text: " + err,
          variant: "destructive",
        });
      }
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-500 text-sm">Your Partner Code</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold">{partnerCode}</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => copyToClipboard(partnerCode, "Partner code copied to clipboard")}
            >
              Copy
            </Button>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium text-gray-500 text-sm">Your Referral Link</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-medium truncate max-w-[200px]">{referralLink}</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => copyToClipboard(referralLink, "Referral link copied to clipboard")}
            >
              Copy
            </Button>
          </div>
        </div>
        
        <Button 
          variant="outline"
          onClick={() => {
            window.open(`https://twitter.com/intent/tweet?text=Join%20the%20Trading%20Circle%20Partner%20Program%20and%20earn%20$1,000%20per%2010,000%20clicks.%20Use%20my%20code%20${partnerCode}%20or%20click%20the%20link%20below%0A%0A&url=${encodeURIComponent(referralLink)}`, '_blank');
          }}
        >
          Share
        </Button>
      </div>
    </div>
  );
};

export default PartnerCodeCard;

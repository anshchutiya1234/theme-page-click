
import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface PartnerCodeCardProps {
  partnerCode: string;
}

const PartnerCodeCard = ({ partnerCode }: PartnerCodeCardProps) => {
  const { toast } = useToast();
  const baseUrl = window.location.origin + '/join?ref=';
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

  const trackClick = async () => {
    try {
      // Call the edge function to track a click when sharing
      await fetch(`${window.location.origin}/functions/v1/track-click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          referralCode: partnerCode 
        }),
      });
    } catch (error) {
      console.error("Failed to track click:", error);
    }
  };

  const shareToTwitter = () => {
    const shareText = `Join the Trading Circle Partner Program and earn $1,000 per 10,000 clicks. Use my code ${partnerCode} or click the link below`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralLink)}`;
    
    // Track sharing as a click
    trackClick();
    
    window.open(shareUrl, '_blank');
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
          onClick={shareToTwitter}
        >
          Share
        </Button>
      </div>
    </div>
  );
};

export default PartnerCodeCard;

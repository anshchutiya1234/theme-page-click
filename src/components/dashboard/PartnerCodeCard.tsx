import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PartnerCodeCardProps {
  partnerCode: string;
}

const PartnerCodeCard = ({ partnerCode }: PartnerCodeCardProps) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [shortUrl, setShortUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const createOrGetShortUrl = async () => {
      if (!profile) return;
      
      try {
        setIsLoading(true);
        
        // Check if we already have a short URL for this partner code
        const { data: existingUrl, error: existingError } = await supabase
          .from('short_urls')
          .select('short_code')
          .eq('target_url', 'https://tradingcircle.space/join?ref=' + partnerCode)
          .single();

        if (existingUrl) {
          setShortUrl(`${window.location.origin}/r/${existingUrl.short_code}`);
          return;
        }

        // Generate a new short code
        const { data: shortCode, error: codeError } = await supabase
          .rpc('generate_unique_short_code');

        if (codeError) throw codeError;

        // Create a new short URL
        const { data: newUrl, error: insertError } = await supabase
          .from('short_urls')
          .insert({
            user_id: profile.id,
            target_url: 'https://tradingcircle.space/join?ref=' + partnerCode,
            short_code: shortCode
          })
          .select('short_code')
          .single();

        if (insertError) throw insertError;
        
        setShortUrl(`${window.location.origin}/r/${newUrl.short_code}`);
      } catch (error) {
        console.error('Error creating short URL:', error);
        toast({
          title: "Error",
          description: "Failed to generate short URL. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    createOrGetShortUrl();
  }, [partnerCode, toast, profile]);

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

  const shareToTwitter = () => {
    const shareText = `Join the Trading Circle Partner Program and earn $1,000 per 10,000 clicks. Use my link below:`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shortUrl)}`;
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">Your Partner Code</h2>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">Partner Code</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-100 px-3 py-2 rounded-md font-mono">
              {partnerCode}
            </code>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => copyToClipboard(partnerCode, "Partner code copied to clipboard!")}
            >
              Copy
            </Button>
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">Short URL</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-100 px-3 py-2 rounded-md font-mono truncate">
              {isLoading ? 'Generating...' : shortUrl}
            </code>
            <Button 
              variant="outline" 
              size="sm"
              disabled={isLoading}
              onClick={() => copyToClipboard(shortUrl, "Short URL copied to clipboard!")}
            >
              Copy
            </Button>
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <p className="text-sm text-gray-500 mb-3">Share your partner link</p>
          <Button
            variant="outline"
            size="sm"
            onClick={shareToTwitter}
          >
            Share on Twitter
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PartnerCodeCard;

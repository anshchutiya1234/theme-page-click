import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
interface PartnerCodeCardProps {
  partnerCode: string;
}
const PartnerCodeCard = ({
  partnerCode
}: PartnerCodeCardProps) => {
  const {
    toast
  } = useToast();
  const {
    profile
  } = useAuth();
  const [shortUrl, setShortUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const createOrGetShortUrl = async () => {
      if (!profile) {
        console.log('No profile found');
        setError('Please log in to generate a short URL');
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        console.log('Checking for existing URL for partner code:', partnerCode);

        // Check if we already have a short URL for this partner code
        const {
          data: existingUrl,
          error: existingError
        } = await supabase.from('short_urls').select('short_code').eq('target_url', `https://leverage-money.com/landing?ref=${partnerCode}`).single();
        if (existingUrl) {
          console.log('Found existing short URL:', existingUrl);
          setShortUrl(`${window.location.origin}/r/${existingUrl.short_code}`);
          setIsLoading(false);
          return;
        }

        // If no existing URL and no error (or expected no results error), create new one
        if (!existingError || existingError.code === 'PGRST116') {
          console.log('Generating new short code...');
          // Generate a new short code locally
          const generateShortCode = () => {
            const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = '';
            for (let i = 0; i < 6; i++) {
              result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
          };
          const shortCode = generateShortCode();
          console.log('Generated short code:', shortCode);

          // Create a new short URL
          const {
            data: newUrl,
            error: insertError
          } = await supabase.from('short_urls').insert({
            user_id: profile.id,
            target_url: `https://leverage-money.com/landing?ref=${partnerCode}`,
            short_code: shortCode
          }).select('short_code').single();
          if (insertError) {
            // If we get a unique violation, try again with a new code
            if (insertError.code === '23505') {
              console.log('Short code already exists, retrying...');
              throw new Error('Short code already exists, please try again');
            }
            console.error('Error inserting short URL:', insertError);
            throw new Error(`Failed to save short URL: ${insertError.message}`);
          }
          if (!newUrl) {
            throw new Error('No short URL created');
          }
          console.log('Created new short URL:', newUrl);
          setShortUrl(`${window.location.origin}/r/${newUrl.short_code}`);
        } else {
          // If there was an unexpected error checking for existing URL
          console.error('Unexpected error checking existing URL:', existingError);
          throw existingError;
        }
      } catch (error) {
        console.error('Error creating short URL:', error);
        const errorMessage = error instanceof Error ? error.message : "Failed to generate short URL. Please try again.";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    createOrGetShortUrl();
  }, [partnerCode, toast, profile]);
  const copyToClipboard = (text: string, successMessage: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: successMessage
      });
    }, err => {
      toast({
        title: "Error",
        description: "Could not copy text: " + err,
        variant: "destructive"
      });
    });
  };
  const shareToTwitter = () => {
    const shareText = `Join the Leverage Money Partner Program and earn $1,000 per 10,000 clicks. Use my link below:`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shortUrl)}`;
    window.open(shareUrl, '_blank');
  };
  return <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">Your Partner Code</h2>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">Partner Code</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-100 px-3 py-2 rounded-md font-mono">
              {partnerCode}
            </code>
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(partnerCode, "Partner code copied to clipboard!")}>
              Copy
            </Button>
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2">Short URL</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-100 px-3 py-2 rounded-md font-mono truncate">
              {isLoading ? 'Generating...' : error ? 'Error generating URL' : shortUrl}
            </code>
            <Button variant="outline" size="sm" disabled={isLoading || !shortUrl} onClick={() => copyToClipboard(shortUrl, "Short URL copied to clipboard!")}>
              Copy
            </Button>
          </div>
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
        
        
      </div>
    </div>;
};
export default PartnerCodeCard;
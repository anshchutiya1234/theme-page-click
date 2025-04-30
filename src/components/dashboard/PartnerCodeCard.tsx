import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';

interface PartnerCodeCardProps {
  partnerCode: string;
  onClicksUpdate?: () => void;
}

// Helper function to detect bots
const isBot = (userAgent: string): boolean => {
  const botPatterns = [
    'bot', 'crawler', 'spider', 'headless', 'puppet',
    'selenium', 'chrome-lighthouse', 'googlebot', 'bingbot',
    'yandexbot', 'duckduckbot', 'slurp'
  ];
  const lowerUA = userAgent.toLowerCase();
  return botPatterns.some(pattern => lowerUA.includes(pattern));
};

// Helper function to generate visitor ID
const generateVisitorId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomStr}`;
};

export const ShortUrlRedirect = () => {
  const { code } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleRedirect = async () => {
      if (!code) {
        console.error('No short code provided');
        navigate('/404');
        return;
      }

      try {
        // Get the target URL from short_urls
        const { data: urlData, error: urlError } = await supabase
          .from('short_urls')
          .select('user_id, target_url')
          .eq('short_code', code)
          .single();

        if (urlError || !urlData) {
          console.error('Error fetching short URL:', urlError);
          navigate('/404');
          return;
        }

        // Check total clicks from this IP
        const { data: totalClicks, error: totalClicksError } = await supabase
          .from('clicks')
          .select('id')
          .eq('ip_address', window.location.hostname);

        if (totalClicksError) {
          console.error('Error checking total clicks:', totalClicksError);
          return;
        }

        // If more than 5 clicks from this IP, don't count
        if (totalClicks && totalClicks.length >= 5) {
          console.log('Maximum clicks reached for this IP');
          window.location.href = urlData.target_url;
          return;
        }

        // Check clicks in the last hour from this IP
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        const { data: recentClicks, error: recentClicksError } = await supabase
          .from('clicks')
          .select('id')
          .eq('ip_address', window.location.hostname)
          .gte('created_at', oneHourAgo.toISOString());

        if (recentClicksError) {
          console.error('Error checking recent clicks:', recentClicksError);
          return;
        }

        // If clicked in the last hour, don't count
        if (recentClicks && recentClicks.length > 0) {
          console.log('Already clicked within the last hour');
          window.location.href = urlData.target_url;
          return;
        }

        // Register the click
        const { error: insertError } = await supabase.from('clicks').insert({
          user_id: urlData.user_id,
          short_code: code,
          type: 'direct',
          ip_address: window.location.hostname,
          is_unique: true
        });

        if (insertError) {
          console.error('Error registering click:', insertError);
        }

        // Redirect to target URL
        window.location.href = urlData.target_url;
      } catch (error) {
        console.error('Error handling redirect:', error);
        navigate('/404');
      }
    };

    handleRedirect();
  }, [code, navigate]);

  return <div>Redirecting...</div>;
};

const PartnerCodeCard = ({ partnerCode, onClicksUpdate }: PartnerCodeCardProps) => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [shortUrl, setShortUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);

  // Fetch click count
  useEffect(() => {
    const fetchClickCount = async () => {
      if (!profile) return;

      try {
        console.log('Fetching click count for user:', profile.id);
        const { data: clicks, error } = await supabase
          .from('clicks')
          .select('id, type')
          .eq('user_id', profile.id)
          .eq('type', 'direct');

        if (error) {
          console.error('Error fetching clicks:', error);
          return;
        }

        const count = clicks?.length || 0;
        console.log('Found clicks:', count);
        setClickCount(count);
        if (onClicksUpdate) {
          onClicksUpdate();
        }
      } catch (error) {
        console.error('Error fetching click count:', error);
      }
    };

    fetchClickCount();
    
    // Set up real-time subscription for clicks
    const subscription = supabase
      .channel('clicks')
      .on('postgres_changes', 
        { 
          event: '*',  // Listen for all events
          schema: 'public', 
          table: 'clicks',
          filter: `user_id=eq.${profile?.id} AND type=eq.direct`
        }, 
        (payload) => {
          console.log('Received click update:', payload);
          fetchClickCount();
        }
      )
      .subscribe();

    // Fetch click count every 30 seconds as a backup
    const intervalId = setInterval(fetchClickCount, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, [profile, onClicksUpdate]);

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
        const { data: existingUrl, error: existingError } = await supabase
          .from('short_urls')
          .select('short_code')
          .eq('target_url', 'https://tradingcircle.space/join?ref=' + partnerCode)
          .single();

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
          const { data: newUrl, error: insertError } = await supabase
            .from('short_urls')
            .insert({
              user_id: profile.id,
              target_url: 'https://tradingcircle.space/join?ref=' + partnerCode,
              short_code: shortCode
            })
            .select('short_code')
            .single();

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
              {isLoading ? 'Generating...' : error ? 'Error generating URL' : shortUrl}
            </code>
            <Button 
              variant="outline" 
              size="sm"
              disabled={isLoading || !shortUrl}
              onClick={() => copyToClipboard(shortUrl, "Short URL copied to clipboard!")}
            >
              Copy
            </Button>
          </div>
          {error && (
            <p className="text-sm text-red-500 mt-1">{error}</p>
          )}
        </div>
        
        <div className="pt-4 border-t">
          <p className="text-sm text-gray-500 mb-3">Share your partner link</p>
          <Button
            variant="outline"
            size="sm"
            disabled={!shortUrl}
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

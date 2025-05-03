
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clipboard, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PartnerCodeCardProps {
  partnerCode: string;
}

const PartnerCodeCard = ({ partnerCode }: PartnerCodeCardProps) => {
  const [copied, setCopied] = useState(false);
  const [shortUrl, setShortUrl] = useState<string | null>(null);
  const [isCreatingUrl, setIsCreatingUrl] = useState(false);
  const { toast } = useToast();
  const linkId = `link-${partnerCode}`;
  const edgeFunctionsUrl = import.meta.env.VITE_EDGE_FUNCTIONS_URL || 'https://ekfgfyjtfgjrfwbkoifd.supabase.co/functions/v1';

  useEffect(() => {
    const checkExistingShortUrl = async () => {
      try {
        const { data, error } = await supabase
          .from('short_urls')
          .select('short_code')
          .eq('target_url', `${window.location.origin}?ref=${partnerCode}` as any)
          .maybeSingle();
        
        if (error) throw error;
        
        if (data && 'short_code' in data) {
          setShortUrl(`${window.location.origin}/r/${data.short_code}`);
        }
      } catch (error) {
        console.error('Error checking for existing short URL:', error);
      }
    };
    
    if (partnerCode) {
      checkExistingShortUrl();
    }
  }, [partnerCode]);
  
  const copyToClipboard = () => {
    const urlToCopy = shortUrl || `${window.location.origin}?ref=${partnerCode}`;
    navigator.clipboard.writeText(urlToCopy);
    setCopied(true);
    
    toast({
      title: "Copied!",
      description: "Partner link copied to clipboard",
    });
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  const createShortUrl = async () => {
    if (shortUrl) return;
    
    setIsCreatingUrl(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error('User not authenticated');
      
      const { data: genCode, error } = await supabase
        .rpc('generate_unique_short_code');
        
      if (error || !genCode) throw error || new Error('Failed to generate code');
      
      const shortCode = genCode;
      
      // The type issue is with Supabase's TypeScript definitions
      // Using type assertion to make it work
      const { error: insertError } = await supabase
        .from('short_urls')
        .insert({
          user_id: userData.user.id,
          target_url: `${window.location.origin}?ref=${partnerCode}`,
          short_code: shortCode
        } as any);
        
      if (insertError) throw insertError;
      
      setShortUrl(`${window.location.origin}/r/${shortCode}`);
      
      toast({
        title: "Success!",
        description: "Short URL created successfully",
      });
    } catch (error: any) {
      console.error('Error creating short URL:', error);
      toast({
        title: "Error",
        description: "Failed to create short URL. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingUrl(false);
    }
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-lg mb-1">Your Partner Link</h3>
            <p className="text-sm text-gray-500 mb-3">
              Share this link to earn clicks. You earn $0.10 per click.
            </p>
          </div>
          
          <div className="rounded-md border flex items-center">
            <div className="flex-1 px-4 py-2 truncate">
              <a 
                href={shortUrl || `${window.location.origin}?ref=${partnerCode}`} 
                target="_blank" 
                rel="noopener noreferrer"
                id={linkId}
                className="font-medium text-partner-purple hover:underline truncate block"
              >
                {shortUrl || `${window.location.origin}?ref=${partnerCode}`}
              </a>
            </div>
            <div className="pr-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={copyToClipboard}
                className="h-8 w-8"
                title="Copy to clipboard"
              >
                <Clipboard className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">Partner Code:</span> {partnerCode}
            </div>
            {!shortUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={createShortUrl}
                disabled={isCreatingUrl}
              >
                {isCreatingUrl ? "Creating..." : "Create Short URL"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PartnerCodeCard;

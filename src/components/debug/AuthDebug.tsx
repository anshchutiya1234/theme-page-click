import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const AuthDebug = () => {
  const { session, user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const createProfileManually = async () => {
    if (!user) return;

    try {
      const partnerCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const { error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          name: 'Manual User',
          username: `user_${user.id.substring(0, 8)}`,
          email: user.email || '',
          instagram_username: '',
          partner_code: partnerCode,
          referred_by: null,
          is_admin: false
        });

      if (error) throw error;
      
      await refreshProfile();
      
      toast({
        title: "Success!",
        description: "User profile created manually.",
      });
    } catch (error: any) {
      console.error('Error creating profile manually:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create profile",
        variant: "destructive",
      });
    }
  };

  // Only show in development mode
  if (process.env.NODE_ENV === 'production') return null;
  
  // Don't show if we don't have access to the environment
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50">
      <CardHeader>
        <CardTitle className="text-sm">Auth Debug (Dev Only)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div>
          <strong>Session:</strong> {session ? '✅ Active' : '❌ None'}
        </div>
        <div>
          <strong>User:</strong> {user ? `✅ ${user.email}` : '❌ None'}
        </div>
        <div>
          <strong>Profile:</strong> {profile ? `✅ ${profile.name}` : '❌ Missing'}
        </div>
        {user && !profile && (
          <Button 
            size="sm" 
            onClick={createProfileManually}
            className="w-full mt-2"
          >
            Create Profile Manually
          </Button>
        )}
        <Button 
          size="sm" 
          variant="outline"
          onClick={refreshProfile}
          className="w-full"
        >
          Refresh Profile
        </Button>
      </CardContent>
    </Card>
  );
};

export default AuthDebug; 
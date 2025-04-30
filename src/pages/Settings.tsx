
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  instagramUsername: z.string().min(1, 'Instagram username is required'),
  email: z.string().email('Invalid email address'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const referralSchema = z.object({
  referralCode: z.string().length(5, 'Partner code must be exactly 5 digits'),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type ReferralFormData = z.infer<typeof referralSchema>;

const Settings = () => {
  const { toast } = useToast();
  const { profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      instagramUsername: '',
      email: '',
    },
  });
  
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
  
  const referralForm = useForm<ReferralFormData>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      referralCode: '',
    },
  });

  // Load user data when profile is available
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        name: profile.name,
        instagramUsername: profile.instagram_username,
        email: profile.email,
      });
      setIsLoading(false);
    }
  }, [profile, profileForm]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!profile) return;
    
    try {
      // Update auth email if changed
      if (data.email !== profile.email) {
        const { error: authError } = await supabase.auth.updateUser({ 
          email: data.email 
        });
        
        if (authError) throw authError;
      }
      
      // Update profile data
      const { error } = await supabase
        .from('users')
        .update({
          name: data.name,
          instagram_username: data.instagramUsername,
        })
        .eq('id', profile.id);
      
      if (error) throw error;
      
      await refreshProfile();
      
      toast({
        title: "Success!",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      // First verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.email || '',
        password: data.currentPassword,
      });
      
      if (signInError) {
        toast({
          title: "Error",
          description: "Current password is incorrect",
          variant: "destructive",
        });
        return;
      }
      
      // Update password
      const { error } = await supabase.auth.updateUser({ 
        password: data.newPassword 
      });
      
      if (error) throw error;
      
      toast({
        title: "Success!",
        description: "Your password has been changed successfully.",
      });
      
      passwordForm.reset();
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const onReferralSubmit = async (data: ReferralFormData) => {
    if (!profile) return;
    
    try {
      // Check if the referral code exists
      const { data: referrerData, error: referrerError } = await supabase
        .from('users')
        .select('id')
        .eq('partner_code', data.referralCode)
        .single();
      
      if (referrerError || !referrerData) {
        toast({
          title: "Error",
          description: "Invalid partner code. Please check and try again.",
          variant: "destructive",
        });
        return;
      }
      
      // Prevent self-referral
      if (referrerData.id === profile.id) {
        toast({
          title: "Error",
          description: "You cannot enter your own partner code.",
          variant: "destructive",
        });
        return;
      }
      
      // Update user's referred_by
      const { error } = await supabase
        .from('users')
        .update({
          referred_by: data.referralCode,
        })
        .eq('id', profile.id);
      
      if (error) throw error;
      
      // Add 500 bonus clicks for the referrer
      for (let i = 0; i < 500; i++) {
        await supabase
          .from('clicks')
          .insert({
            user_id: profile.id,
            source_user_id: referrerData.id,
            type: 'bonus',
            ip_address: '127.0.0.1',
            user_agent: 'SYSTEM_BONUS_CLICKS'
          });
      }
      
      await refreshProfile();
      
      toast({
        title: "Success!",
        description: "Partner code has been added successfully.",
      });
    } catch (error: any) {
      console.error('Error adding referral code:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add partner code. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-partner-purple border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage your account preferences
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
          
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                {...profileForm.register('name')}
              />
              {profileForm.formState.errors.name && (
                <p className="mt-1 text-sm text-red-500">{profileForm.formState.errors.name.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="instagramUsername">Instagram Username</Label>
              <Input
                id="instagramUsername"
                type="text"
                {...profileForm.register('instagramUsername')}
              />
              {profileForm.formState.errors.instagramUsername && (
                <p className="mt-1 text-sm text-red-500">{profileForm.formState.errors.instagramUsername.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...profileForm.register('email')}
              />
              {profileForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-500">{profileForm.formState.errors.email.message}</p>
              )}
            </div>
            
            <Button
              type="submit"
              disabled={profileForm.formState.isSubmitting}
            >
              {profileForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </div>
        
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-6">Change Password</h2>
            
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...passwordForm.register('currentPassword')}
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="mt-1 text-sm text-red-500">{passwordForm.formState.errors.currentPassword.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...passwordForm.register('newPassword')}
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="mt-1 text-sm text-red-500">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...passwordForm.register('confirmPassword')}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              
              <Button
                type="submit"
                disabled={passwordForm.formState.isSubmitting}
              >
                {passwordForm.formState.isSubmitting ? 'Changing...' : 'Change Password'}
              </Button>
            </form>
          </div>
          
          {!profile.referred_by && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-2">Partner Code</h2>
              <p className="text-gray-500 text-sm mb-6">
                If you signed up without a partner code, you can add one here. This cannot be changed later.
              </p>
              
              <form onSubmit={referralForm.handleSubmit(onReferralSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="referralCode">Partner Code</Label>
                  <Input
                    id="referralCode"
                    placeholder="5-digit code"
                    {...referralForm.register('referralCode')}
                  />
                  {referralForm.formState.errors.referralCode && (
                    <p className="mt-1 text-sm text-red-500">{referralForm.formState.errors.referralCode.message}</p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  disabled={referralForm.formState.isSubmitting}
                >
                  {referralForm.formState.isSubmitting ? 'Submitting...' : 'Submit Code'}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;

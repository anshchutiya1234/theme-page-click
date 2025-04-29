
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

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
  const [hasReferralCode, setHasReferralCode] = useState(false);
  
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: 'Crypto Trader',
      instagramUsername: 'crypto_trader',
      email: 'trader@example.com',
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

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      // Here would be the call to the Supabase API to update profile
      console.log('Profile update:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success!",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      // Here would be the call to the Supabase API to change password
      console.log('Password change:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success!",
        description: "Your password has been changed successfully.",
      });
      
      passwordForm.reset();
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: "Failed to change password. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const onReferralSubmit = async (data: ReferralFormData) => {
    try {
      // Here would be the call to the Supabase API to add referral code
      console.log('Referral code submitted:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success!",
        description: "Partner code has been added successfully.",
      });
      
      setHasReferralCode(true);
    } catch (error) {
      console.error('Error adding referral code:', error);
      toast({
        title: "Error",
        description: "Failed to add partner code. Please try again.",
        variant: "destructive",
      });
    }
  };

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
          
          {!hasReferralCode && (
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

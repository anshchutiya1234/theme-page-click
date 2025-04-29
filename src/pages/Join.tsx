
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import Navbar from '@/components/layout/Navbar';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  instagramUsername: z.string().min(1, 'Instagram username is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  referralCode: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const Join = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [referralCode, setReferralCode] = useState<string>('');
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      referralCode: '',
    },
  });

  useEffect(() => {
    // Extract referral code from URL if present
    const params = new URLSearchParams(location.search);
    const refCode = params.get('ref');
    
    if (refCode) {
      setReferralCode(refCode);
      setValue('referralCode', refCode);
      
      // Store referral code in localStorage
      localStorage.setItem('referralCode', refCode);
    } else {
      // Check if there's a stored code in localStorage
      const storedCode = localStorage.getItem('referralCode');
      if (storedCode) {
        setReferralCode(storedCode);
        setValue('referralCode', storedCode);
      }
    }
  }, [location.search, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      // Here would be the call to the Supabase API to create a user
      console.log('Form submitted:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success!",
        description: "Your account has been created successfully.",
      });
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Join the Partner Program</h1>
            <p className="mt-2 text-gray-600">
              Earn $1,000 per 10,000 high-quality clicks. No cap.
            </p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your full name"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="instagramUsername">Instagram Username</Label>
                <Input
                  id="instagramUsername"
                  type="text"
                  placeholder="Your Instagram handle"
                  {...register('instagramUsername')}
                />
                {errors.instagramUsername && (
                  <p className="mt-1 text-sm text-red-500">{errors.instagramUsername.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="referralCode">
                  Partner Code (Optional)
                  {referralCode && <span className="ml-2 text-green-600">✓</span>}
                </Label>
                <Input
                  id="referralCode"
                  type="text"
                  placeholder="5-digit code"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  {...register('referralCode')}
                />
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-partner-purple hover:underline">
                  Login here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Join;

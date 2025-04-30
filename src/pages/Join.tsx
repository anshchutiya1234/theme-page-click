
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
import { useAuth } from '@/contexts/AuthContext';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

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
  const { signUp, user } = useAuth();
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      instagramUsername: '',
      email: '',
      password: '',
      referralCode: '',
    },
  });

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Extract referral code from URL if present
    const params = new URLSearchParams(location.search);
    const refCode = params.get('ref');
    
    if (refCode) {
      setReferralCode(refCode);
      form.setValue('referralCode', refCode);
      
      // Store referral code in localStorage
      localStorage.setItem('referralCode', refCode);
    } else {
      // Check if there's a stored code in localStorage
      const storedCode = localStorage.getItem('referralCode');
      if (storedCode) {
        setReferralCode(storedCode);
        form.setValue('referralCode', storedCode);
      }
    }
  }, [location.search, form]);

  const onSubmit = async (data: FormData) => {
    try {
      await signUp(data.email, data.password, {
        name: data.name,
        instagramUsername: data.instagramUsername,
        referred_by: data.referralCode || null,
      });
    } catch (error) {
      console.error('Error submitting form:', error);
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
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="instagramUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Instagram handle" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="referralCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Partner Code (Optional)
                        {referralCode && <span className="ml-2 text-green-600">✓</span>}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="5-digit code"
                          value={referralCode}
                          onChange={(e) => {
                            setReferralCode(e.target.value);
                            field.onChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Creating Account...' : 'Create Account'}
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
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Join;

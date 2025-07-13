
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface WithdrawalHistory {
  id: string;
  date: string;
  amount: string;
  status: 'pending' | 'approved' | 'rejected';
  method: 'paypal' | 'upi' | 'crypto';
  details: string;
  message?: string;
}

interface WithdrawalEligibility {
  is_eligible: boolean;
  days_since_signup: number;
  total_clicks: number;
}

const withdrawalSchema = z.object({
  paymentMethod: z.enum(['paypal', 'upi', 'crypto']),
  paymentDetails: z.string().min(1, 'Payment details are required'),
});

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

const Withdrawals = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [isRequestingWithdrawal, setIsRequestingWithdrawal] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalHistory[]>([]);
  const [eligibility, setEligibility] = useState<WithdrawalEligibility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState('$0.00');
  
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      paymentMethod: 'paypal',
      paymentDetails: '',
    },
  });
  
  const selectedPaymentMethod = watch('paymentMethod');
  
  useEffect(() => {
    const fetchData = async () => {
      if (!profile) return;
      
      try {
        setIsLoading(true);
        
        // Fetch withdrawal eligibility
        const { data: eligibilityData, error: eligibilityError } = await supabase
          .rpc('check_withdrawal_eligibility', { user_id: profile.id });
          
        if (eligibilityError) throw eligibilityError;
        
        // Fetch withdrawal history
        const { data: withdrawalsData, error: withdrawalsError } = await supabase
          .from('withdrawals')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });
          
        if (withdrawalsError) throw withdrawalsError;
        
        // Fetch total earnings
        const { data: userStats, error: statsError } = await supabase
          .rpc('get_user_stats', { user_id: profile.id });
          
        if (statsError) throw statsError;
        
        // Update state with fetched data
        setEligibility(eligibilityData[0]);
        setTotalEarnings(`$${(userStats[0]?.total_earnings || 0).toFixed(2)}`);
        
        // Process withdrawal history
        const formattedWithdrawals = withdrawalsData.map((withdrawal: any) => ({
          id: withdrawal.id,
          date: withdrawal.created_at,
          amount: `$${withdrawal.amount.toFixed(2)}`,
          status: withdrawal.status,
          method: withdrawal.payment_method,
          details: withdrawal.payment_details,
          message: withdrawal.admin_message
        }));
        
        setWithdrawalHistory(formattedWithdrawals);
      } catch (error) {
        console.error('Error fetching withdrawal data:', error);
        toast({
          title: "Error",
          description: "Failed to load withdrawal data. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [profile, toast]);

  const onSubmit = async (data: WithdrawalFormData) => {
    if (!profile || !eligibility) return;
    
    try {
      const clickCount = eligibility.total_clicks;
      const amount = clickCount * 0.10; // $0.10 per click
      
      // Insert withdrawal request
      const { error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: profile.id,
          click_count: clickCount,
          amount: amount,
          payment_method: data.paymentMethod,
          payment_details: data.paymentDetails
        });
        
      if (error) throw error;
      
      toast({
        title: "Success!",
        description: "Your withdrawal request has been submitted.",
      });
      
      // Refresh withdrawal history
      const { data: updatedWithdrawals } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
        
      if (updatedWithdrawals) {
        const formattedWithdrawals = updatedWithdrawals.map((withdrawal: any) => ({
          id: withdrawal.id,
          date: withdrawal.created_at,
          amount: `$${withdrawal.amount.toFixed(2)}`,
          status: withdrawal.status,
          method: withdrawal.payment_method,
          details: withdrawal.payment_details,
          message: withdrawal.admin_message
        }));
        
        setWithdrawalHistory(formattedWithdrawals);
      }
      
      reset();
      setIsRequestingWithdrawal(false);
    } catch (error: any) {
      console.error('Error requesting withdrawal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to request withdrawal. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const paymentMethodLabels = {
    paypal: 'PayPal',
    upi: 'UPI',
    crypto: 'Cryptocurrency',
  };
  
  const paymentMethodPlaceholders = {
    paypal: 'Your PayPal email address',
    upi: 'Your UPI ID',
    crypto: 'Your wallet address',
  };

  if (isLoading || !profile || !eligibility) {
    return (
      <motion.div 
        className="flex justify-center items-center h-64"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className="h-12 w-12 border-4 border-partner-primary border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>
    );
  }

  // Calculate days until withdrawal eligibility
  const daysUntilWithdrawal = Math.max(0, 30 - eligibility.days_since_signup);
  
  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-partner-darkGray">Withdrawals</h1>
        <p className="text-partner-mediumGray mt-1">
          Request payouts for your earnings
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-semibold text-gray-500 text-sm">TOTAL POINTS</h3>
          <p className="text-3xl font-bold mt-1">{eligibility.total_clicks.toLocaleString()}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-semibold text-gray-500 text-sm">TOTAL EARNINGS</h3>
          <p className="text-3xl font-bold mt-1">{totalEarnings}</p>
          <p className="text-sm text-gray-500 mt-2">$0.10 per point</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-semibold text-gray-500 text-sm">WITHDRAWAL ELIGIBILITY</h3>
          {eligibility.is_eligible ? (
            <>
              <p className="text-green-600 font-bold mt-1">Eligible</p>
              <p className="text-sm text-gray-500 mt-2">
                Minimum 10,000 points and 30+ days since signup
              </p>
              {!isRequestingWithdrawal && (
                <Button 
                  className="w-full mt-4"
                  onClick={() => setIsRequestingWithdrawal(true)}
                >
                  Request Withdrawal
                </Button>
              )}
            </>
          ) : (
            <>
              <p className="text-amber-600 font-bold mt-1">Not Yet Eligible</p>
              <p className="text-sm text-gray-500 mt-2">
                {daysUntilWithdrawal > 0 
                  ? `${daysUntilWithdrawal} days until eligible` 
                  : 'Need 10,000+ points to be eligible'}
              </p>
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-amber-600 h-2.5 rounded-full" 
                  style={{ width: `${Math.min(100, (eligibility.total_clicks / 10000) * 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">
                {eligibility.total_clicks.toLocaleString()} / 10,000 points
              </p>
            </>
          )}
        </div>
      </div>
      
      {isRequestingWithdrawal && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-6">Request Withdrawal</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label className="text-base">Select Payment Method</Label>
              <RadioGroup 
                defaultValue="paypal" 
                className="mt-3 space-y-3"
                {...register('paymentMethod')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="paypal" id="paypal" />
                  <Label htmlFor="paypal" className="font-normal">
                    PayPal
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="upi" id="upi" />
                  <Label htmlFor="upi" className="font-normal">
                    UPI (India)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="crypto" id="crypto" />
                  <Label htmlFor="crypto" className="font-normal">
                    Cryptocurrency
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <Label htmlFor="paymentDetails">
                {selectedPaymentMethod && `${paymentMethodLabels[selectedPaymentMethod]} Details`}
              </Label>
              <Input
                id="paymentDetails"
                placeholder={selectedPaymentMethod && paymentMethodPlaceholders[selectedPaymentMethod]}
                {...register('paymentDetails')}
              />
              {errors.paymentDetails && (
                <p className="mt-1 text-sm text-red-500">{errors.paymentDetails.message}</p>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Amount to withdraw:</span>
                <span className="font-bold">{totalEarnings}</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Withdrawals are typically processed within 7 business days.
              </p>
            </div>
            
            <div className="flex gap-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Request Withdrawal'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsRequestingWithdrawal(false);
                  reset();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-6">Withdrawal History</h2>
        
        {withdrawalHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-3 text-left font-medium text-gray-500">Date</th>
                  <th className="py-3 text-left font-medium text-gray-500">Amount</th>
                  <th className="py-3 text-left font-medium text-gray-500">Method</th>
                  <th className="py-3 text-left font-medium text-gray-500">Details</th>
                  <th className="py-3 text-right font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {withdrawalHistory.map((withdrawal) => (
                  <tr key={withdrawal.id} className="border-b hover:bg-gray-50">
                    <td className="py-4">
                      {new Date(withdrawal.date).toLocaleDateString()}
                    </td>
                    <td className="py-4 font-medium">{withdrawal.amount}</td>
                    <td className="py-4">
                      {withdrawal.method === 'paypal' && 'PayPal'}
                      {withdrawal.method === 'upi' && 'UPI'}
                      {withdrawal.method === 'crypto' && 'Crypto'}
                    </td>
                    <td className="py-4 truncate max-w-[150px]">
                      {withdrawal.details}
                    </td>
                    <td className="py-4 text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        withdrawal.status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : withdrawal.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">
            No withdrawal history yet
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default Withdrawals;

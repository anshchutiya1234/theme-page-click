
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';

interface WithdrawalHistory {
  id: string;
  date: string;
  amount: string;
  status: 'pending' | 'approved' | 'rejected';
  method: 'paypal' | 'upi' | 'crypto';
  details: string;
  message?: string;
}

const withdrawalSchema = z.object({
  paymentMethod: z.enum(['paypal', 'upi', 'crypto']),
  paymentDetails: z.string().min(1, 'Payment details are required'),
});

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

const mockAccountData = {
  signupDate: '2025-03-01',
  totalClicks: 12500,
  totalEarnings: '$1,250.00',
  isEligibleForWithdrawal: true,
  withdrawalHistory: [
    {
      id: '1',
      date: '2025-03-31',
      amount: '$500.00',
      status: 'approved',
      method: 'paypal',
      details: 'trader@example.com',
      message: 'Payment processed successfully',
    },
    {
      id: '2',
      date: '2025-03-15',
      amount: '$300.00',
      status: 'pending',
      method: 'crypto',
      details: '0x1a2b3c...',
    },
  ] as WithdrawalHistory[],
};

const Withdrawals = () => {
  const { toast } = useToast();
  const [isRequestingWithdrawal, setIsRequestingWithdrawal] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      paymentMethod: 'paypal',
      paymentDetails: '',
    },
  });
  
  const selectedPaymentMethod = watch('paymentMethod');
  
  const onSubmit = async (data: WithdrawalFormData) => {
    try {
      // Here would be the call to the Supabase API to request withdrawal
      console.log('Withdrawal request:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success!",
        description: "Your withdrawal request has been submitted.",
      });
      
      reset();
      setIsRequestingWithdrawal(false);
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      toast({
        title: "Error",
        description: "Failed to request withdrawal. Please try again.",
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

  // Calculate days since signup
  const signupDate = new Date(mockAccountData.signupDate);
  const today = new Date();
  const daysSinceSignup = Math.floor((today.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilWithdrawal = Math.max(0, 30 - daysSinceSignup);
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Withdrawals</h1>
        <p className="text-gray-500 mt-1">
          Request payouts for your earnings
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-semibold text-gray-500 text-sm">TOTAL CLICKS</h3>
          <p className="text-3xl font-bold mt-1">{mockAccountData.totalClicks.toLocaleString()}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-semibold text-gray-500 text-sm">TOTAL EARNINGS</h3>
          <p className="text-3xl font-bold mt-1">{mockAccountData.totalEarnings}</p>
          <p className="text-sm text-gray-500 mt-2">$0.10 per click</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-semibold text-gray-500 text-sm">WITHDRAWAL ELIGIBILITY</h3>
          {mockAccountData.isEligibleForWithdrawal ? (
            <>
              <p className="text-green-600 font-bold mt-1">Eligible</p>
              <p className="text-sm text-gray-500 mt-2">
                Minimum 10,000 clicks and 30+ days since signup
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
                  : 'Need 10,000+ clicks to be eligible'}
              </p>
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-amber-600 h-2.5 rounded-full" 
                  style={{ width: `${Math.min(100, (mockAccountData.totalClicks / 10000) * 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-right">
                {mockAccountData.totalClicks.toLocaleString()} / 10,000 clicks
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
                <span className="font-bold">{mockAccountData.totalEarnings}</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Withdrawals are typically processed within 7 business days.
              </p>
            </div>
            
            <div className="flex gap-4">
              <Button
                type="submit"
                className="flex-1"
              >
                Request Withdrawal
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
        
        {mockAccountData.withdrawalHistory.length > 0 ? (
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
                {mockAccountData.withdrawalHistory.map((withdrawal) => (
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
    </div>
  );
};

export default Withdrawals;

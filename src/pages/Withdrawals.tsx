
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { DollarSign, Calendar, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp, CreditCard, Edit, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import LoadingLogo from '@/components/ui/loading-logo';

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

interface PaymentMethod {
  id: string;
  type: 'paypal' | 'upi' | 'crypto';
  details: string;
  is_default: boolean;
}

const withdrawalSchema = z.object({
  paymentMethodId: z.string().min(1, 'Please select a payment method'),
});

const paymentMethodSchema = z.object({
  type: z.enum(['paypal', 'upi', 'crypto']),
  details: z.string().min(1, 'Payment details are required'),
});

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;
type PaymentMethodFormData = z.infer<typeof paymentMethodSchema>;

const Withdrawals = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [isRequestingWithdrawal, setIsRequestingWithdrawal] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalHistory[]>([]);
  const [eligibility, setEligibility] = useState<WithdrawalEligibility | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isAddingPaymentMethod, setIsAddingPaymentMethod] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  
  const {
    register: registerWithdrawal,
    handleSubmit: handleWithdrawalSubmit,
    formState: { errors: withdrawalErrors, isSubmitting: isWithdrawalSubmitting },
    reset: resetWithdrawal,
  } = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
  });

  const {
    register: registerPaymentMethod,
    handleSubmit: handlePaymentMethodSubmit,
    watch: watchPaymentMethod,
    formState: { errors: paymentMethodErrors, isSubmitting: isPaymentMethodSubmitting },
    reset: resetPaymentMethod,
    setValue: setPaymentMethodValue,
  } = useForm<PaymentMethodFormData>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      type: 'paypal',
      details: '',
    },
  });
  
  const selectedPaymentMethodType = watchPaymentMethod('type');
  
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
        
        // Fetch payment methods (from user profile or a separate table if implemented)
        await fetchPaymentMethods();
        
        // Update state with fetched data
        setEligibility(eligibilityData[0]);
        setTotalEarnings(userStats[0]?.total_earnings || 0);
        
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

  const fetchPaymentMethods = async () => {
    // For now, we'll store payment methods in localStorage
    // In a real app, you'd want to store these in a secure database table
    const storedMethods = localStorage.getItem(`payment_methods_${profile?.id}`);
    if (storedMethods) {
      setPaymentMethods(JSON.parse(storedMethods));
    }
  };

  const savePaymentMethods = (methods: PaymentMethod[]) => {
    localStorage.setItem(`payment_methods_${profile?.id}`, JSON.stringify(methods));
    setPaymentMethods(methods);
  };

  const onWithdrawalSubmit = async (data: WithdrawalFormData) => {
    if (!profile || !eligibility) return;
    
    try {
      const selectedMethod = paymentMethods.find(m => m.id === data.paymentMethodId);
      if (!selectedMethod) {
        toast({
          title: "Error",
          description: "Selected payment method not found.",
          variant: "destructive",
        });
        return;
      }

      const amount = totalEarnings;
      
      // Insert withdrawal request
      const { error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: profile.id,
          click_count: eligibility.total_clicks,
          amount: amount,
          payment_method: selectedMethod.type,
          payment_details: selectedMethod.details
        });
        
      if (error) throw error;
      
      toast({
        title: "Success!",
        description: "Your withdrawal request has been submitted. All earnings will be removed from your account upon approval.",
      });
      
      // Refresh data
      window.location.reload();
    } catch (error: any) {
      console.error('Error requesting withdrawal:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to request withdrawal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const onPaymentMethodSubmit = async (data: PaymentMethodFormData) => {
    try {
      const newMethod: PaymentMethod = {
        id: editingPaymentMethod?.id || Date.now().toString(),
        type: data.type,
        details: data.details,
        is_default: paymentMethods.length === 0 || editingPaymentMethod?.is_default || false,
      };

      let updatedMethods;
      if (editingPaymentMethod) {
        updatedMethods = paymentMethods.map(m => 
          m.id === editingPaymentMethod.id ? newMethod : m
        );
      } else {
        updatedMethods = [...paymentMethods, newMethod];
      }

      savePaymentMethods(updatedMethods);
      
      toast({
        title: "Success!",
        description: `Payment method ${editingPaymentMethod ? 'updated' : 'added'} successfully.`,
      });

      resetPaymentMethod();
      setIsAddingPaymentMethod(false);
      setEditingPaymentMethod(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save payment method.",
        variant: "destructive",
      });
    }
  };

  const deletePaymentMethod = (methodId: string) => {
    const updatedMethods = paymentMethods.filter(m => m.id !== methodId);
    savePaymentMethods(updatedMethods);
    toast({
      title: "Success!",
      description: "Payment method deleted successfully.",
    });
  };

  const setDefaultPaymentMethod = (methodId: string) => {
    const updatedMethods = paymentMethods.map(m => ({
      ...m,
      is_default: m.id === methodId
    }));
    savePaymentMethods(updatedMethods);
    toast({
      title: "Success!",
      description: "Default payment method updated.",
    });
  };

  const paymentMethodLabels = {
    paypal: 'PayPal',
    upi: 'UPI',
    crypto: 'Cryptocurrency',
  };
  
  const paymentMethodPlaceholders = {
    paypal: 'Your PayPal email address',
    upi: 'Your UPI ID (e.g., username@upi)',
    crypto: 'Your wallet address',
  };

  const paymentMethodIcons = {
    paypal: '',
    upi: '',
    crypto: '',
  };

  if (isLoading) {
    return (
      <motion.div 
        className="flex justify-center items-center h-64"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <LoadingLogo size="md" />
      </motion.div>
    );
  }

  // Calculate days until withdrawal eligibility
  const daysUntilWithdrawal = Math.max(0, 30 - (eligibility?.days_since_signup || 0));
  const hasEarnings = totalEarnings > 0;
  const isEligibleByTime = (eligibility?.days_since_signup || 0) >= 30;
  const canWithdraw = hasEarnings && isEligibleByTime;

  const renderWithdrawalState = () => {
    if (!hasEarnings) {
      // State 1: Zero dollars - Show payment methods management
      return (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <CreditCard className="h-5 w-5" />
              Set Up Your Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-700 mb-4">
              You don't have any earnings yet. Set up your payment methods now so you're ready to withdraw when you start earning!
            </p>
            
            {paymentMethods.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <p className="text-blue-600 mb-4">No payment methods added yet</p>
                <Button 
                  onClick={() => setIsAddingPaymentMethod(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Payment Method
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{paymentMethodIcons[method.type]}</span>
                      <div>
                        <p className="font-medium">{paymentMethodLabels[method.type]}</p>
                        <p className="text-sm text-gray-500">{method.details}</p>
                        {method.is_default && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingPaymentMethod(method);
                          setPaymentMethodValue('type', method.type);
                          setPaymentMethodValue('details', method.details);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deletePaymentMethod(method.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button 
                  onClick={() => setIsAddingPaymentMethod(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Payment Method
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      );
    } else if (!isEligibleByTime) {
      // State 2: Has money but less than 30 days - Show hold period
      return (
        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Clock className="h-5 w-5" />
              Earnings On Hold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-amber-700">Your Current Earnings:</span>
                <span className="text-2xl font-bold text-amber-800">${totalEarnings.toFixed(2)}</span>
              </div>
              
              <div className="bg-amber-100 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <span className="font-medium text-amber-800">30-Day Hold Period</span>
                </div>
                <p className="text-amber-700 text-sm mb-3">
                  Your earnings are on hold for security reasons. You can withdraw after 30 days from your signup date.
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-600">Days since signup:</span>
                    <span className="font-medium text-amber-800">{eligibility?.days_since_signup || 0} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-600">Days remaining:</span>
                    <span className="font-medium text-amber-800">{daysUntilWithdrawal} days</span>
                  </div>
                  
                  <div className="w-full bg-amber-200 rounded-full h-2.5 mt-3">
                    <div 
                      className="bg-amber-600 h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(100, ((eligibility?.days_since_signup || 0) / 30) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="border-t border-amber-200 pt-4">
                <p className="text-sm text-amber-600 mb-2">
                  <strong>What happens when you withdraw:</strong>
                </p>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• All earnings (${totalEarnings.toFixed(2)}) will be sent to your payment method</li>
                  <li>• Processing typically takes 3-4 business days</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    } else {
      // State 3: Eligible for withdrawal
      return (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Ready to Withdraw
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-green-700">Available for Withdrawal:</span>
                <span className="text-3xl font-bold text-green-800">${totalEarnings.toFixed(2)}</span>
              </div>

              {paymentMethods.length === 0 ? (
                <div className="bg-green-100 p-4 rounded-lg text-center">
                  <CreditCard className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-green-700 mb-3">Please add a payment method first</p>
                  <Button 
                    onClick={() => setIsAddingPaymentMethod(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment Method
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleWithdrawalSubmit(onWithdrawalSubmit)} className="space-y-4">
                  <div>
                    <Label className="text-green-800 font-medium">Select Payment Method</Label>
                    <RadioGroup className="mt-2 space-y-2">
                      {paymentMethods.map((method) => (
                        <div key={method.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                          <input
                            type="radio"
                            id={method.id}
                            value={method.id}
                            {...registerWithdrawal('paymentMethodId')}
                            className="w-4 h-4 text-green-600"
                          />
                          <label htmlFor={method.id} className="flex items-center gap-3 cursor-pointer flex-1">
                            <span className="text-xl">{paymentMethodIcons[method.type]}</span>
                            <div>
                              <p className="font-medium">{paymentMethodLabels[method.type]}</p>
                              <p className="text-sm text-gray-500">{method.details}</p>
                              {method.is_default && (
                                <Badge variant="secondary" className="text-xs">Default</Badge>
                              )}
                            </div>
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                    {withdrawalErrors.paymentMethodId && (
                      <p className="mt-1 text-sm text-red-500">{withdrawalErrors.paymentMethodId.message}</p>
                    )}
                  </div>

                  <div className="bg-green-100 p-4 rounded-lg">
                    <p className="text-sm text-green-700 mb-2">
                      <strong>⚠️ Important:</strong>
                    </p>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• All earnings (${totalEarnings.toFixed(2)}) will be withdrawn</li>
                      <li>• Processing takes 3-4 business days</li>
                      <li>• This action cannot be undone</li>
                    </ul>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={isWithdrawalSubmitting}
                  >
                    {isWithdrawalSubmitting ? 'Processing...' : `Withdraw $${totalEarnings.toFixed(2)}`}
                  </Button>
                </form>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }
  };

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
          Manage your earnings and withdrawal methods
        </p>
      </motion.div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-500 text-sm">TOTAL POINTS</h3>
            <p className="text-3xl font-bold mt-1">{eligibility?.total_clicks?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-500 text-sm">TOTAL EARNINGS</h3>
            <p className="text-3xl font-bold mt-1">${totalEarnings.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-2">$0.10 per point</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-500 text-sm">ACCOUNT STATUS</h3>
            <p className="text-lg font-bold mt-1">
              {!hasEarnings ? (
                <span className="text-blue-600">Getting Started</span>
              ) : !isEligibleByTime ? (
                <span className="text-amber-600">Hold Period</span>
              ) : (
                <span className="text-green-600">Ready to Withdraw</span>
              )}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {eligibility?.days_since_signup || 0} days since signup
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Withdrawal State */}
      {renderWithdrawalState()}

      {/* Payment Method Dialog */}
      <Dialog open={isAddingPaymentMethod || !!editingPaymentMethod} onOpenChange={(open) => {
        if (!open) {
          setIsAddingPaymentMethod(false);
          setEditingPaymentMethod(null);
          resetPaymentMethod();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPaymentMethod ? 'Edit Payment Method' : 'Add Payment Method'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePaymentMethodSubmit(onPaymentMethodSubmit)} className="space-y-4">
            <div>
              <Label>Payment Method Type</Label>
              <RadioGroup className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="paypal"
                    value="paypal"
                    {...registerPaymentMethod('type')}
                  />
                  <Label htmlFor="paypal">PayPal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="upi"
                    value="upi"
                    {...registerPaymentMethod('type')}
                  />
                  <Label htmlFor="upi">UPI (India)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="crypto"
                    value="crypto"
                    {...registerPaymentMethod('type')}
                  />
                  <Label htmlFor="crypto">Cryptocurrency</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <Label htmlFor="details">
                {selectedPaymentMethodType && `${paymentMethodLabels[selectedPaymentMethodType]} Details`}
              </Label>
              <Input
                id="details"
                placeholder={selectedPaymentMethodType && paymentMethodPlaceholders[selectedPaymentMethodType]}
                {...registerPaymentMethod('details')}
              />
              {paymentMethodErrors.details && (
                <p className="mt-1 text-sm text-red-500">{paymentMethodErrors.details.message}</p>
              )}
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={isPaymentMethodSubmitting}
              >
                {isPaymentMethodSubmitting ? 'Saving...' : (editingPaymentMethod ? 'Update' : 'Add')} Payment Method
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddingPaymentMethod(false);
                  setEditingPaymentMethod(null);
                  resetPaymentMethod();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Withdrawal History */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
        </CardHeader>
        <CardContent>
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
                        <Badge className={
                          withdrawal.status === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : withdrawal.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }>
                          {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No withdrawal history yet
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Withdrawals;

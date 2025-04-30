
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface WithdrawalRequest {
  id: string;
  user_id: string;
  username: string;
  email: string;
  amount: number;
  payment_method: string; // Changed from enum type to string to match Supabase response
  payment_details: string;
  status: string; // Changed from enum to string to match Supabase response
  created_at: string;
  admin_message?: string;
}

const AdminWithdrawalRequests = () => {
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  
  useEffect(() => {
    const fetchWithdrawals = async () => {
      try {
        setIsLoading(true);
        
        // Get all withdrawal requests with username
        const { data, error } = await supabase
          .from('withdrawals')
          .select(`
            *,
            users:user_id (
              username,
              email
            )
          `)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (!data || data.length === 0) {
          setWithdrawals([]);
          setIsLoading(false);
          return;
        }
        
        // Format data
        const formattedData: WithdrawalRequest[] = data.map(item => ({
          id: item.id,
          user_id: item.user_id,
          username: item.users?.username || 'Unknown',
          email: item.users?.email || 'Unknown',
          amount: item.amount,
          payment_method: item.payment_method,
          payment_details: item.payment_details,
          status: item.status,
          created_at: item.created_at,
          admin_message: item.admin_message
        }));
        
        setWithdrawals(formattedData);
      } catch (error) {
        console.error('Error fetching withdrawals:', error);
        toast({
          title: "Error",
          description: "Failed to load withdrawal requests. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWithdrawals();
  }, [toast]);
  
  const updateWithdrawalStatus = async (status: 'approved' | 'rejected') => {
    if (!selectedWithdrawal) return;
    
    try {
      // Update withdrawal status
      const { error } = await supabase
        .from('withdrawals')
        .update({
          status,
          admin_message: statusMessage
        })
        .eq('id', selectedWithdrawal.id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Withdrawal request has been ${status}.`,
      });
      
      // Update local state
      setWithdrawals(prev => prev.map(w => 
        w.id === selectedWithdrawal.id 
          ? { ...w, status, admin_message: statusMessage } 
          : w
      ));
      
      // Close modal
      setSelectedWithdrawal(null);
      setStatusMessage('');
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
      toast({
        title: "Error",
        description: "Failed to update withdrawal status.",
        variant: "destructive",
      });
    }
  };
  
  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'paypal': return 'PayPal';
      case 'upi': return 'UPI';
      case 'crypto': return 'Cryptocurrency';
      default: return method;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-partner-purple border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Withdrawal Requests</h2>
      </div>
      
      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {withdrawals.length > 0 ? (
              withdrawals.map((withdrawal) => (
                <tr key={withdrawal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">@{withdrawal.username}</div>
                    <div className="text-xs text-gray-500">{withdrawal.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(withdrawal.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium">${withdrawal.amount.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatPaymentMethod(withdrawal.payment_method)}</div>
                    <div className="text-xs text-gray-500 truncate max-w-xs" title={withdrawal.payment_details}>
                      {withdrawal.payment_details}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
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
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={withdrawal.status !== 'pending'}
                      onClick={() => setSelectedWithdrawal(withdrawal)}
                    >
                      Review
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                  No withdrawal requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">Review Withdrawal Request</h3>
              <button 
                className="text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setSelectedWithdrawal(null);
                  setStatusMessage('');
                }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500">User</h4>
                <p className="mt-1">@{selectedWithdrawal.username}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Amount</h4>
                <p className="mt-1 font-semibold">${selectedWithdrawal.amount.toFixed(2)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Payment Method</h4>
                <p className="mt-1">{formatPaymentMethod(selectedWithdrawal.payment_method)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Payment Details</h4>
                <p className="mt-1">{selectedWithdrawal.payment_details}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Requested On</h4>
                <p className="mt-1">{new Date(selectedWithdrawal.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Message
              </label>
              <Textarea
                value={statusMessage}
                onChange={(e) => setStatusMessage(e.target.value)}
                placeholder="Add a message for the user (optional)"
                className="w-full"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => updateWithdrawalStatus('rejected')}
              >
                Reject
              </Button>
              <Button 
                onClick={() => updateWithdrawalStatus('approved')}
              >
                Approve
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWithdrawalRequests;


import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import AdminWithdrawalRequests from '@/components/admin/AdminWithdrawalRequests';
import AdminUsersList from '@/components/admin/AdminUsersList';
import AdminMessages from '@/components/admin/AdminMessages';

const Admin = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'users' | 'withdrawals' | 'messages'>('users');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!profile) return;
      
      try {
        setIsLoading(true);
        
        // Check if user is admin
        const { data, error } = await supabase
          .rpc('is_admin');
          
        if (error) throw error;
        
        setIsAdmin(data ?? false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [profile]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-partner-purple border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAdmin) {
    toast({
      title: "Access denied",
      description: "You don't have permission to access the admin area.",
      variant: "destructive",
    });
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Manage users, withdrawals, and system settings
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex space-x-4 border-b">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'users' 
                ? 'text-partner-purple border-b-2 border-partner-purple' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'withdrawals' 
                ? 'text-partner-purple border-b-2 border-partner-purple' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('withdrawals')}
          >
            Withdrawal Requests
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'messages' 
                ? 'text-partner-purple border-b-2 border-partner-purple' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('messages')}
          >
            Messages
          </button>
        </div>
        
        <div className="mt-6">
          {activeTab === 'users' ? (
            <AdminUsersList />
          ) : activeTab === 'withdrawals' ? (
            <AdminWithdrawalRequests />
          ) : (
            <AdminMessages />
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;

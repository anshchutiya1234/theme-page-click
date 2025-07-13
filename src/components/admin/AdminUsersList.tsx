import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, UserX, Search, Mail, Instagram, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import LoadingLogo from '@/components/ui/loading-logo';

interface UserData {
  id: string;
  name: string;
  username: string;
  email: string;
  instagram_username: string;
  partner_code: string;
  referred_by: string | null;
  joined_at: string;
  direct_clicks: number;
  bonus_clicks: number;
  total_earnings: number;
  sub_partners_count: number;
  is_admin: boolean; // Added missing is_admin property
}

const AdminUsersList = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        
        // Get all users
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .order('joined_at', { ascending: false });
          
        if (usersError) throw usersError;
        
        if (!usersData || usersData.length === 0) {
          setUsers([]);
          setFilteredUsers([]);
          setIsLoading(false);
          return;
        }
        
        // For each user, get their stats
        const usersWithStats = await Promise.all(
          usersData.map(async (user) => {
            const { data: statsData, error: statsError } = await supabase
              .rpc('get_user_stats', { user_id: user.id });
              
            if (statsError) throw statsError;
            
            const stats = statsData[0] || {
              direct_clicks: 0,
              bonus_clicks: 0,
              total_earnings: 0,
              sub_partners_count: 0
            };
            
            return {
              ...user,
              direct_clicks: stats.direct_clicks,
              bonus_clicks: stats.bonus_clicks,
              total_earnings: stats.total_earnings,
              sub_partners_count: stats.sub_partners_count
            };
          })
        );
        
        setUsers(usersWithStats);
        setFilteredUsers(usersWithStats);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to load users data. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, [toast]);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (!term) {
      setFilteredUsers(users);
      return;
    }
    
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.username.toLowerCase().includes(term) ||
      user.partner_code.toLowerCase().includes(term) ||
      (user.referred_by && user.referred_by.toLowerCase().includes(term))
    );
    
    setFilteredUsers(filtered);
  };
  
  const makeAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_admin: true })
        .eq('id', userId);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "User has been granted admin privileges.",
      });
      
      // Update local state
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: true } : u));
      setFilteredUsers(prev => prev.map(u => u.id === userId ? { ...u, is_admin: true } : u));
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, is_admin: true } : null);
      }
    } catch (error: any) {
      console.error('Error making user admin:', error);
      toast({
        title: "Error",
        description: "Failed to update user privileges.",
        variant: "destructive",
      });
    }
  };
  
  const viewUserDetails = (user: UserData) => {
    setSelectedUser(user);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingLogo size="md" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h2 className="text-xl font-semibold">All Users</h2>
        <div className="w-64">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>
      
      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner Code</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referred By</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.partner_code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.referred_by || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">${user.total_earnings?.toFixed(2) || '0.00'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                      onClick={() => viewUserDetails(user)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
              <button 
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setSelectedUser(null)}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Username</h4>
                <p className="mt-1">@{selectedUser.username}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Email</h4>
                <p className="mt-1">{selectedUser.email}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Instagram</h4>
                <p className="mt-1">@{selectedUser.instagram_username}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Joined On</h4>
                <p className="mt-1">{new Date(selectedUser.joined_at).toLocaleDateString()}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Partner Code</h4>
                <p className="mt-1">{selectedUser.partner_code}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Referred By</h4>
                <p className="mt-1">{selectedUser.referred_by || 'None'}</p>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-6">
              <h4 className="font-medium mb-3">Performance</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Direct Clicks</h5>
                  <p className="mt-1">{selectedUser.direct_clicks?.toLocaleString() || '0'}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Bonus Clicks</h5>
                  <p className="mt-1">{selectedUser.bonus_clicks?.toLocaleString() || '0'}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Total Earnings</h5>
                  <p className="mt-1">${selectedUser.total_earnings?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Sub-Partners</h5>
                  <p className="mt-1">{selectedUser.sub_partners_count || '0'}</p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium mb-3">Admin Actions</h4>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={selectedUser.is_admin}
                  onClick={() => makeAdmin(selectedUser.id)}
                >
                  {selectedUser.is_admin ? 'Admin User' : 'Make Admin'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersList;

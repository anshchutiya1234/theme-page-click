
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UnreadMessagesIndicatorProps {
  className?: string;
}

const UnreadMessagesIndicator = ({ className }: UnreadMessagesIndicatorProps) => {
  const { profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile) return;

    // Fetch initial unread count
    const fetchUnreadCount = async () => {
      try {
        const { data, error } = await supabase.rpc('get_unread_messages_count', {
          user_id: profile.id
        });
        
        if (error) throw error;
        
        setUnreadCount(data || 0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };
    
    fetchUnreadCount();
    
    // Subscribe to new messages
    const channel = supabase
      .channel('messages-count')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${profile.id}`,
        },
        () => {
          // Increment unread count
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: 'is_broadcast=eq.true',
        },
        (payload) => {
          // Increment unread count for broadcasts if not from me
          if (payload.new.sender_id !== profile.id) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${profile.id}`,
        },
        (payload) => {
          // Decrement unread count if message was marked as read
          if (payload.old.is_read === false && payload.new.is_read === true) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  if (unreadCount === 0) return null;

  return (
    <div className={`bg-red-500 text-white rounded-full text-xs flex items-center justify-center ${className || 'h-5 w-5'}`}>
      {unreadCount > 9 ? '9+' : unreadCount}
    </div>
  );
};

export default UnreadMessagesIndicator;

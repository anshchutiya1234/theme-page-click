
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Send } from 'lucide-react';
import LoadingLogo from '@/components/ui/loading-logo';

interface Message {
  id: string;
  sender_id: string | null;
  receiver_id: string | null;
  content: string;
  created_at: string;
  is_admin: boolean;
  is_broadcast: boolean;
  is_read: boolean;
}

const Messages = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Fetch messages
  useEffect(() => {
    if (!profile) return;
    
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id},and(is_broadcast.eq.true,receiver_id.is.null)`)
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        
        setMessages(data || []);
        
        // Mark messages as read
        const unreadMessages = data?.filter(msg => 
          !msg.is_read && 
          msg.sender_id !== profile.id
        ) || [];
        
        if (unreadMessages.length > 0) {
          await Promise.all(
            unreadMessages.map(msg => 
              supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', msg.id)
            )
          );
        }
      } catch (error: any) {
        console.error('Error fetching messages:', error);
        toast({
          title: "Error",
          description: "Failed to load messages. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessages();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${profile.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages(prev => [...prev, payload.new as Message]);
            
            // Mark new message as read
            if (payload.new.sender_id !== profile.id) {
              supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', payload.new.id);
                
              toast({
                title: "New Message",
                description: "You have received a new message",
              });
            }
          }
        }
      )
      .subscribe();
      
    // Also listen for broadcast messages
    const broadcastChannel = supabase
      .channel('broadcast-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: 'is_broadcast=eq.true',
        },
        (payload) => {
          if (payload.new.sender_id !== profile.id) {
            setMessages(prev => [...prev, payload.new as Message]);
            
            // Mark broadcast message as read
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', payload.new.id);
              
            toast({
              title: "Announcement",
              description: "You have received a new announcement",
            });
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [profile, toast]);
  
  const sendMessage = async () => {
    if (!newMessage.trim() || !profile) return;
    
    try {
      setIsSending(true);
      
      // Find admin users to send to
      const { data: adminUsers, error: adminError } = await supabase
        .from('users')
        .select('id')
        .eq('is_admin', true)
        .limit(1);
        
      if (adminError) throw adminError;
      
      if (!adminUsers || adminUsers.length === 0) {
        toast({
          title: "Error",
          description: "No admin available to receive your message.",
          variant: "destructive",
        });
        return;
      }
      
      const adminId = adminUsers[0].id;
      
      // Insert message
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: profile.id,
          receiver_id: adminId,
          content: newMessage,
          is_admin: false,
          is_broadcast: false,
          is_read: false,
        });
        
      if (error) throw error;
      
      setNewMessage('');
      toast({
        title: "Message sent",
        description: "Your message has been sent to the admin",
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingLogo size="md" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-gray-500 mt-1">
          Contact support or view announcements
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Your Messages</h2>
        </div>
        
        {/* Messages Area */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No messages yet</p>
            </div>
          ) : (
            messages.map(message => {
              const isFromMe = message.sender_id === profile?.id;
              const messageClass = isFromMe 
                ? "bg-blue-100 ml-auto" 
                : message.is_broadcast 
                  ? "bg-orange-50" 
                  : "bg-gray-100";
                  
              return (
                <div 
                  key={message.id} 
                  className={`max-w-[80%] rounded-lg p-3 ${messageClass}`}
                >
                  {message.is_broadcast && (
                    <div className="font-semibold text-orange-600 text-xs mb-1">
                      ANNOUNCEMENT
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {format(new Date(message.created_at), 'MMM d, h:mm a')}
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea 
              placeholder="Write your message here..." 
              className="flex-1 min-h-[80px]"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  sendMessage();
                }
              }}
            />
            <Button 
              className="self-end"
              disabled={!newMessage.trim() || isSending}
              onClick={sendMessage}
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Press Ctrl+Enter to send
          </p>
        </div>
      </div>
    </div>
  );
};

export default Messages;

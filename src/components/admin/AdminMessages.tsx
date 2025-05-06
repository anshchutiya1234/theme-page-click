
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Send, Users } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

const AdminMessages = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'conversations' | 'broadcast'>('conversations');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch users with messaging history
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        
        // Get all users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, email, username')
          .eq('is_admin', false);
          
        if (userError) throw userError;
        
        if (!userData) {
          setUsers([]);
          setIsLoading(false);
          return;
        }
        
        // For each user, get their latest message
        const usersWithMessages = await Promise.all(
          userData.map(async (user) => {
            // Get the latest message for this user
            const { data: latestMessage, error: messageError } = await supabase
              .from('messages')
              .select('*')
              .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
              .order('created_at', { ascending: false })
              .limit(1);
              
            if (messageError) {
              console.error(`Error fetching messages for user ${user.id}:`, messageError);
              return user;
            }
            
            // Count unread messages
            const { count, error: countError } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('receiver_id', user.id)
              .eq('is_read', false)
              .eq('is_admin', true);
              
            if (countError) {
              console.error(`Error counting messages for user ${user.id}:`, countError);
              return {
                ...user,
                last_message: latestMessage?.[0]?.content || '',
                last_message_time: latestMessage?.[0]?.created_at || '',
                unread_count: 0
              };
            }
            
            return {
              ...user,
              last_message: latestMessage?.[0]?.content || '',
              last_message_time: latestMessage?.[0]?.created_at || '',
              unread_count: count || 0
            };
          })
        );
        
        // Sort users by latest message time
        const sortedUsers = usersWithMessages.sort((a, b) => {
          if (!a.last_message_time) return 1;
          if (!b.last_message_time) return -1;
          return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
        });
        
        setUsers(sortedUsers);
        
        // Select the first user if none is selected
        if (!selectedUser && sortedUsers.length > 0) {
          setSelectedUser(sortedUsers[0]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: "Failed to load users. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
    
    // Set up realtime subscription for new messages
    const channel = supabase
      .channel('admin-message-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          // Update users list with the new message
          setUsers(prevUsers => {
            const message = payload.new as Message;
            const userId = message.sender_id;
            
            // Find the user that sent/received the message
            const updatedUsers = prevUsers.map(user => {
              if (user.id === userId) {
                return {
                  ...user,
                  last_message: message.content,
                  last_message_time: message.created_at,
                  unread_count: (user.unread_count || 0) + (message.is_admin ? 0 : 1)
                };
              }
              return user;
            });
            
            // Sort users by latest message
            return [...updatedUsers].sort((a, b) => {
              if (!a.last_message_time) return 1;
              if (!b.last_message_time) return -1;
              return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
            });
          });
          
          // If message belongs to the selected conversation, add it
          if (selectedUser && 
              ((payload.new.sender_id === selectedUser.id) || 
               (payload.new.receiver_id === selectedUser.id))) {
            setMessages(prev => [...prev, payload.new as Message]);
            scrollToBottom();
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser, toast]);
  
  // Fetch messages for selected user
  useEffect(() => {
    if (!selectedUser) return;
    
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${selectedUser.id},receiver_id.eq.${selectedUser.id}`)
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        
        setMessages(data || []);
        
        // Mark messages as read
        const unreadMessages = data?.filter(msg => 
          !msg.is_read && 
          msg.sender_id === selectedUser.id
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
          
          // Update unread count in the UI
          setUsers(prevUsers => {
            return prevUsers.map(user => {
              if (user.id === selectedUser.id) {
                return {
                  ...user,
                  unread_count: 0
                };
              }
              return user;
            });
          });
        }
        
        scrollToBottom();
      } catch (error) {
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
  }, [selectedUser, toast]);
  
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    
    try {
      setIsSending(true);
      
      // Get admin's ID (current user)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");
      
      // Insert message
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedUser.id,
          content: newMessage,
          is_admin: true,
          is_broadcast: false,
          is_read: false,
        });
        
      if (error) throw error;
      
      setNewMessage('');
    } catch (error) {
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
  
  const sendBroadcastMessage = async (closeDialog: () => void) => {
    if (!broadcastMessage.trim()) return;
    
    try {
      setIsBroadcasting(true);
      
      // Get admin's ID (current user)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");
      
      // Insert broadcast message
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: null,
          content: broadcastMessage,
          is_admin: true,
          is_broadcast: true,
          is_read: false,
        });
        
      if (error) throw error;
      
      setBroadcastMessage('');
      closeDialog();
      
      toast({
        title: "Broadcast sent",
        description: "Your message has been sent to all users",
      });
    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast({
        title: "Error",
        description: "Failed to send broadcast message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBroadcasting(false);
    }
  };
  
  // Filter users based on search term
  const filteredUsers = searchTerm
    ? users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : users;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Messages</h1>
        <div className="flex mt-4 border-b">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'conversations' 
                ? 'text-partner-purple border-b-2 border-partner-purple' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('conversations')}
          >
            Conversations
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === 'broadcast' 
                ? 'text-partner-purple border-b-2 border-partner-purple' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('broadcast')}
          >
            Broadcast Message
          </button>
        </div>
      </div>
      
      {activeTab === 'conversations' ? (
        <div className="bg-white rounded-lg shadow-md grid grid-cols-3 h-[600px]">
          {/* User List */}
          <div className="border-r">
            <div className="p-3 border-b">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <ScrollArea className="h-[555px]">
              {isLoading && users.length === 0 ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin h-6 w-6 border-4 border-partner-purple border-t-transparent rounded-full"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No users found
                </div>
              ) : (
                filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedUser?.id === user.id ? 'bg-gray-100' : ''
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                      {user.unread_count ? (
                        <div className="bg-partner-purple text-white text-xs rounded-full px-2 py-0.5">
                          {user.unread_count}
                        </div>
                      ) : null}
                    </div>
                    {user.last_message && (
                      <div className="mt-1">
                        <div className="text-sm truncate text-gray-600">{user.last_message}</div>
                        {user.last_message_time && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            {format(new Date(user.last_message_time), 'MMM d, h:mm a')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </ScrollArea>
          </div>
          
          {/* Message Area */}
          <div className="col-span-2 flex flex-col">
            {selectedUser ? (
              <>
                <div className="p-3 border-b flex justify-between items-center">
                  <div>
                    <div className="font-medium">{selectedUser.name}</div>
                    <div className="text-sm text-gray-500">@{selectedUser.username}</div>
                  </div>
                </div>
                
                <ScrollArea className="flex-1 p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">No messages with this user</p>
                    </div>
                  ) : (
                    messages.map(message => {
                      // Check if the message is from the admin (current user)
                      const isFromAdmin = message.is_admin;
                      
                      const messageClass = isFromAdmin 
                        ? "bg-blue-100 ml-auto" 
                        : "bg-gray-100";
                        
                      return (
                        <div 
                          key={message.id} 
                          className={`max-w-[80%] rounded-lg p-3 ${messageClass}`}
                        >
                          <div className="text-sm">{message.content}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {format(new Date(message.created_at), 'MMM d, h:mm a')}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </ScrollArea>
                
                <div className="p-3 border-t">
                  <div className="flex gap-2">
                    <Textarea 
                      placeholder="Type your message..." 
                      className="flex-1"
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
                  <p className="text-xs text-gray-500 mt-1">
                    Press Ctrl+Enter to send
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-gray-400 mb-2">
                    <Users className="h-16 w-16 mx-auto" />
                  </div>
                  <p className="text-gray-500">Select a user to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Send Announcement to All Users</h2>
            <p className="text-gray-500 mb-4">
              This message will be sent to all users as a broadcast announcement.
            </p>
            
            <Textarea
              placeholder="Enter your announcement message..."
              className="min-h-[200px] mb-4"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
            />
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  className="w-full"
                  disabled={!broadcastMessage.trim()}
                >
                  Send Announcement to All Users
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Send Broadcast Announcement</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to send this message to all users?
                    This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="bg-gray-50 p-3 rounded-md max-h-[200px] overflow-y-auto">
                  <p className="whitespace-pre-wrap">{broadcastMessage}</p>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button 
                      onClick={(e) => {
                        // Get the DialogClose closest to the button
                        const closeButton = (e.target as HTMLElement)
                          .closest('button[data-state]');

                        // Get the dialog element
                        const dialog = closeButton?.closest('[data-state]');

                        // Create a function to close the dialog
                        const closeDialog = () => {
                          if (dialog) {
                            dialog.setAttribute('data-state', 'closed');
                            document.body.style.pointerEvents = '';
                          }
                        };
                        
                        sendBroadcastMessage(closeDialog);
                        e.preventDefault(); // Prevent the DialogClose from closing immediately
                      }}
                      disabled={isBroadcasting}
                    >
                      {isBroadcasting ? 'Sending...' : 'Send to All Users'}
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <p className="text-sm text-gray-500 mt-4">
              <strong>Note:</strong> This message will be visible to all users of the platform and will appear as an announcement.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;

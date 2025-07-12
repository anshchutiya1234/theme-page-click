
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface UserProfile {
  id: string;
  name: string;
  instagram_username: string;
  email: string;
  username: string;
  partner_code: string;
  referred_by: string | null;
  joined_at: string;
  is_admin: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Defer profile fetching to avoid potential deadlock issues
        if (currentSession?.user) {
          setTimeout(() => {
            fetchProfile(currentSession.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If user profile doesn't exist, try to create it
        if (error.code === 'PGRST116') {
          console.log('User profile not found, creating one...');
          await createMissingProfile(userId);
          return;
        }
        throw error;
      }
      
      setProfile(data as UserProfile);
    } catch (error: any) {
      console.error('Error fetching user profile:', error.message);
      setProfile(null);
    }
  };

  const createMissingProfile = async (userId: string) => {
    try {
      // Get user info from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Generate a unique partner code
      const partnerCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Create user profile
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          name: user.user_metadata?.name || 'User',
          username: `user_${userId.substring(0, 8)}`,
          email: user.email || '',
          instagram_username: user.user_metadata?.instagram_username || '',
          partner_code: partnerCode,
          referred_by: user.user_metadata?.referred_by || null,
          is_admin: false
        })
        .select()
        .single();

      if (error) throw error;
      
      setProfile(data as UserProfile);
      
      toast({
        title: "Profile Created",
        description: "Your user profile has been created successfully.",
      });
    } catch (error: any) {
      console.error('Error creating user profile:', error.message);
      toast({
        title: "Error",
        description: "Failed to create user profile. Please try refreshing the page.",
        variant: "destructive",
      });
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            instagram_username: userData.instagramUsername,
            referred_by: userData.referred_by,
          }
        }
      });

      if (error) throw error;
      
      toast({
        title: "Success!",
        description: "Your account has been created successfully.",
      });

      // Navigate to dashboard after signup
      if (data.session) {
        navigate('/dashboard');
      } else {
        // If email confirmation is required
        toast({
          title: "Email verification required",
          description: "Please check your email to complete the signup process.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      console.error('Signup error:', error);
      throw error; // Re-throw to allow handling in the form component
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "You've been logged in successfully.",
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error; // Re-throw to allow handling in the form component
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      navigate('/login');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

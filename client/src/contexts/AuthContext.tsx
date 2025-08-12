import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { User, Session, AuthError, PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import TrialManager from '../utils/trialManager';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ user: User | null; session: Session | null; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; session: Session | null; error: AuthError | null }>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: PostgrestError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  onSignOut: (() => void) | null;
  setOnSignOut: (callback: (() => void) | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [onSignOut, setOnSignOut] = useState<(() => void) | null>(null);
  const fetchProfileTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);

  // Debounced fetchProfile to prevent multiple rapid calls
  const fetchProfile = useCallback(async (userId?: string) => {
    if (isFetchingRef.current) {
      console.log('fetchProfile already in progress, skipping');
      return;
    }
    
    isFetchingRef.current = true;
    
    try {
      console.log('fetchProfile called');
      
      let userToUse = userId;
      
      // If no userId provided, try to get it from the current session
      if (!userToUse) {
        console.log('No userId provided, checking current session...');
        try {
          const { data: { session } } = await supabase.auth.getSession();
          userToUse = session?.user?.id;
          console.log('Session user ID:', userToUse);
        } catch (sessionError) {
          console.error('Error getting session:', sessionError);
          setLoading(false);
          return;
        }
      }
      
      if (!userToUse) {
        console.log('No user ID available');
        setLoading(false);
        return;
      }
      
      console.log('Using user ID:', userToUse);
      console.log('About to query profiles table...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userToUse)
        .single();

      console.log('Query result:', { data, error });

      if (error) {
        console.error('Error fetching profile:', error);
        console.error('Error details:', { code: error.code, message: error.message, details: error.details });
        // Don't clear the user state on database errors
        // Just log the error and keep the existing user data if available
        if (error.code === 'PGRST116') {
          console.log('Profile not found, this might be a new user');
        } else {
          console.log('Database error, but keeping user logged in');
        }
        setLoading(false);
        return;
      }

      console.log('Profile data fetched:', data);
      setUser(data);
      
      // Check if user is admin
      const userIsAdmin = data.role === 'admin';
      setIsAdmin(userIsAdmin);
      
      if (userIsAdmin) {
        console.log('🎉 User is ADMIN! Granting admin privileges...');
      } else {
        console.log('User role:', data.role);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      console.error('Full error object:', error);
      // Don't clear user state on errors, just set loading to false
      setLoading(false);
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  const debouncedFetchProfile = useCallback((userId?: string) => {
    if (fetchProfileTimeoutRef.current) {
      clearTimeout(fetchProfileTimeoutRef.current);
    }
    
    if (isFetchingRef.current) {
      console.log('fetchProfile already in progress, skipping');
      return;
    }
    
    fetchProfileTimeoutRef.current = setTimeout(() => {
      fetchProfile(userId);
    }, 300); // Increased delay to ensure Supabase client is ready
  }, [fetchProfile]);

  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session check:', session?.user?.id);
        
        if (session?.user) {
          console.log('Initial session found, fetching profile...');
          debouncedFetchProfile(session.user.id);
        } else {
          console.log('No initial session found');
          setLoading(false);
          setAuthLoading(false);
        }
      } catch (error) {
        console.error('Error checking initial session:', error);
        setLoading(false);
        setAuthLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          if (session?.user) {
            console.log('Session user found, fetching profile...');
            debouncedFetchProfile(session.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing state');
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
          setAuthLoading(false);
          
          // Call the onSignOut callback if it exists
          if (onSignOut) {
            onSignOut();
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      if (fetchProfileTimeoutRef.current) {
        clearTimeout(fetchProfileTimeoutRef.current);
      }
    };
  }, [onSignOut, debouncedFetchProfile]);

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    });

    if (data.user && !error) {
      // Wait a moment for the user to be fully created in auth.users
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create profile in profiles table
      const { error: profileError } = await supabase.rpc('create_profile', {
        p_id: data.user.id,
        p_name: name,
        p_email: email,
        p_bio: null,
        p_role: 'student'
      });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      } else {
        console.log('Profile created successfully');
        
        // Initialize 7-day free trial for new user
        try {
          await TrialManager.initializeTrial(data.user.id);
          console.log('✅ 7-day free trial initialized for new user');
        } catch (trialError) {
          console.error('Failed to initialize trial:', trialError);
          // Don't fail signup if trial initialization fails
        }
      }
    }

    return { user: data.user, session: data.session, error };
  };

  const signIn = async (email: string, password: string) => {
    console.log('signIn called with email:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log('signIn result:', { user: data.user?.id, session: !!data.session, error });
    
    // If sign in is successful, the profile will be fetched automatically
    // and admin status will be detected in the fetchProfile function
    if (data.user && !error) {
      console.log('✅ Sign in successful! Checking for admin privileges...');
    }
    
    return { user: data.user, session: data.session, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    
    // Call the onSignOut callback if it exists
    if (onSignOut) {
      onSignOut();
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: null };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error) {
      setUser({ ...user, ...updates });
    }

    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    isAdmin,
    signUp,
    signIn,
    signOut,
    fetchProfile,
    updateProfile,
    resetPassword,
    onSignOut,
    setOnSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

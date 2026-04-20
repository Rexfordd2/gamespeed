import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export type AuthSignInMethod = 'magic_link' | 'google';

interface AuthContextValue {
  isConfigured: boolean;
  isLoading: boolean;
  isProfileLoading: boolean;
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  signInWithProvider: (
    method: AuthSignInMethod,
    email?: string,
  ) => Promise<{ error: string | null }>;
  upsertProfile: (displayName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const PROFILE_NOT_FOUND_CODE = 'PGRST116';

const getAuthRedirectUrl = () => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return new URL(import.meta.env.BASE_URL, window.location.origin).toString();
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!supabase || !user) {
      setProfile(null);
      return;
    }

    setIsProfileLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, display_name, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle<UserProfile>();

    if (error && error.code !== PROFILE_NOT_FOUND_CODE) {
      console.error('Failed to fetch profile:', error.message);
      setProfile(null);
      setIsProfileLoading(false);
      return;
    }

    setProfile(data ?? null);
    setIsProfileLoading(false);
  }, [user]);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) {
          return;
        }
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Failed to restore auth session:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    void fetchProfile();
  }, [fetchProfile, user]);

  const signInWithProvider = useCallback(
    async (method: AuthSignInMethod, email?: string) => {
      if (!supabase) {
        return { error: 'Supabase auth is not configured yet.' };
      }

      if (method === 'google') {
        return {
          error:
            'Google sign-in is not enabled yet. Keep this method to add OAuth later.',
        };
      }

      const normalizedEmail = (email ?? '').trim().toLowerCase();
      if (!normalizedEmail) {
        return { error: 'Email is required.' };
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
        },
      });

      return { error: error?.message ?? null };
    },
    [],
  );

  const upsertProfile = useCallback(
    async (displayName: string) => {
      if (!supabase || !user) {
        return { error: 'You must be signed in first.' };
      }

      const normalizedDisplayName = displayName.trim();
      if (!normalizedDisplayName) {
        return { error: 'Display name is required.' };
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: user.email ?? '',
            display_name: normalizedDisplayName,
          },
          { onConflict: 'id' },
        )
        .select('id, email, display_name, created_at, updated_at')
        .single<UserProfile>();

      if (error) {
        return { error: error.message };
      }

      setProfile(data);
      return { error: null };
    },
    [user],
  );

  const signOut = useCallback(async () => {
    if (!supabase) {
      return { error: null };
    }

    const { error } = await supabase.auth.signOut();
    return { error: error?.message ?? null };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isConfigured: isSupabaseConfigured,
      isLoading,
      isProfileLoading,
      session,
      user,
      profile,
      signInWithProvider,
      upsertProfile,
      signOut,
      refreshProfile: fetchProfile,
    }),
    [
      fetchProfile,
      isLoading,
      isProfileLoading,
      profile,
      session,
      signInWithProvider,
      signOut,
      upsertProfile,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

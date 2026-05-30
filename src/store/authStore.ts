import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User } from '../types';

const DEMO_USER: User = {
  id: 'demo-user-id',
  email: 'demo@africa2027.com',
  full_name: 'Demo Traveler',
  role: 'traveler',
  created_at: new Date().toISOString(),
};

const DEMO_EMAIL = 'demo@africa2027.com';
const DEMO_PASSWORD = 'demo1234';

interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
  isDemoMode: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: any | null) => void;
  setLoading: (loading: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  isDemoMode: false,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),

  signIn: async (email, password) => {
    const trimmedEmail = email.trim().toLowerCase();

    const isDemoCredentials = trimmedEmail === DEMO_EMAIL && password === DEMO_PASSWORD;
    const noSupabase = !isSupabaseConfigured();

    if (isDemoCredentials) {
      set({ user: DEMO_USER, session: { access_token: 'demo' }, isDemoMode: true, loading: false });
      return { error: null };
    }

    if (noSupabase) {
      return {
        error: {
          message:
            'Supabase is not connected yet. Use demo@africa2027.com / demo1234 to preview the app.',
        },
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (!error && data.session) {
      set({ session: data.session, isDemoMode: false });
      await get().refreshUser();
    }
    return { error };
  },

  signUp: async (email, password, fullName) => {
    if (!isSupabaseConfigured()) {
      return {
        error: {
          message:
            'Supabase is not connected yet. Use demo@africa2027.com / demo1234 to preview the app.',
        },
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (!error && data.session) {
      set({ session: data.session, isDemoMode: false });
      await get().refreshUser();
    }
    return { error };
  },

  signOut: async () => {
    const { isDemoMode } = get();
    if (!isDemoMode) {
      await supabase.auth.signOut();
    }
    set({ user: null, session: null, isDemoMode: false });
  },

  refreshUser: async () => {
    if (get().isDemoMode) return;

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (data) {
      set({ user: data as User });
    } else {
      const newProfile: Partial<User> = {
        id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || authUser.email || '',
        role: 'traveler',
        created_at: new Date().toISOString(),
      };
      const { data: created } = await supabase.from('profiles').insert(newProfile).select().single();
      if (created) set({ user: created as User });
    }
  },
}));

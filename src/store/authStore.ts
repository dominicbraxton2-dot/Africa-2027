import { create } from 'zustand';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured, BUCKETS } from '../lib/supabase';
import { User } from '../types';

const TRIP_PASSWORD = '40Africa';
const AUTH_KEY = 'trip_auth_v2';

const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try { return localStorage.getItem(key); } catch { return null; }
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage.getItem(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try { localStorage.setItem(key, value); } catch {}
      return;
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem(key, value);
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try { localStorage.removeItem(key); } catch {}
      return;
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.removeItem(key);
  },
};

function generateUserId(): string {
  return 'local-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
}

type PersistedAuth = { isAuthenticated: boolean; needsProfileSetup: boolean; user: User | null };

function saveToStorage(data: PersistedAuth): void {
  storage.set(AUTH_KEY, JSON.stringify(data)).catch(() => {});
}

interface AuthState {
  isAuthenticated: boolean;
  needsProfileSetup: boolean;
  user: User | null;
  loading: boolean;
  // Legacy compat — kept so other screens compile without changes
  session: null;
  isDemoMode: boolean;

  initialize: () => Promise<void>;
  enterWithPassword: (password: string) => boolean;
  completeProfileSetup: (name: string, avatarUri?: string | null, avatarFile?: File | null) => Promise<void>;
  signOut: () => Promise<void>;
  updateAvatar: (avatarUrl: string) => void;
  updateName: (name: string) => void;
  // No-op kept for compatibility with screens that call it
  refreshUser: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setSession: (session: any) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  needsProfileSetup: false,
  user: null,
  loading: true,
  session: null,
  isDemoMode: false,

  setLoading: (loading) => set({ loading }),
  setSession: () => {},
  refreshUser: async () => {},

  initialize: async () => {
    try {
      const raw = await storage.get(AUTH_KEY);
      if (raw) {
        const saved: PersistedAuth = JSON.parse(raw);
        set({
          isAuthenticated: !!saved.isAuthenticated,
          needsProfileSetup: !!saved.needsProfileSetup,
          user: saved.user ?? null,
          isDemoMode: !!saved.isAuthenticated,
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  enterWithPassword: (password: string) => {
    if (password !== TRIP_PASSWORD) return false;
    const userId = generateUserId();
    const user: User = {
      id: userId,
      email: '',
      full_name: '',
      role: 'traveler',
      created_at: new Date().toISOString(),
    };
    set({ isAuthenticated: true, needsProfileSetup: true, user, isDemoMode: true });
    saveToStorage({ isAuthenticated: true, needsProfileSetup: true, user });
    return true;
  },

  completeProfileSetup: async (name, avatarUri, avatarFile) => {
    const { user } = get();
    if (!user) return;

    let avatarUrl: string | undefined;

    if (avatarUri && isSupabaseConfigured()) {
      try {
        let blob: Blob;
        if (avatarFile instanceof File) {
          blob = avatarFile;
        } else {
          const resp = await fetch(avatarUri);
          blob = await resp.blob();
        }
        const ext = blob.type.includes('png') ? 'png' : 'jpg';
        const path = `${user.id}.${ext}`;
        const { error } = await supabase.storage
          .from(BUCKETS.PROFILE_PICTURES)
          .upload(path, blob, { upsert: true });
        if (!error) {
          const { data: { publicUrl } } = supabase.storage
            .from(BUCKETS.PROFILE_PICTURES)
            .getPublicUrl(path);
          avatarUrl = `${publicUrl}?t=${Date.now()}`;
        }
      } catch {}
    }

    const updatedUser: User = { ...user, full_name: name.trim(), avatar_url: avatarUrl };
    set({ user: updatedUser, needsProfileSetup: false, isDemoMode: true });
    saveToStorage({ isAuthenticated: true, needsProfileSetup: false, user: updatedUser });
  },

  signOut: async () => {
    set({ isAuthenticated: false, needsProfileSetup: false, user: null, isDemoMode: false, session: null });
    await storage.remove(AUTH_KEY);
  },

  updateAvatar: (avatarUrl: string) => {
    const { user } = get();
    if (!user) return;
    const updated = { ...user, avatar_url: avatarUrl };
    set({ user: updated });
    saveToStorage({ isAuthenticated: true, needsProfileSetup: false, user: updated });
  },

  updateName: (name: string) => {
    const { user } = get();
    if (!user) return;
    const updated = { ...user, full_name: name };
    set({ user: updated });
    saveToStorage({ isAuthenticated: true, needsProfileSetup: false, user: updated });
  },
}));

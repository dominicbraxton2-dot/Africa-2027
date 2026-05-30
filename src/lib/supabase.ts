import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Returns true only when real Supabase credentials are injected at build time.
export function isSupabaseConfigured(): boolean {
  return (
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('placeholder') &&
    supabaseAnonKey.length > 20
  );
}

// On web, Supabase uses its built-in localStorage adapter.
// On native, we use AsyncStorage so sessions persist across app restarts.
const authStorage = Platform.OS === 'web' ? undefined : AsyncStorage;

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: authStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  }
);

export const TABLES = {
  USERS: 'users',
  TRAVELER_PROFILES: 'traveler_profiles',
  DOCUMENTS: 'trip_documents',
  EXPENSES: 'expenses',
  EXPENSE_SPLITS: 'expense_splits',
  SETTLEMENTS: 'settlements',
  MEMORIES: 'memories',
  NOTIFICATIONS: 'notifications',
};

export const BUCKETS = {
  DOCUMENTS: 'trip-documents',
  RECEIPTS: 'receipts',
  AVATARS: 'avatars',
  MEMORIES: 'memories',
};

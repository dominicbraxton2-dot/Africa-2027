import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export function isSupabaseConfigured(): boolean {
  return (
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('placeholder') &&
    supabaseAnonKey.length > 20
  );
}

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
  PROFILES: 'profiles',
  TRAVELERS: 'travelers',
  ANNOUNCEMENTS: 'announcements',
  ITINERARIES: 'itineraries',
  ITINERARY_DAYS: 'itinerary_days',
  EXPENSES: 'expenses',
  EXPENSE_PARTICIPANTS: 'expense_participants',
  RECEIPTS: 'receipts',
  SETTLEMENTS: 'settlements',
};

export const BUCKETS = {
  ITINERARIES: 'itineraries',
  RECEIPTS: 'receipts',
  AVATARS: 'avatars',
  MEMORIES: 'memories',
};

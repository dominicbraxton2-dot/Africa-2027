import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

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

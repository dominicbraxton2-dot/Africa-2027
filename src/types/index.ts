export type UserRole = 'admin' | 'traveler';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  instagram?: string;
  created_at: string;
  updated_at?: string;
}

export interface Traveler {
  id: string;
  profile_id: string;
  passport_number?: string;
  nationality?: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  emergency_contact_phone?: string;
  emergency_contact_email?: string;
  allergies?: string;
  medications?: string;
  blood_type?: string;
  dietary_restrictions?: string;
  created_at: string;
  updated_at?: string;
}

export interface Announcement {
  id: string;
  author_id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'emergency' | 'flight' | 'schedule';
  pinned: boolean;
  created_at: string;
}

export type ItineraryCategory = 'flights' | 'hotels' | 'excursions' | 'transportation' | 'general';

export interface Itinerary {
  id: string;
  title: string;
  description?: string;
  destination: 'zanzibar' | 'cape_town' | 'both';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  category: ItineraryCategory;
  start_date?: string;
  end_date?: string;
  uploaded_by?: string;
  created_at: string;
}

export interface ItineraryDay {
  id: string;
  itinerary_id: string;
  day_date: string;
  day_number: number;
  title: string;
  description?: string;
  location?: string;
  destination: 'zanzibar' | 'cape_town' | 'transit';
  activities: any[];
  meals: Record<string, any>;
  accommodation?: string;
  notes?: string;
  created_at: string;
}

export type ExpenseCategory =
  | 'dining'
  | 'transportation'
  | 'excursions'
  | 'shopping'
  | 'lodging'
  | 'tips'
  | 'miscellaneous';

export type SplitType = 'equal' | 'percentage' | 'custom';

export interface ExpenseParticipant {
  id?: string;
  expense_id?: string;
  profile_id: string;
  amount: number;
  percentage?: number;
  is_settled: boolean;
  settled_at?: string;
}

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount_usd: number;
  original_amount?: number;
  original_currency?: string;
  exchange_rate?: number;
  destination?: 'zanzibar' | 'cape_town';
  paid_by: string;
  split_type: SplitType;
  receipt_url?: string;
  notes?: string;
  expense_date: string;
  created_at: string;
  participants?: ExpenseParticipant[];
}

export interface ReceiptData {
  merchant?: string;
  date?: string;
  currency?: string;
  total?: number;
  line_items?: Array<{ description: string; amount: number }>;
  raw_text?: string;
}

export type SettlementMethod = 'cash' | 'zelle' | 'venmo' | 'paypal' | 'other';

export interface Settlement {
  id: string;
  from_id: string;
  to_id: string;
  amount: number;
  method: SettlementMethod;
  notes?: string;
  settled_at: string;
  created_at: string;
}

export interface Balance {
  user_id: string;
  user_name: string;
  amount: number; // positive = owed to you, negative = you owe
}

export interface MemoryItem {
  id: string;
  profile_id: string;
  type: 'photo' | 'video' | 'note';
  file_url?: string;
  note?: string;
  destination: 'zanzibar' | 'cape_town';
  caption?: string;
  created_at: string;
}


export const CURRENCIES = {
  TZS: { name: 'Tanzanian Shilling', symbol: 'TZS', flag: '🇹🇿' },
  ZAR: { name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  USD: { name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  EUR: { name: 'Euro', symbol: '€', flag: '🇪🇺' },
  GBP: { name: 'British Pound', symbol: '£', flag: '🇬🇧' },
};

export const EXPENSE_CATEGORIES: Array<{
  key: ExpenseCategory;
  label: string;
  icon: string;
  color: string;
}> = [
  { key: 'dining', label: 'Dining', icon: '🍽️', color: '#E8643A' },
  { key: 'transportation', label: 'Transport', icon: '🚗', color: '#4A8CE8' },
  { key: 'excursions', label: 'Excursions', icon: '🤿', color: '#1A8C7A' },
  { key: 'shopping', label: 'Shopping', icon: '🛍️', color: '#C9A84C' },
  { key: 'lodging', label: 'Lodging', icon: '🏨', color: '#8B6F47' },
  { key: 'tips', label: 'Tips', icon: '💰', color: '#4CAF78' },
  { key: 'miscellaneous', label: 'Misc', icon: '📦', color: '#A09070' },
];

export const ITINERARY_CATEGORIES: Array<{
  key: ItineraryCategory;
  icon: string;
  label: string;
  color: string;
}> = [
  { key: 'flights', icon: '✈️', label: 'Flights', color: '#4A8CE8' },
  { key: 'hotels', icon: '🏨', label: 'Hotels', color: '#8B6F47' },
  { key: 'excursions', icon: '🤿', label: 'Excursions', color: '#1A8C7A' },
  { key: 'transportation', icon: '🚗', label: 'Transport', color: '#E8643A' },
  { key: 'general', icon: '📄', label: 'General', color: '#C9A84C' },
];

// ── Calendar Events ───────────────────────────────────────────────────────────

export type EventCategory =
  | 'flight'
  | 'hotel'
  | 'excursion'
  | 'transportation'
  | 'dining'
  | 'general';

export interface ItineraryEvent {
  id: string;
  title: string;
  event_date: string; // YYYY-MM-DD
  start_time?: string; // HH:MM (24h)
  end_time?: string;
  location?: string;
  category: EventCategory;
  notes?: string;
  source_document_id?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export const EVENT_CATEGORIES: Array<{
  key: EventCategory;
  label: string;
  icon: string;
  color: string;
}> = [
  { key: 'flight', label: 'Flight', icon: '✈️', color: '#4A8CE8' },
  { key: 'hotel', label: 'Hotel', icon: '🏨', color: '#8B6F47' },
  { key: 'excursion', label: 'Excursion', icon: '🤿', color: '#1B7F8A' },
  { key: 'transportation', label: 'Transport', icon: '🚗', color: '#E8643A' },
  { key: 'dining', label: 'Dining', icon: '🍽️', color: '#D88C2D' },
  { key: 'general', label: 'General', icon: '📅', color: '#C9A84C' },
];

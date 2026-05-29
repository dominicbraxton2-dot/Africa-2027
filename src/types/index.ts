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
}

export interface TravelerProfile {
  id: string;
  user_id: string;
  full_name: string;
  passport_number?: string;
  nationality?: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  emergency_contact_email?: string;
  allergies?: string;
  medications?: string;
  blood_type?: string;
  is_data_encrypted: boolean;
}

export type DocumentCategory = 'flights' | 'hotels' | 'activities' | 'transportation' | 'documents';

export interface TripDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  file_url: string;
  file_name: string;
  file_size?: number;
  uploaded_by: string;
  destination?: 'zanzibar' | 'cape_town' | 'both';
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

export interface ExpenseSplit {
  user_id: string;
  amount: number;
  percentage?: number;
  is_settled: boolean;
}

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount_usd: number;
  original_amount?: number;
  original_currency?: string;
  exchange_rate?: number;
  receipt_url?: string;
  receipt_data?: ReceiptData;
  paid_by: string;
  split_type: SplitType;
  splits: ExpenseSplit[];
  destination?: 'zanzibar' | 'cape_town';
  date: string;
  notes?: string;
  created_at: string;
  is_synced: boolean;
}

export interface ReceiptData {
  merchant?: string;
  date?: string;
  currency?: string;
  total?: number;
  line_items?: Array<{ description: string; amount: number }>;
  raw_text?: string;
}

export type SettlementMethod = 'cash' | 'zelle' | 'venmo' | 'paypal';

export interface Settlement {
  id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  method: SettlementMethod;
  date: string;
  notes?: string;
  created_at: string;
}

export interface Balance {
  user_id: string;
  user_name: string;
  amount: number; // positive = owed to you, negative = you owe
}

export interface Notification {
  id: string;
  type: 'itinerary' | 'expense' | 'balance' | 'reminder' | 'departure';
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface MemoryItem {
  id: string;
  user_id: string;
  type: 'photo' | 'video' | 'note';
  file_url?: string;
  note?: string;
  destination: 'zanzibar' | 'cape_town';
  caption?: string;
  created_at: string;
}

export interface EmergencyInfo {
  destination: 'zanzibar' | 'cape_town';
  police: string;
  ambulance: string;
  embassy_name: string;
  embassy_phone: string;
  embassy_address: string;
  embassy_hours?: string;
}

export const EMERGENCY_INFO: EmergencyInfo[] = [
  {
    destination: 'zanzibar',
    police: '+255 24 223 3060',
    ambulance: '+255 24 223 2222',
    embassy_name: 'U.S. Embassy Dar es Salaam',
    embassy_phone: '+255 22 229 4000',
    embassy_address: '686 Old Bagamoyo Rd, Msasani, Dar es Salaam',
    embassy_hours: 'Mon–Fri 7:30am–4:30pm',
  },
  {
    destination: 'cape_town',
    police: '10111',
    ambulance: '10177',
    embassy_name: 'U.S. Consulate Cape Town',
    embassy_phone: '+27 21 702 7300',
    embassy_address: '2 Reddam Ave, Westlake, Cape Town 7945',
    embassy_hours: 'Mon–Fri 8:00am–4:30pm',
  },
];

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

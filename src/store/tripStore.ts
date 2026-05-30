import { create } from 'zustand';
import { Platform } from 'react-native';
import { supabase, TABLES, BUCKETS } from '../lib/supabase';
import { Itinerary, Expense, Settlement, Balance, MemoryItem, ExpenseParticipant } from '../types';

// Platform-safe cache using AsyncStorage on native, localStorage on web
const cache = {
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
};

const CACHE_KEYS = {
  ITINERARIES: 'cached_itineraries',
  EXPENSES: 'cached_expenses',
  PROFILES: 'cached_profiles',
};

interface TripState {
  itineraries: Itinerary[];
  expenses: Expense[];
  settlements: Settlement[];
  balances: Balance[];
  memories: MemoryItem[];
  allUsers: any[];

  fetchItineraries: () => Promise<void>;
  fetchExpenses: () => Promise<void>;
  fetchAllUsers: () => Promise<void>;
  fetchBalances: (currentUserId: string) => Promise<void>;
  fetchMemories: () => Promise<void>;
  fetchSettlements: () => Promise<void>;

  addExpense: (expense: Omit<Expense, 'id' | 'created_at'> & { participants: ExpenseParticipant[] }) => Promise<void>;
  addSettlement: (settlement: Omit<Settlement, 'id' | 'created_at'>) => Promise<void>;
  uploadItinerary: (file: any, metadata: Partial<Itinerary>) => Promise<void>;
  addMemory: (memory: Omit<MemoryItem, 'id' | 'created_at'>) => Promise<void>;
  deleteItinerary: (id: string) => Promise<void>;

  // Deprecated aliases kept for backward compat with screens
  documents: Itinerary[];
  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: any, metadata: Partial<Itinerary>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

export const useTripStore = create<TripState>((set, get) => ({
  itineraries: [],
  documents: [],
  expenses: [],
  settlements: [],
  balances: [],
  memories: [],
  allUsers: [],

  fetchAllUsers: async () => {
    const { data } = await supabase
      .from(TABLES.PROFILES)
      .select('*')
      .order('full_name');
    if (data) {
      set({ allUsers: data });
      await cache.set(CACHE_KEYS.PROFILES, JSON.stringify(data));
    } else {
      const cached = await cache.get(CACHE_KEYS.PROFILES);
      if (cached) set({ allUsers: JSON.parse(cached) });
    }
  },

  fetchItineraries: async () => {
    const { data } = await supabase
      .from(TABLES.ITINERARIES)
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      set({ itineraries: data as Itinerary[], documents: data as Itinerary[] });
      await cache.set(CACHE_KEYS.ITINERARIES, JSON.stringify(data));
    } else {
      const cached = await cache.get(CACHE_KEYS.ITINERARIES);
      if (cached) {
        const parsed = JSON.parse(cached);
        set({ itineraries: parsed, documents: parsed });
      }
    }
  },

  fetchDocuments: async () => {
    return get().fetchItineraries();
  },

  fetchExpenses: async () => {
    const { data } = await supabase
      .from(TABLES.EXPENSES)
      .select(`*, participants:${TABLES.EXPENSE_PARTICIPANTS}(*)`)
      .order('expense_date', { ascending: false });
    if (data) {
      set({ expenses: data as unknown as Expense[] });
      await cache.set(CACHE_KEYS.EXPENSES, JSON.stringify(data));
    } else {
      const cached = await cache.get(CACHE_KEYS.EXPENSES);
      if (cached) set({ expenses: JSON.parse(cached) });
    }
  },

  fetchSettlements: async () => {
    const { data } = await supabase
      .from(TABLES.SETTLEMENTS)
      .select('*')
      .order('settled_at', { ascending: false });
    if (data) set({ settlements: data as Settlement[] });
  },

  fetchBalances: async (currentUserId) => {
    const { expenses, settlements, allUsers } = get();
    const balanceMap: Record<string, number> = {};

    for (const expense of expenses) {
      const participants = expense.participants || [];
      for (const p of participants) {
        if (p.profile_id === currentUserId && !p.is_settled) {
          if (expense.paid_by !== currentUserId) {
            balanceMap[expense.paid_by] = (balanceMap[expense.paid_by] || 0) - p.amount;
          }
        } else if (expense.paid_by === currentUserId && p.profile_id !== currentUserId && !p.is_settled) {
          balanceMap[p.profile_id] = (balanceMap[p.profile_id] || 0) + p.amount;
        }
      }
    }

    for (const settlement of settlements) {
      if (settlement.from_id === currentUserId) {
        balanceMap[settlement.to_id] = (balanceMap[settlement.to_id] || 0) + settlement.amount;
      } else if (settlement.to_id === currentUserId) {
        balanceMap[settlement.from_id] = (balanceMap[settlement.from_id] || 0) - settlement.amount;
      }
    }

    const balances: Balance[] = Object.entries(balanceMap)
      .filter(([, amount]) => Math.abs(amount) > 0.01)
      .map(([userId, amount]) => ({
        user_id: userId,
        user_name: allUsers.find((u) => u.id === userId)?.full_name || 'Unknown',
        amount,
      }));

    set({ balances });
  },

  fetchMemories: async () => {
    const { data } = await supabase
      .from('memories')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) set({ memories: data as MemoryItem[] });
  },

  addExpense: async (expenseWithParticipants) => {
    const { participants, ...expenseData } = expenseWithParticipants as any;

    const { data: created, error } = await supabase
      .from(TABLES.EXPENSES)
      .insert(expenseData)
      .select()
      .single();

    if (created && !error) {
      const participantRows = (participants as ExpenseParticipant[]).map((p) => ({
        expense_id: created.id,
        profile_id: p.profile_id,
        amount: p.amount,
        percentage: p.percentage,
        is_settled: p.is_settled,
      }));

      await supabase.from(TABLES.EXPENSE_PARTICIPANTS).insert(participantRows);

      const newExpense: Expense = { ...created, participants: participantRows };
      set((state) => ({ expenses: [newExpense, ...state.expenses] }));
    }
  },

  addSettlement: async (settlement) => {
    const { data: created } = await supabase
      .from(TABLES.SETTLEMENTS)
      .insert(settlement)
      .select()
      .single();

    if (created) {
      set((state) => ({ settlements: [created as Settlement, ...state.settlements] }));
    }
  },

  uploadItinerary: async (file, metadata) => {
    const fileName = `${Date.now()}_${metadata.file_name || 'document'}`;
    const { data: storageData } = await supabase.storage
      .from(BUCKETS.ITINERARIES)
      .upload(fileName, file);

    if (storageData) {
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKETS.ITINERARIES)
        .getPublicUrl(fileName);

      const doc: Partial<Itinerary> = {
        ...metadata,
        file_url: publicUrl,
        created_at: new Date().toISOString(),
      };

      const { data: created } = await supabase
        .from(TABLES.ITINERARIES)
        .insert(doc)
        .select()
        .single();

      if (created) {
        set((state) => ({
          itineraries: [created as Itinerary, ...state.itineraries],
          documents: [created as Itinerary, ...state.documents],
        }));
      }
    }
  },

  uploadDocument: async (file, metadata) => {
    return get().uploadItinerary(file, metadata);
  },

  addMemory: async (memory) => {
    const { data: created } = await supabase
      .from('memories')
      .insert({ ...memory, created_at: new Date().toISOString() })
      .select()
      .single();

    if (created) {
      set((state) => ({ memories: [created as MemoryItem, ...state.memories] }));
    }
  },

  deleteItinerary: async (id) => {
    await supabase.from(TABLES.ITINERARIES).delete().eq('id', id);
    set((state) => ({
      itineraries: state.itineraries.filter((d) => d.id !== id),
      documents: state.documents.filter((d) => d.id !== id),
    }));
  },

  deleteDocument: async (id) => {
    return get().deleteItinerary(id);
  },
}));

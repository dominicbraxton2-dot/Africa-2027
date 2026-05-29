import { create } from 'zustand';
import { supabase, TABLES, BUCKETS } from '../lib/supabase';
import { TripDocument, Expense, Settlement, Balance, MemoryItem, ExpenseSplit } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEYS = {
  DOCUMENTS: 'cached_documents',
  EXPENSES: 'cached_expenses',
  USERS: 'cached_users',
};

interface TripState {
  documents: TripDocument[];
  expenses: Expense[];
  settlements: Settlement[];
  balances: Balance[];
  memories: MemoryItem[];
  allUsers: any[];
  isOnline: boolean;
  pendingSync: any[];

  // Fetchers
  fetchDocuments: () => Promise<void>;
  fetchExpenses: () => Promise<void>;
  fetchAllUsers: () => Promise<void>;
  fetchBalances: (currentUserId: string) => Promise<void>;
  fetchMemories: () => Promise<void>;

  // Mutations
  addExpense: (expense: Omit<Expense, 'id' | 'created_at' | 'is_synced'>) => Promise<void>;
  addSettlement: (settlement: Omit<Settlement, 'id' | 'created_at'>) => Promise<void>;
  uploadDocument: (file: any, metadata: Partial<TripDocument>) => Promise<void>;
  addMemory: (memory: Omit<MemoryItem, 'id' | 'created_at'>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;

  setIsOnline: (online: boolean) => void;
  syncPending: () => Promise<void>;
}

export const useTripStore = create<TripState>((set, get) => ({
  documents: [],
  expenses: [],
  settlements: [],
  balances: [],
  memories: [],
  allUsers: [],
  isOnline: true,
  pendingSync: [],

  setIsOnline: (online) => set({ isOnline: online }),

  fetchAllUsers: async () => {
    const { data } = await supabase.from(TABLES.USERS).select('*').order('full_name');
    if (data) {
      set({ allUsers: data });
      await AsyncStorage.setItem(CACHE_KEYS.USERS, JSON.stringify(data));
    } else {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.USERS);
      if (cached) set({ allUsers: JSON.parse(cached) });
    }
  },

  fetchDocuments: async () => {
    const { data } = await supabase
      .from(TABLES.DOCUMENTS)
      .select('*')
      .order('created_at', { ascending: false });
    if (data) {
      set({ documents: data as TripDocument[] });
      await AsyncStorage.setItem(CACHE_KEYS.DOCUMENTS, JSON.stringify(data));
    } else {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.DOCUMENTS);
      if (cached) set({ documents: JSON.parse(cached) });
    }
  },

  fetchExpenses: async () => {
    const { data } = await supabase
      .from(TABLES.EXPENSES)
      .select('*, splits:expense_splits(*)')
      .order('date', { ascending: false });
    if (data) {
      set({ expenses: data as unknown as Expense[] });
      await AsyncStorage.setItem(CACHE_KEYS.EXPENSES, JSON.stringify(data));
    } else {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.EXPENSES);
      if (cached) set({ expenses: JSON.parse(cached) });
    }
  },

  fetchBalances: async (currentUserId) => {
    const { expenses, settlements, allUsers } = get();
    const balanceMap: Record<string, number> = {};

    // Calculate from expenses
    for (const expense of expenses) {
      const splits = expense.splits || [];
      for (const split of splits) {
        if (split.user_id === currentUserId && !split.is_settled) {
          if (expense.paid_by !== currentUserId) {
            balanceMap[expense.paid_by] = (balanceMap[expense.paid_by] || 0) - split.amount;
          }
        } else if (expense.paid_by === currentUserId && split.user_id !== currentUserId && !split.is_settled) {
          balanceMap[split.user_id] = (balanceMap[split.user_id] || 0) + split.amount;
        }
      }
    }

    // Apply settlements
    for (const settlement of settlements) {
      if (settlement.from_user_id === currentUserId) {
        balanceMap[settlement.to_user_id] = (balanceMap[settlement.to_user_id] || 0) + settlement.amount;
      } else if (settlement.to_user_id === currentUserId) {
        balanceMap[settlement.from_user_id] = (balanceMap[settlement.from_user_id] || 0) - settlement.amount;
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
      .from(TABLES.MEMORIES)
      .select('*')
      .order('created_at', { ascending: false });
    if (data) set({ memories: data as MemoryItem[] });
  },

  addExpense: async (expense) => {
    const { isOnline, pendingSync } = get();
    const newExpense: Expense = {
      ...expense,
      id: `local_${Date.now()}`,
      created_at: new Date().toISOString(),
      is_synced: false,
    };

    set((state) => ({ expenses: [newExpense, ...state.expenses] }));

    if (isOnline) {
      const { splits, ...expenseData } = newExpense;
      const { data: created, error } = await supabase
        .from(TABLES.EXPENSES)
        .insert({ ...expenseData, id: undefined })
        .select()
        .single();

      if (created && !error) {
        const splitsWithExpenseId = splits.map((s) => ({
          ...s,
          expense_id: created.id,
        }));
        await supabase.from(TABLES.EXPENSE_SPLITS).insert(splitsWithExpenseId);

        set((state) => ({
          expenses: state.expenses.map((e) =>
            e.id === newExpense.id ? { ...created, splits: splitsWithExpenseId, is_synced: true } : e
          ),
        }));
      }
    } else {
      set({ pendingSync: [...pendingSync, { type: 'expense', data: newExpense }] });
    }
  },

  addSettlement: async (settlement) => {
    const newSettlement: Settlement = {
      ...settlement,
      id: `local_${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    const { data: created } = await supabase
      .from(TABLES.SETTLEMENTS)
      .insert({ ...newSettlement, id: undefined })
      .select()
      .single();

    if (created) {
      set((state) => ({ settlements: [created as Settlement, ...state.settlements] }));
    }
  },

  uploadDocument: async (file, metadata) => {
    const fileName = `${Date.now()}_${metadata.file_name}`;
    const { data: storageData } = await supabase.storage
      .from(BUCKETS.DOCUMENTS)
      .upload(fileName, file);

    if (storageData) {
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKETS.DOCUMENTS)
        .getPublicUrl(fileName);

      const doc: Partial<TripDocument> = {
        ...metadata,
        file_url: publicUrl,
        created_at: new Date().toISOString(),
      };

      const { data: created } = await supabase
        .from(TABLES.DOCUMENTS)
        .insert(doc)
        .select()
        .single();

      if (created) {
        set((state) => ({ documents: [created as TripDocument, ...state.documents] }));
      }
    }
  },

  addMemory: async (memory) => {
    const { data: created } = await supabase
      .from(TABLES.MEMORIES)
      .insert({ ...memory, created_at: new Date().toISOString() })
      .select()
      .single();

    if (created) {
      set((state) => ({ memories: [created as MemoryItem, ...state.memories] }));
    }
  },

  deleteDocument: async (id) => {
    await supabase.from(TABLES.DOCUMENTS).delete().eq('id', id);
    set((state) => ({ documents: state.documents.filter((d) => d.id !== id) }));
  },

  syncPending: async () => {
    const { pendingSync } = get();
    for (const item of pendingSync) {
      if (item.type === 'expense') {
        await get().addExpense(item.data);
      }
    }
    set({ pendingSync: [] });
  },
}));

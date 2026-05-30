import { create } from 'zustand';
import { Platform } from 'react-native';
import { supabase, TABLES, BUCKETS, isSupabaseConfigured } from '../lib/supabase';
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
  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try { localStorage.removeItem(key); } catch {}
      return;
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.removeItem(key);
  },
};

const CACHE_KEYS = {
  ITINERARIES: 'cached_itineraries',
  EXPENSES: 'cached_expenses',
  PROFILES: 'cached_profiles',
};

// Key for locally uploaded itineraries (when Supabase is unavailable)
const LOCAL_ITINERARIES_KEY = 'local_itineraries_v1';

// ── Local itinerary helpers ───────────────────────────────────────────────────

async function loadLocalItineraries(): Promise<Itinerary[]> {
  try {
    const raw = await cache.get(LOCAL_ITINERARIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveLocalItinerary(item: Itinerary): Promise<void> {
  try {
    const list = await loadLocalItineraries();
    const updated = [item, ...list.filter((i) => i.id !== item.id)];
    await cache.set(LOCAL_ITINERARIES_KEY, JSON.stringify(updated));
  } catch {
    // If storage quota is exceeded, retry without embedded base64 data
    try {
      const list = await loadLocalItineraries();
      const strip = (i: Itinerary) => ({
        ...i,
        file_url: i.file_url?.startsWith('data:') ? undefined : i.file_url,
      });
      const updated = [strip(item), ...list.filter((i) => i.id !== item.id).map(strip)];
      await cache.set(LOCAL_ITINERARIES_KEY, JSON.stringify(updated));
    } catch {}
  }
}

async function removeLocalItinerary(id: string): Promise<void> {
  try {
    const list = await loadLocalItineraries();
    await cache.set(LOCAL_ITINERARIES_KEY, JSON.stringify(list.filter((i) => i.id !== id)));
  } catch {}
}

// Convert a File to a base64 data URL (web only, images ≤ 4 MB)
function fileToDataUrl(file: File): Promise<string | undefined> {
  if (file.size > 4 * 1024 * 1024) return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
}

// ── Store ─────────────────────────────────────────────────────────────────────

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
  uploadItinerary: (asset: any, metadata: Partial<Itinerary>) => Promise<void>;
  addMemory: (memory: Omit<MemoryItem, 'id' | 'created_at'>) => Promise<void>;
  deleteItinerary: (id: string) => Promise<void>;

  // Aliases for backward compat
  documents: Itinerary[];
  fetchDocuments: () => Promise<void>;
  uploadDocument: (asset: any, metadata: Partial<Itinerary>) => Promise<void>;
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
    if (!isSupabaseConfigured()) {
      const cached = await cache.get(CACHE_KEYS.PROFILES);
      if (cached) set({ allUsers: JSON.parse(cached) });
      return;
    }
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
    // Always load locally-uploaded items first
    const localItems = await loadLocalItineraries();
    const localIds = new Set(localItems.map((i) => i.id));

    let remoteItems: Itinerary[] = [];

    if (isSupabaseConfigured()) {
      const { data } = await supabase
        .from(TABLES.ITINERARIES)
        .select('*')
        .order('created_at', { ascending: false });
      if (data) {
        remoteItems = data as Itinerary[];
        await cache.set(CACHE_KEYS.ITINERARIES, JSON.stringify(data));
      } else {
        const cached = await cache.get(CACHE_KEYS.ITINERARIES);
        if (cached) remoteItems = JSON.parse(cached);
      }
    } else {
      const cached = await cache.get(CACHE_KEYS.ITINERARIES);
      if (cached) remoteItems = JSON.parse(cached);
    }

    // Merge local + remote, newest first
    const merged = [
      ...localItems,
      ...remoteItems.filter((i) => !localIds.has(i.id)),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    set({ itineraries: merged, documents: merged });
  },

  fetchDocuments: async () => get().fetchItineraries(),

  fetchExpenses: async () => {
    if (!isSupabaseConfigured()) {
      const cached = await cache.get(CACHE_KEYS.EXPENSES);
      if (cached) set({ expenses: JSON.parse(cached) });
      return;
    }
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
    if (!isSupabaseConfigured()) return;
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
    if (!isSupabaseConfigured()) return;
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

  uploadItinerary: async (asset: any, metadata: Partial<Itinerary>) => {
    // ── Try Supabase if configured ──────────────────────────────────────
    if (isSupabaseConfigured()) {
      try {
        const safeName = (metadata.file_name || 'document').replace(/\s/g, '_');
        const fileName = `${Date.now()}_${safeName}`;

        let fileData: File | Blob;
        if (asset.file instanceof File) {
          fileData = asset.file;
        } else {
          const response = await fetch(asset.uri);
          fileData = await response.blob();
        }

        const { error: storageError } = await supabase.storage
          .from(BUCKETS.ITINERARIES)
          .upload(fileName, fileData, {
            contentType: asset.mimeType || 'application/octet-stream',
            upsert: false,
          });

        if (storageError) throw new Error(storageError.message);

        const { data: { publicUrl } } = supabase.storage
          .from(BUCKETS.ITINERARIES)
          .getPublicUrl(fileName);

        const row: Partial<Itinerary> = {
          ...metadata,
          file_url: publicUrl,
          created_at: new Date().toISOString(),
        };

        const { data: created, error: insertError } = await supabase
          .from(TABLES.ITINERARIES)
          .insert(row)
          .select()
          .single();

        if (insertError) throw new Error(insertError.message);

        if (created) {
          set((state) => ({
            itineraries: [created as Itinerary, ...state.itineraries],
            documents: [created as Itinerary, ...state.documents],
          }));
        }
        return;
      } catch {
        // Supabase upload failed — fall through to local storage
      }
    }

    // ── Local fallback ────────────────────────────────────────────────────
    let fileUrl: string | undefined;

    try {
      if (Platform.OS === 'web') {
        if (asset.file instanceof File) {
          const isImage = asset.file.type.startsWith('image/');
          if (isImage) {
            // Base64 data URL for images: persists across page refreshes
            fileUrl = await fileToDataUrl(asset.file);
          }
          if (!fileUrl) {
            // Blob URL for session-only viewing (PDFs + large images)
            fileUrl = URL.createObjectURL(asset.file);
          }
        } else if (asset.uri) {
          fileUrl = asset.uri;
        }
      } else {
        // Native: Expo gives us a file:// URI we can use directly
        fileUrl = asset.uri;
      }
    } catch {
      fileUrl = asset.uri;
    }

    const localItem: Itinerary = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: metadata.title || 'Document',
      category: metadata.category || 'general',
      destination: metadata.destination || 'both',
      file_url: fileUrl,
      file_name: metadata.file_name,
      file_size: metadata.file_size,
      description: metadata.description,
      uploaded_by: metadata.uploaded_by,
      created_at: new Date().toISOString(),
    };

    await saveLocalItinerary(localItem);

    set((state) => ({
      itineraries: [localItem, ...state.itineraries],
      documents: [localItem, ...state.documents],
    }));
  },

  uploadDocument: async (asset, metadata) => get().uploadItinerary(asset, metadata),

  addMemory: async (memory) => {
    if (!isSupabaseConfigured()) return;
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
    // Remove from Supabase only if it's a remote item
    if (!id.startsWith('local-') && isSupabaseConfigured()) {
      await supabase.from(TABLES.ITINERARIES).delete().eq('id', id);
    }
    // Always remove from local storage
    await removeLocalItinerary(id);

    set((state) => ({
      itineraries: state.itineraries.filter((d) => d.id !== id),
      documents: state.documents.filter((d) => d.id !== id),
    }));
  },

  deleteDocument: async (id) => get().deleteItinerary(id),
}));

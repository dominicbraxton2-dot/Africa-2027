import { create } from 'zustand';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ItineraryEvent } from '../types';

const LOCAL_KEY = 'local_calendar_events_v1';

const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try { return localStorage.getItem(key); } catch { return null; }
    }
    const AS = require('@react-native-async-storage/async-storage').default;
    return AS.getItem(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try { localStorage.setItem(key, value); } catch {}
      return;
    }
    const AS = require('@react-native-async-storage/async-storage').default;
    await AS.setItem(key, value);
  },
};

function genId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function loadLocal(): Promise<ItineraryEvent[]> {
  try {
    const raw = await storage.get(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveLocal(events: ItineraryEvent[]): Promise<void> {
  try { await storage.set(LOCAL_KEY, JSON.stringify(events)); } catch {}
}

function sortEvents(events: ItineraryEvent[]): ItineraryEvent[] {
  return [...events].sort((a, b) => {
    const d = a.event_date.localeCompare(b.event_date);
    if (d !== 0) return d;
    return (a.start_time || '00:00').localeCompare(b.start_time || '00:00');
  });
}

interface CalendarState {
  events: ItineraryEvent[];
  loading: boolean;
  fetchEvents: () => Promise<void>;
  addEvent: (data: Omit<ItineraryEvent, 'id' | 'created_at' | 'updated_at'>) => Promise<ItineraryEvent>;
  addEvents: (data: Omit<ItineraryEvent, 'id' | 'created_at' | 'updated_at'>[]) => Promise<void>;
  updateEvent: (id: string, patch: Partial<Omit<ItineraryEvent, 'id' | 'created_at'>>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  loading: false,

  fetchEvents: async () => {
    set({ loading: true });
    try {
      const localEvents = await loadLocal();
      const localIds = new Set(localEvents.map((e) => e.id));

      let remote: ItineraryEvent[] = [];
      if (isSupabaseConfigured()) {
        const { data } = await supabase
          .from('itinerary_events')
          .select('*')
          .order('event_date', { ascending: true });
        if (data) remote = data as ItineraryEvent[];
      }

      const merged = sortEvents([
        ...localEvents,
        ...remote.filter((e) => !localIds.has(e.id)),
      ]);
      set({ events: merged });
    } finally {
      set({ loading: false });
    }
  },

  addEvent: async (data) => {
    const now = new Date().toISOString();
    const event: ItineraryEvent = { id: genId(), ...data, created_at: now, updated_at: now };

    const local = await loadLocal();
    await saveLocal([event, ...local]);

    if (isSupabaseConfigured()) {
      try { await supabase.from('itinerary_events').insert(event); } catch {}
    }

    set((s) => ({ events: sortEvents([...s.events, event]) }));
    return event;
  },

  addEvents: async (dataList) => {
    const now = new Date().toISOString();
    const events: ItineraryEvent[] = dataList.map((d) => ({
      id: genId(),
      ...d,
      created_at: now,
      updated_at: now,
    }));

    const local = await loadLocal();
    await saveLocal([...events, ...local]);

    if (isSupabaseConfigured()) {
      try { await supabase.from('itinerary_events').insert(events); } catch {}
    }

    set((s) => ({ events: sortEvents([...s.events, ...events]) }));
  },

  updateEvent: async (id, patch) => {
    const updated = { ...patch, updated_at: new Date().toISOString() };
    const local = await loadLocal();
    await saveLocal(local.map((e) => (e.id === id ? { ...e, ...updated } : e)));

    if (isSupabaseConfigured()) {
      try { await supabase.from('itinerary_events').update(updated).eq('id', id); } catch {}
    }

    set((s) => ({ events: sortEvents(s.events.map((e) => (e.id === id ? { ...e, ...updated } : e))) }));
  },

  deleteEvent: async (id) => {
    const local = await loadLocal();
    await saveLocal(local.filter((e) => e.id !== id));

    if (isSupabaseConfigured()) {
      try { await supabase.from('itinerary_events').delete().eq('id', id); } catch {}
    }

    set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
  },
}));

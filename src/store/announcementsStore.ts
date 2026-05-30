import { create } from 'zustand';
import { supabase, TABLES } from '../lib/supabase';
import { Announcement } from '../types';

interface AnnouncementsState {
  announcements: Announcement[];
  loading: boolean;
  fetchAnnouncements: () => Promise<void>;
  addAnnouncement: (a: Omit<Announcement, 'id' | 'created_at'>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  togglePin: (id: string, pinned: boolean) => Promise<void>;
}

export const useAnnouncementsStore = create<AnnouncementsState>((set, get) => ({
  announcements: [],
  loading: false,

  fetchAnnouncements: async () => {
    set({ loading: true });
    const { data } = await supabase
      .from(TABLES.ANNOUNCEMENTS)
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (data) set({ announcements: data as Announcement[] });
    set({ loading: false });
  },

  addAnnouncement: async (announcement) => {
    const { data: created } = await supabase
      .from(TABLES.ANNOUNCEMENTS)
      .insert(announcement)
      .select()
      .single();
    if (created) {
      set((state) => ({ announcements: [created as Announcement, ...state.announcements] }));
    }
  },

  deleteAnnouncement: async (id) => {
    await supabase.from(TABLES.ANNOUNCEMENTS).delete().eq('id', id);
    set((state) => ({ announcements: state.announcements.filter((a) => a.id !== id) }));
  },

  togglePin: async (id, pinned) => {
    await supabase.from(TABLES.ANNOUNCEMENTS).update({ pinned }).eq('id', id);
    set((state) => ({
      announcements: state.announcements.map((a) => (a.id === id ? { ...a, pinned } : a)),
    }));
  },
}));

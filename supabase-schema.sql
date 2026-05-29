-- ============================================
-- Andretta's 40th Birthday Expedition
-- Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'traveler' CHECK (role IN ('admin', 'traveler')),
  phone TEXT,
  instagram TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all users" ON public.users
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- TRAVELER PROFILES TABLE (sensitive data)
-- ============================================
CREATE TABLE IF NOT EXISTS public.traveler_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT,
  passport_number TEXT,
  nationality TEXT,
  date_of_birth TEXT,
  emergency_contact_name TEXT,
  emergency_contact_relationship TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_email TEXT,
  allergies TEXT,
  medications TEXT,
  blood_type TEXT,
  is_data_encrypted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.traveler_profiles ENABLE ROW LEVEL SECURITY;

-- Only the owner and admins can view profiles
CREATE POLICY "Users can view their own profile" ON public.traveler_profiles
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can upsert their own profile" ON public.traveler_profiles
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TRIP DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.trip_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('flights', 'hotels', 'activities', 'transportation', 'documents')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID REFERENCES public.users(id),
  destination TEXT CHECK (destination IN ('zanzibar', 'cape_town', 'both')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.trip_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can view documents" ON public.trip_documents
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage documents" ON public.trip_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('dining', 'transportation', 'excursions', 'shopping', 'lodging', 'tips', 'miscellaneous')),
  amount_usd DECIMAL(10, 2) NOT NULL,
  original_amount DECIMAL(14, 2),
  original_currency TEXT,
  exchange_rate DECIMAL(14, 6),
  receipt_url TEXT,
  receipt_data JSONB,
  paid_by UUID NOT NULL REFERENCES public.users(id),
  split_type TEXT NOT NULL CHECK (split_type IN ('equal', 'percentage', 'custom')),
  destination TEXT CHECK (destination IN ('zanzibar', 'cape_town')),
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  is_synced BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can view expenses" ON public.expenses
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert expenses" ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() = paid_by);

CREATE POLICY "Admins can manage all expenses" ON public.expenses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- EXPENSE SPLITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  amount DECIMAL(10, 2) NOT NULL,
  percentage DECIMAL(5, 2),
  is_settled BOOLEAN DEFAULT FALSE,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all splits" ON public.expense_splits
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert splits" ON public.expense_splits
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own splits" ON public.expense_splits
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- SETTLEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.users(id),
  to_user_id UUID NOT NULL REFERENCES public.users(id),
  amount DECIMAL(10, 2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('cash', 'zelle', 'venmo', 'paypal')),
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view settlements involving them" ON public.settlements
  FOR SELECT USING (
    auth.uid() = from_user_id OR
    auth.uid() = to_user_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can create settlements" ON public.settlements
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- ============================================
-- MEMORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  type TEXT NOT NULL CHECK (type IN ('photo', 'video', 'note')),
  file_url TEXT,
  note TEXT,
  caption TEXT,
  destination TEXT NOT NULL CHECK (destination IN ('zanzibar', 'cape_town')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can view memories" ON public.memories
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can add their own memories" ON public.memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories" ON public.memories
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKETS
-- Run these in the Supabase dashboard Storage section
-- or via the Supabase CLI
-- ============================================

-- Insert public buckets (run in Supabase dashboard or CLI):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('trip-documents', 'trip-documents', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('memories', 'memories', false);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'traveler'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: create user row on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER traveler_profiles_updated_at
  BEFORE UPDATE ON public.traveler_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON public.expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id ON public.expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user_id ON public.expense_splits(user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_from_user ON public.settlements(from_user_id);
CREATE INDEX IF NOT EXISTS idx_settlements_to_user ON public.settlements(to_user_id);
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON public.memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_destination ON public.memories(destination);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.trip_documents(category);

-- ============================================================
-- Andretta's 40th Birthday Expedition — Complete Supabase Schema
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── profiles ────────────────────────────────────────────────
-- Mirrors auth.users; auto-created on sign-up via trigger.
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT NOT NULL DEFAULT '',
  role          TEXT NOT NULL DEFAULT 'traveler' CHECK (role IN ('admin','traveler')),
  phone         TEXT,
  instagram     TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles: read all"   ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "profiles: own write"  ON public.profiles FOR ALL    USING (auth.uid() = id);

-- ── travelers ────────────────────────────────────────────────
-- Sensitive per-traveler travel document + emergency info.
CREATE TABLE IF NOT EXISTS public.travelers (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id                   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  passport_number              TEXT,
  nationality                  TEXT,
  date_of_birth                TEXT,
  emergency_contact_name       TEXT,
  emergency_contact_relation   TEXT,
  emergency_contact_phone      TEXT,
  emergency_contact_email      TEXT,
  allergies                    TEXT,
  medications                  TEXT,
  blood_type                   TEXT,
  dietary_restrictions         TEXT,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.travelers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "travelers: read own or admin" ON public.travelers FOR SELECT
  USING (
    auth.uid() = profile_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "travelers: write own" ON public.travelers FOR ALL USING (auth.uid() = profile_id);

-- ── announcements ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID NOT NULL REFERENCES public.profiles(id),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'info'
                CHECK (type IN ('info','warning','emergency','flight','schedule')),
  pinned      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "announcements: all read"    ON public.announcements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "announcements: admin write" ON public.announcements FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── itineraries ──────────────────────────────────────────────
-- Top-level itinerary document (one per upload / trip segment).
CREATE TABLE IF NOT EXISTS public.itineraries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT,
  destination  TEXT NOT NULL CHECK (destination IN ('zanzibar','cape_town','both')),
  file_url     TEXT,
  file_name    TEXT,
  file_size    BIGINT,
  category     TEXT NOT NULL DEFAULT 'general'
                 CHECK (category IN ('flights','hotels','excursions','transportation','general')),
  start_date   DATE,
  end_date     DATE,
  uploaded_by  UUID REFERENCES public.profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "itineraries: all read"      ON public.itineraries FOR SELECT USING (auth.uid() IS NOT NULL);
-- Any authenticated traveler can upload their own itinerary documents
CREATE POLICY "itineraries: auth insert"   ON public.itineraries FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = uploaded_by);
-- Travelers can delete only their own uploads
CREATE POLICY "itineraries: own delete"    ON public.itineraries FOR DELETE
  USING (auth.uid() = uploaded_by);
-- Admins have full control (UPDATE, DELETE any row)
CREATE POLICY "itineraries: admin write"   ON public.itineraries FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── itinerary_days ───────────────────────────────────────────
-- Individual day entries within an itinerary.
CREATE TABLE IF NOT EXISTS public.itinerary_days (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id   UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  day_date       DATE NOT NULL,
  day_number     INT  NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  location       TEXT,
  destination    TEXT NOT NULL CHECK (destination IN ('zanzibar','cape_town','transit')),
  activities     JSONB DEFAULT '[]',
  meals          JSONB DEFAULT '{}',
  accommodation  TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "itinerary_days: all read"    ON public.itinerary_days FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "itinerary_days: admin write" ON public.itinerary_days FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── expenses ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expenses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  category          TEXT NOT NULL DEFAULT 'miscellaneous'
                      CHECK (category IN ('dining','transportation','excursions','shopping','lodging','tips','miscellaneous')),
  amount_usd        NUMERIC(12,2) NOT NULL,
  original_amount   NUMERIC(14,2),
  original_currency TEXT DEFAULT 'USD',
  exchange_rate     NUMERIC(14,6),
  destination       TEXT CHECK (destination IN ('zanzibar','cape_town')),
  paid_by           UUID NOT NULL REFERENCES public.profiles(id),
  split_type        TEXT NOT NULL DEFAULT 'equal' CHECK (split_type IN ('equal','percentage','custom')),
  receipt_url       TEXT,
  receipt_data      JSONB,
  notes             TEXT,
  expense_date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses: all read"    ON public.expenses FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "expenses: creator write" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = paid_by);
CREATE POLICY "expenses: admin full"  ON public.expenses FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── expense_participants ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expense_participants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id  UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES public.profiles(id),
  amount      NUMERIC(12,2) NOT NULL,
  percentage  NUMERIC(5,2),
  is_settled  BOOLEAN NOT NULL DEFAULT FALSE,
  settled_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(expense_id, profile_id)
);
ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants: all read"   ON public.expense_participants FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "participants: insert"     ON public.expense_participants FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "participants: own settle" ON public.expense_participants FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "participants: admin full" ON public.expense_participants FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── receipts ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.receipts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES public.profiles(id),
  expense_id  UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  image_url   TEXT NOT NULL,
  merchant    TEXT,
  receipt_date DATE,
  currency    TEXT DEFAULT 'USD',
  raw_amount  NUMERIC(14,2),
  usd_amount  NUMERIC(12,2),
  ocr_data    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "receipts: all read"    ON public.receipts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "receipts: own insert"  ON public.receipts FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "receipts: admin full"  ON public.receipts FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── settlements ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.settlements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id     UUID NOT NULL REFERENCES public.profiles(id),
  to_id       UUID NOT NULL REFERENCES public.profiles(id),
  amount      NUMERIC(12,2) NOT NULL,
  method      TEXT NOT NULL DEFAULT 'cash' CHECK (method IN ('cash','zelle','venmo','paypal','other')),
  notes       TEXT,
  settled_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settlements: parties read" ON public.settlements FOR SELECT
  USING (auth.uid() = from_id OR auth.uid() = to_id OR
         EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "settlements: from insert" ON public.settlements FOR INSERT WITH CHECK (auth.uid() = from_id);

-- ── Storage Buckets ──────────────────────────────────────────
-- Run these in Supabase SQL Editor or via CLI:
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES
--   ('itineraries',     'itineraries',     true,  52428800, '{application/pdf,image/*}'),
--   ('receipts',        'receipts',        false, 10485760, '{image/*}'),
--   ('expense-receipts','expense-receipts',true,  10485760, '{image/*}'),
--   ('avatars',         'avatars',         true,  5242880,  '{image/*}'),
--   ('memories',        'memories',        false, 52428800, '{image/*,video/*}');

-- ── Triggers & Functions ─────────────────────────────────────

-- Auto-create profile on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    CASE
      WHEN lower(NEW.email) = 'charmainebraxton@gmail.com' THEN 'admin'
      ELSE 'traveler'
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER travelers_updated_at BEFORE UPDATE ON public.travelers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by      ON public.expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_expenses_date         ON public.expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_participants_expense  ON public.expense_participants(expense_id);
CREATE INDEX IF NOT EXISTS idx_participants_profile  ON public.expense_participants(profile_id);
CREATE INDEX IF NOT EXISTS idx_settlements_from      ON public.settlements(from_id);
CREATE INDEX IF NOT EXISTS idx_settlements_to        ON public.settlements(to_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_days_date   ON public.itinerary_days(day_date);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned  ON public.announcements(pinned, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_profile      ON public.receipts(profile_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_uploaded_by ON public.itineraries(uploaded_by);

-- ── Storage Bucket Policies ───────────────────────────────────
-- Run AFTER creating buckets in Supabase Dashboard or via CLI.
-- Itineraries bucket: any authenticated user can upload & read;
-- travelers delete their own files, admins delete any file.

-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('itineraries', 'itineraries', true, 52428800,
--   '{application/pdf,image/jpeg,image/jpg,image/png,image/heic,image/heif,image/gif,image/webp}')
-- ON CONFLICT (id) DO NOTHING;

-- CREATE POLICY "storage_itineraries_read" ON storage.objects
--   FOR SELECT USING (bucket_id = 'itineraries' AND auth.uid() IS NOT NULL);

-- CREATE POLICY "storage_itineraries_insert" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'itineraries' AND auth.uid() IS NOT NULL);

-- CREATE POLICY "storage_itineraries_delete_own" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'itineraries' AND auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "storage_itineraries_delete_admin" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'itineraries' AND
--     EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
--   );

-- ── expense-receipts bucket policies ─────────────────────────
-- Any authenticated user can read receipt images (bucket is public).
-- Users upload to their own folder (<user_id>/filename); admins can delete any.

-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('expense-receipts', 'expense-receipts', true, 10485760,
--   '{image/jpeg,image/jpg,image/png,image/heic,image/heif,image/webp}')
-- ON CONFLICT (id) DO NOTHING;

-- CREATE POLICY "expense_receipts_read" ON storage.objects
--   FOR SELECT USING (bucket_id = 'expense-receipts' AND auth.uid() IS NOT NULL);

-- CREATE POLICY "expense_receipts_insert" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'expense-receipts' AND
--     auth.uid() IS NOT NULL AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "expense_receipts_delete_own" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'expense-receipts' AND auth.uid()::text = (storage.foldername(name))[1]
--   );

-- CREATE POLICY "expense_receipts_delete_admin" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'expense-receipts' AND
--     EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
--   );

-- ── profile-pictures bucket policies ─────────────────────────
-- Public bucket; users upload/overwrite only their own file (<user_id>.ext).
-- All authenticated users can read any profile picture.

-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('profile-pictures', 'profile-pictures', true, 5242880,
--   '{image/jpeg,image/jpg,image/png,image/heic,image/heif,image/webp}')
-- ON CONFLICT (id) DO NOTHING;

-- CREATE POLICY "profile_pictures_read" ON storage.objects
--   FOR SELECT USING (bucket_id = 'profile-pictures' AND auth.uid() IS NOT NULL);

-- CREATE POLICY "profile_pictures_insert_own" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'profile-pictures' AND
--     auth.uid() IS NOT NULL AND
--     starts_with(name, auth.uid()::text || '.')
--   );

-- CREATE POLICY "profile_pictures_update_own" ON storage.objects
--   FOR UPDATE USING (
--     bucket_id = 'profile-pictures' AND
--     starts_with(name, auth.uid()::text || '.')
--   );

-- CREATE POLICY "profile_pictures_delete_own" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'profile-pictures' AND starts_with(name, auth.uid()::text || '.')
--   );

-- CREATE POLICY "profile_pictures_delete_admin" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'profile-pictures' AND
--     EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
--   );

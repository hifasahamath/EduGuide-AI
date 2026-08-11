-- ========================================================
-- EduGuide-AI — Supabase Database Schema
-- ========================================================
-- Run this in Supabase SQL Editor after enabling pgvector extension.
--
-- Embedding model: gemini-embedding-2 (3072 dimensions)
-- Auth: Supabase Auth — users register themselves, admins added manually
-- ========================================================


-- Enable vector extension (needed for similarity search)
CREATE EXTENSION IF NOT EXISTS vector;


-- ────────────────────────────────────────────────────────
-- HELPER: auto-update "updated_at" on any row change
-- ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- ────────────────────────────────────────────────────────
-- 1. PROFILES
-- Linked to auth.users via the same UUID
-- ────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  display_name    TEXT,
  role            TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  phone           TEXT,
  profile_pic     TEXT,              -- Supabase Storage URL
  school_name     TEXT,
  academic_level  TEXT,
  interests       TEXT[],
  preferred_language TEXT DEFAULT 'en',
  ai_settings     JSONB DEFAULT '{"mode": "normal", "fallbackEnabled": true, "llmProvider": "gemini"}',
  notification_prefs JSONB DEFAULT '{"failedQueries": true, "newUsers": false}',
  contact_info    JSONB DEFAULT '{}',
  blocked         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ────────────────────────────────────────────────────────
-- 2. COURSES
-- Each course gets an embedding for vector similarity search
-- ────────────────────────────────────────────────────────
CREATE TABLE public.courses (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  field                 TEXT,
  course_type           TEXT,
  university            TEXT,
  level                 TEXT,
  duration              TEXT,
  study_mode            TEXT,
  total_fee             NUMERIC,
  registration_fee      NUMERIC,
  installment_available BOOLEAN DEFAULT false,
  installment_plan      TEXT,
  eligibility           TEXT,
  minimum_requirements  TEXT,
  subjects              TEXT[],
  campus_location       TEXT,
  city                  TEXT,
  online_available      BOOLEAN DEFAULT false,
  job_opportunities     TEXT[],
  career_path           TEXT,
  internship_available  BOOLEAN DEFAULT false,
  industry_certification BOOLEAN DEFAULT false,
  practical_training    TEXT,
  course_image          TEXT,
  keywords              TEXT[],
  tags                  TEXT[],
  embedding             VECTOR(3072),   -- gemini-embedding-2 output
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ────────────────────────────────────────────────────────
-- 3. FAQs
-- Admin-created question/answer pairs with vector embeddings
-- ────────────────────────────────────────────────────────
CREATE TABLE public.faqs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  intent      TEXT,
  keywords    TEXT[],
  category    TEXT,
  ask_count   INTEGER DEFAULT 0,
  embedding   VECTOR(3072),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ────────────────────────────────────────────────────────
-- 4. TRAINING DATA
-- Stores unanswered user questions for admin to review and train
-- Once admin provides an answer, status goes from 'pending' to 'trained'
-- ────────────────────────────────────────────────────────
CREATE TABLE public.training_data (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_input       TEXT NOT NULL,
  normalized_input TEXT,
  detected_intent  TEXT,
  response         TEXT,
  status           TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'trained', 'learned')),
  occurrences      INTEGER DEFAULT 1,
  embedding        VECTOR(3072),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  trained_at       TIMESTAMPTZ
);


-- ────────────────────────────────────────────────────────
-- 5. DOCUMENTS
-- Uploaded files (PDF, DOCX, CSV, TXT) chunked and embedded for RAG
-- ────────────────────────────────────────────────────────
CREATE TABLE public.documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  filename    TEXT NOT NULL,
  file_url    TEXT NOT NULL,           -- Supabase Storage public URL
  file_type   TEXT,
  chunk_index INTEGER DEFAULT 0,
  content     TEXT NOT NULL,           -- the extracted text chunk
  embedding   VECTOR(3072),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ────────────────────────────────────────────────────────
-- 6. CHAT SESSIONS & MESSAGES
-- ────────────────────────────────────────────────────────
CREATE TABLE public.chat_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      TEXT,
  status     TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'failed')),
  pinned     BOOLEAN DEFAULT false,
  context    JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.chat_messages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role           TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content        TEXT NOT NULL,
  intent         TEXT,
  detected_field TEXT,
  detected_course TEXT,
  metadata       JSONB,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);


-- ────────────────────────────────────────────────────────
-- 7. ACTIVITY LOG
-- Tracks user actions for the profile activity feed
-- ────────────────────────────────────────────────────────
CREATE TABLE public.activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  description TEXT,
  device      TEXT,
  ip          TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ────────────────────────────────────────────────────────
-- 8. USER SETTINGS
-- Per-user key/value store for preferences
-- ────────────────────────────────────────────────────────
CREATE TABLE public.settings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  data       JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ────────────────────────────────────────────────────────
-- 9. DAILY ANALYTICS (aggregated stats)
-- ────────────────────────────────────────────────────────
CREATE TABLE public.daily_analytics (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date             DATE NOT NULL UNIQUE,
  total_chats      INTEGER DEFAULT 0,
  total_users      INTEGER DEFAULT 0,
  total_messages   INTEGER DEFAULT 0,
  avg_response_time REAL,
  popular_topics   JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);


-- ────────────────────────────────────────────────────────
-- 10. LLM PROVIDER SETTINGS (admin-configurable)
-- Stores API keys and model config so admin can swap providers
-- without touching code or .env files
-- ────────────────────────────────────────────────────────
CREATE TABLE public.llm_providers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider    TEXT NOT NULL UNIQUE,          -- 'gemini', 'openai', 'anthropic', 'xai'
  display_name TEXT NOT NULL,                -- 'Google Gemini', 'OpenAI', etc.
  api_key     TEXT,                          -- encrypted in production
  model       TEXT,                          -- 'gemini-2.5-flash', 'gpt-4o-mini', etc.
  enabled     BOOLEAN DEFAULT false,
  is_default  BOOLEAN DEFAULT false,         -- which provider to use by default
  config      JSONB DEFAULT '{}',            -- extra settings (base_url, temperature, etc.)
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER llm_providers_updated_at
  BEFORE UPDATE ON public.llm_providers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed the provider list with defaults (admin fills in API keys via dashboard)
INSERT INTO public.llm_providers (provider, display_name, model, enabled, is_default, config) VALUES
  ('gemini',    'Google Gemini',  'gemini-2.5-flash',       true,  true,  '{"embeddingModel": "gemini-embedding-2", "temperature": 0.5, "maxTokens": 1000}'),
  ('openai',    'OpenAI',         'gpt-4o-mini',            false, false, '{"temperature": 0.5, "maxTokens": 1000}'),
  ('anthropic', 'Anthropic',      'claude-3-5-haiku-latest', false, false, '{"temperature": 0.5, "maxTokens": 1000}'),
  ('xai',       'xAI / Grok',     'grok-beta',              false, false, '{"baseURL": "https://api.x.ai/v1", "temperature": 0.5, "maxTokens": 1000}');


-- ========================================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================================
-- Note: The server uses supabaseAdmin (service_role key) which
-- bypasses RLS entirely. These policies protect the anon/client key.

-- Helper function: is_admin() bypasses RLS to check if current user is admin (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Profiles — users see/edit their own, admins see all
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;

CREATE POLICY "Users read own profile"   ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Grant privileges to standard roles
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.courses TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.faqs TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.training_data TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.documents TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.chat_sessions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.chat_messages TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.activity_log TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.settings TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.daily_analytics TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.llm_providers TO anon, authenticated, service_role;

-- Chat Sessions — users manage their own sessions only
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions" ON chat_sessions FOR ALL USING (user_id = auth.uid());

-- Chat Messages — users access messages in their own sessions
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own messages" ON chat_messages FOR ALL
  USING (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));

-- FAQs — public read, admin write (via service_role)
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "FAQs are publicly readable" ON faqs FOR SELECT USING (true);

-- Courses — public read, admin write (via service_role)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Courses are publicly readable" ON courses FOR SELECT USING (true);

-- Training Data — admin only (all access via service_role)
ALTER TABLE public.training_data ENABLE ROW LEVEL SECURITY;
-- No anon policies needed; admin uses service_role

-- Documents — admin only
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
-- No anon policies needed; admin uses service_role

-- Activity Log — users see own, admins see all
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own activity" ON activity_log FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users insert own activity" ON activity_log FOR INSERT WITH CHECK (user_id = auth.uid());

-- Settings — users manage their own
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own settings" ON settings FOR ALL USING (user_id = auth.uid());

-- Daily Analytics — admin only (via service_role)
ALTER TABLE public.daily_analytics ENABLE ROW LEVEL SECURITY;

-- LLM Providers — admin only (via service_role)
ALTER TABLE public.llm_providers ENABLE ROW LEVEL SECURITY;


-- ========================================================
-- VECTOR SEARCH FUNCTIONS (used by RAG pipeline)
-- ========================================================

-- Search FAQs by similarity
CREATE OR REPLACE FUNCTION match_faqs(
  query_embedding VECTOR(3072),
  match_count INT DEFAULT 5,
  similarity_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (id UUID, question TEXT, answer TEXT, category TEXT, similarity FLOAT)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT f.id, f.question, f.answer, f.category,
         1 - (f.embedding <=> query_embedding) AS similarity
  FROM faqs f
  WHERE f.embedding IS NOT NULL
    AND 1 - (f.embedding <=> query_embedding) > similarity_threshold
  ORDER BY f.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Search trained Q&A pairs by similarity
CREATE OR REPLACE FUNCTION match_training_data(
  query_embedding VECTOR(3072),
  match_count INT DEFAULT 5,
  similarity_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (id UUID, user_input TEXT, response TEXT, similarity FLOAT)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT td.id, td.user_input, td.response,
         1 - (td.embedding <=> query_embedding) AS similarity
  FROM training_data td
  WHERE td.embedding IS NOT NULL
    AND td.status = 'trained'
    AND 1 - (td.embedding <=> query_embedding) > similarity_threshold
  ORDER BY td.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Search uploaded documents by similarity
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(3072),
  match_count INT DEFAULT 5,
  similarity_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (id UUID, title TEXT, content TEXT, filename TEXT, file_url TEXT, similarity FLOAT)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.title, d.content, d.filename, d.file_url,
         1 - (d.embedding <=> query_embedding) AS similarity
  FROM documents d
  WHERE d.embedding IS NOT NULL
    AND 1 - (d.embedding <=> query_embedding) > similarity_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Search courses by similarity
CREATE OR REPLACE FUNCTION match_courses(
  query_embedding VECTOR(3072),
  match_count INT DEFAULT 5,
  similarity_threshold FLOAT DEFAULT 0.3
)
RETURNS TABLE (id UUID, name TEXT, field TEXT, eligibility TEXT, subjects TEXT[], similarity FLOAT)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.field, c.eligibility, c.subjects,
         1 - (c.embedding <=> query_embedding) AS similarity
  FROM courses c
  WHERE c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> query_embedding) > similarity_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


-- ========================================================
-- ATOMIC FAQ ASK COUNT INCREMENT
-- Avoids the race condition of read-then-write
-- ========================================================
CREATE OR REPLACE FUNCTION increment_faq_ask_count(faq_id UUID)
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE faqs SET ask_count = ask_count + 1 WHERE id = faq_id;
END;
$$;


-- ========================================================
-- AUTO-CREATE PROFILE WHEN A NEW USER SIGNS UP
-- ========================================================
-- This trigger fires after a row is inserted into auth.users.
-- It creates a matching row in public.profiles so the app
-- can immediately find the user's profile after signup.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$;

-- Drop old trigger if it exists (safe to re-run)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

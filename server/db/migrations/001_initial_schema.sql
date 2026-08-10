-- ========================================================
-- EduGuide-AI Initial Supabase Schema
-- Includes Vector Embeddings, RAG, and Multi-modal Storage
-- ========================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- --------------------------------------------------------
-- 1. PROFILES & USERS
-- --------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  phone TEXT,
  profile_pic TEXT, -- Will store Supabase Storage URL instead of Base64
  school_name TEXT,
  academic_level TEXT,
  interests TEXT[],
  preferred_language TEXT DEFAULT 'en',
  ai_settings JSONB DEFAULT '{"mode": "normal", "fallbackEnabled": true, "llmProvider": "gemini"}',
  notification_prefs JSONB DEFAULT '{"failedQueries": true, "newUsers": false}',
  contact_info JSONB DEFAULT '{}',
  blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 2. COURSES
-- --------------------------------------------------------
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  field TEXT,
  course_type TEXT,
  university TEXT,
  level TEXT,
  duration TEXT,
  study_mode TEXT,
  total_fee NUMERIC,
  registration_fee NUMERIC,
  installment_available BOOLEAN DEFAULT false,
  installment_plan TEXT,
  eligibility TEXT,
  minimum_requirements TEXT,
  subjects TEXT[],
  campus_location TEXT,
  city TEXT,
  online_available BOOLEAN DEFAULT false,
  job_opportunities TEXT[],
  career_path TEXT,
  internship_available BOOLEAN DEFAULT false,
  industry_certification BOOLEAN DEFAULT false,
  practical_training TEXT,
  course_image TEXT,
  keywords TEXT[],
  tags TEXT[],
  embedding VECTOR(768), -- Gemini text-embedding-004 is 768 dims
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 3. FAQS
-- --------------------------------------------------------
CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  intent TEXT,
  keywords TEXT[],
  category TEXT,
  ask_count INTEGER DEFAULT 0,
  embedding VECTOR(768),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 4. TRAINING DATA & DOCUMENTS (Multi-modal)
-- --------------------------------------------------------
-- For Q&A pairs (manually entered)
CREATE TABLE public.training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_input TEXT NOT NULL,
  normalized_input TEXT,
  detected_intent TEXT,
  response TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'trained', 'learned')),
  occurrences INTEGER DEFAULT 1,
  embedding VECTOR(768),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  trained_at TIMESTAMPTZ
);

-- For uploaded documents (PDF, DOCX, CSV, TXT)
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL, -- Supabase Storage URL
  file_type TEXT,
  chunk_index INTEGER DEFAULT 0,
  content TEXT NOT NULL, -- The extracted text chunk
  embedding VECTOR(768),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 5. CHAT SESSIONS & MESSAGES
-- --------------------------------------------------------
CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'failed')),
  pinned BOOLEAN DEFAULT false,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  intent TEXT,
  detected_field TEXT,
  detected_course TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 6. LOGS & ANALYTICS
-- --------------------------------------------------------
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT,
  device TEXT,
  ip TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE public.daily_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_chats INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  avg_response_time REAL,
  popular_topics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Chat Sessions & Messages
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own sessions" ON chat_sessions FOR ALL USING (user_id = auth.uid());

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own messages" ON chat_messages FOR ALL USING (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));

-- Public Read-Only Content (FAQs, Courses)
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "FAQs are public" ON faqs FOR SELECT USING (true);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Courses are public" ON courses FOR SELECT USING (true);

-- Activity Log
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own activity" ON activity_log FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins see all activity" ON activity_log FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ========================================================
-- VECTOR SEARCH FUNCTIONS (RAG)
-- ========================================================

-- Semantic FAQ search
CREATE OR REPLACE FUNCTION match_faqs(query_embedding VECTOR(768), match_count INT DEFAULT 5, similarity_threshold FLOAT DEFAULT 0.5)
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

-- Semantic Training Data search
CREATE OR REPLACE FUNCTION match_training_data(query_embedding VECTOR(768), match_count INT DEFAULT 5, similarity_threshold FLOAT DEFAULT 0.5)
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

-- Semantic Document Search (For PDFs, Word, CSV)
CREATE OR REPLACE FUNCTION match_documents(query_embedding VECTOR(768), match_count INT DEFAULT 5, similarity_threshold FLOAT DEFAULT 0.5)
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

-- Semantic Course Search
CREATE OR REPLACE FUNCTION match_courses(query_embedding VECTOR(768), match_count INT DEFAULT 5, similarity_threshold FLOAT DEFAULT 0.3)
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

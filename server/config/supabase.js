/**
 * Supabase Client Configuration
 * 
 * Two clients are initialized:
 * - supabase:      Uses the anon key, respects RLS. Used for JWT verification.
 * - supabaseAdmin: Uses the service_role key, bypasses RLS. Used for all DB operations on the server.
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[Supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables');
}

// Anon client — used to verify JWTs in auth middleware
const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Admin client — bypasses Row Level Security for server-side DB operations
const supabaseAdmin = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : (supabase || null);

if (!supabaseAdmin) {
  console.warn('[Supabase] Warning: Supabase client not fully initialized. Ensure SUPABASE_URL and keys are configured.');
}

module.exports = { supabase, supabaseAdmin };

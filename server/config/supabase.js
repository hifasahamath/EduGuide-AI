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

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  console.error('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
}

// Anon client — used to verify JWTs in auth middleware
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// Admin client — bypasses Row Level Security for server-side DB operations
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

if (!supabaseAdmin) {
  console.warn('[Supabase] No SUPABASE_SERVICE_ROLE_KEY — admin operations will fail');
}

module.exports = { supabase, supabaseAdmin };

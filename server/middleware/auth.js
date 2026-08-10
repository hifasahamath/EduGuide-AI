const { supabase, supabaseAdmin } = require('../config/supabase');

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Get the user's role from the profiles table.
    // We create a temporary scoped client with the user's JWT so RLS policies work correctly.
    const { createClient } = require('@supabase/supabase-js');
    const userClient = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('role, display_name, ai_settings')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.warn('Profile fetch warning in auth middleware:', profileError.message);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: profile?.role || 'user',
      name: profile?.display_name || '',
      ai_settings: profile?.ai_settings || {}
    };

    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

module.exports = authenticateUser;

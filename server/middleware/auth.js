const { supabase, supabaseAdmin } = require('../config/supabase');

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify JWT with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Use the admin client (service role) to fetch the profile.
    // This bypasses RLS and is the standard Supabase server-side pattern.
    // The JWT has already been verified above, so we know the user is authentic.
    const { data: profile, error: profileError } = await supabaseAdmin
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

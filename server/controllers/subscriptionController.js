const { supabaseAdmin: supabase } = require('../config/supabase');

// Default initial plans if database table is empty or being initialized
const DEFAULT_PLANS = [
  {
    id: 'free',
    name: 'Free Tier',
    price: 0,
    currency: 'LKR',
    billing_period: 'monthly',
    is_free: true,
    features: ['20 chats/day', 'Standard AI model', 'Basic course search'],
    color: 'slate',
    active: true,
    sort_order: 1
  },
  {
    id: 'pro',
    name: 'Pro Student',
    price: 1500,
    currency: 'LKR',
    billing_period: 'monthly',
    is_free: false,
    features: ['Unlimited chats', 'Advanced AI recommendations', 'Export chat transcripts', 'Priority academic advisor link'],
    color: 'indigo',
    active: true,
    sort_order: 2
  },
  {
    id: 'premium',
    name: 'Premium Plus',
    price: 3500,
    currency: 'LKR',
    billing_period: 'monthly',
    is_free: false,
    features: ['Everything in Pro', 'Personalized career roadmap', 'Institutional fee comparison matrix', 'Direct phone consultation'],
    color: 'amber',
    active: true,
    sort_order: 3
  }
];

// Memory store fallback if DB table is not yet created
let memoryPlans = [...DEFAULT_PLANS];

exports.getPlans = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      // Return memory fallback if database table empty or not set up
      const filtered = req.user?.role === 'admin' 
        ? memoryPlans 
        : memoryPlans.filter(p => p.active !== false);
      return res.json(filtered);
    }

    const filtered = req.user?.role === 'admin' 
      ? data 
      : data.filter(p => p.active !== false);

    res.json(filtered);
  } catch (err) {
    res.json(memoryPlans.filter(p => p.active !== false));
  }
};

exports.createPlan = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { name, price, currency, billing_period, is_free, features, color, active, sort_order } = req.body;
    
    const newPlan = {
      id: `plan_${Date.now()}`,
      name: name || 'Custom Plan',
      price: is_free ? 0 : Number(price) || 0,
      currency: currency || 'LKR',
      billing_period: billing_period || 'monthly',
      is_free: Boolean(is_free),
      features: Array.isArray(features) ? features : (features ? features.split('\n').filter(Boolean) : []),
      color: color || 'indigo',
      active: active !== false,
      sort_order: Number(sort_order) || (memoryPlans.length + 1),
      updated_at: new Date().toISOString()
    };

    // Try DB insert
    const { data, error } = await supabase
      .from('subscription_plans')
      .insert([newPlan])
      .select()
      .single();

    if (error || !data) {
      // Memory fallback
      memoryPlans.push(newPlan);
      return res.json(newPlan);
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Create subscription plan error:', err);
    res.status(500).json({ error: 'Failed to create subscription plan' });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { id } = req.params;
    const { name, price, currency, billing_period, is_free, features, color, active, sort_order } = req.body;

    const updates = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updates.name = name;
    if (is_free !== undefined) updates.is_free = Boolean(is_free);
    if (price !== undefined) updates.price = updates.is_free ? 0 : Number(price);
    if (currency !== undefined) updates.currency = currency;
    if (billing_period !== undefined) updates.billing_period = billing_period;
    if (features !== undefined) updates.features = Array.isArray(features) ? features : features.split('\n').filter(Boolean);
    if (color !== undefined) updates.color = color;
    if (active !== undefined) updates.active = Boolean(active);
    if (sort_order !== undefined) updates.sort_order = Number(sort_order);

    // Try DB update
    const { data, error } = await supabase
      .from('subscription_plans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      // Memory fallback
      const idx = memoryPlans.findIndex(p => p.id === id);
      if (idx !== -1) {
        memoryPlans[idx] = { ...memoryPlans[idx], ...updates };
        return res.json(memoryPlans[idx]);
      }
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json(data);
  } catch (err) {
    console.error('Update subscription plan error:', err);
    res.status(500).json({ error: 'Failed to update subscription plan' });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { id } = req.params;

    // Try DB delete
    const { error } = await supabase
      .from('subscription_plans')
      .delete()
      .eq('id', id);

    // Memory fallback update
    memoryPlans = memoryPlans.filter(p => p.id !== id);

    res.json({ success: true, message: 'Subscription plan removed' });
  } catch (err) {
    console.error('Delete subscription plan error:', err);
    res.status(500).json({ error: 'Failed to delete subscription plan' });
  }
};

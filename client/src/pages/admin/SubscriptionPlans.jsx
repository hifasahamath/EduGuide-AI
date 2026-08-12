import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';
import { motion } from 'framer-motion';
import {
  CreditCard, Plus, Edit2, Trash2, CheckCircle2, AlertCircle,
  Loader2, Sparkles, DollarSign, Calendar, Shield, RefreshCw, X, Check
} from 'lucide-react';

const COLOR_MAP = {
  indigo: 'from-indigo-600 to-blue-600 text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
  violet: 'from-violet-600 to-purple-600 text-violet-400 border-violet-500/30 bg-violet-500/10',
  amber: 'from-amber-500 to-orange-600 text-amber-400 border-amber-500/30 bg-amber-500/10',
  emerald: 'from-emerald-500 to-teal-600 text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  rose: 'from-rose-500 to-pink-600 text-rose-400 border-rose-500/30 bg-rose-500/10',
  slate: 'from-slate-600 to-gray-700 text-slate-300 border-slate-600/30 bg-slate-500/10'
};

const SubscriptionPlans = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [newFeatureInput, setNewFeatureInput] = useState('');
  
  const [form, setForm] = useState({
    name: '',
    price: 0,
    currency: 'LKR',
    billing_period: 'monthly',
    is_free: false,
    color: 'indigo',
    features: [],
    active: true,
    sort_order: 1
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get('/subscription-plans');
      setPlans(res.data || []);
    } catch {
      showToast('Could not load subscription plans from server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setForm({
      name: '',
      price: 1500,
      currency: 'LKR',
      billing_period: 'monthly',
      is_free: false,
      color: 'indigo',
      features: ['Unlimited AI chats', 'Transcript exports'],
      active: true,
      sort_order: plans.length + 1
    });
    setModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name || '',
      price: plan.price || 0,
      currency: plan.currency || 'LKR',
      billing_period: plan.billing_period || 'monthly',
      is_free: Boolean(plan.is_free),
      color: plan.color || 'indigo',
      features: Array.isArray(plan.features) ? [...plan.features] : [],
      active: plan.active !== false,
      sort_order: plan.sort_order || 1
    });
    setModalOpen(true);
  };

  const addFeature = () => {
    if (!newFeatureInput.trim()) return;
    setForm(f => ({ ...f, features: [...f.features, newFeatureInput.trim()] }));
    setNewFeatureInput('');
  };

  const removeFeature = (idx) => {
    setForm(f => ({ ...f, features: f.features.filter((_, i) => i !== idx) }));
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Plan name is required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: form.is_free ? 0 : Number(form.price)
      };

      if (editingPlan) {
        const res = await api.put(`/subscription-plans/${editingPlan.id}`, payload);
        setPlans(plans.map(p => p.id === editingPlan.id ? res.data : p));
        showToast('Subscription plan updated successfully!');
      } else {
        const res = await api.post('/subscription-plans', payload);
        setPlans([...plans, res.data]);
        showToast('New subscription plan created!');
      }
      setModalOpen(false);
    } catch {
      showToast('Failed to save subscription plan.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this subscription plan?')) return;
    try {
      await api.delete(`/subscription-plans/${planId}`);
      setPlans(plans.filter(p => p.id !== planId));
      showToast('Subscription plan removed.');
    } catch {
      showToast('Could not delete plan.', 'error');
    }
  };

  const togglePlanActive = async (plan) => {
    try {
      const updated = { ...plan, active: !plan.active };
      await api.put(`/subscription-plans/${plan.id}`, { active: !plan.active });
      setPlans(plans.map(p => p.id === plan.id ? updated : p));
      showToast(updated.active ? 'Plan activated!' : 'Plan deactivated!');
    } catch {
      showToast('Could not change active status.', 'error');
    }
  };

  const textMain = isDark ? 'text-gray-100' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const cardBg = isDark ? 'bg-[#1a1a2c]/90 border-white/10' : 'bg-white border-gray-200 shadow-sm';
  const modalBg = isDark ? 'bg-[#161625] border-white/10' : 'bg-white border-gray-200 shadow-2xl';

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold text-white ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {toast.message}
        </motion.div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${textMain} flex items-center gap-2.5`}>
            <CreditCard className="text-violet-500" size={26} />
            <span>Manage Subscription Plans</span>
          </h1>
          <p className={`text-sm mt-1 font-medium ${textMuted}`}>
            Configure pricing, billing periods, features, free tiers, and active status for all EduGuide AI tiers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPlans}
            className={`p-2.5 rounded-xl border transition-colors ${
              isDark ? 'border-white/10 text-gray-300 hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
            title="Refresh Plans"
          >
            <RefreshCw size={15} />
          </button>
          
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-violet-500/25 transition-all"
          >
            <Plus size={16} />
            <span>Create New Plan</span>
          </button>
        </div>
      </div>

      {/* Plans List Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className={`text-center py-16 rounded-2xl border ${cardBg}`}>
          <Sparkles className="mx-auto mb-3 opacity-30 text-violet-400" size={40} />
          <p className={`font-bold text-base ${textMain}`}>No Subscription Plans Configured</p>
          <p className={`text-xs mt-1 ${textMuted}`}>Click "Create New Plan" to set up your first pricing plan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const badgeCls = COLOR_MAP[plan.color] || COLOR_MAP.indigo;
            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-6 flex flex-col justify-between transition-all relative ${cardBg} ${
                  !plan.active ? 'opacity-60 grayscale-[0.4]' : ''
                }`}
              >
                <div>
                  {/* Status & Color Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${badgeCls}`}>
                      {plan.color || 'indigo'} Accent
                    </span>

                    <button
                      onClick={() => togglePlanActive(plan)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition-colors ${
                        plan.active
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {plan.active ? 'ACTIVE' : 'DRAFT'}
                    </button>
                  </div>

                  {/* Plan Name & Price */}
                  <h3 className={`text-xl font-extrabold ${textMain}`}>{plan.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className={`text-3xl font-black ${textMain}`}>
                      {plan.is_free ? 'FREE' : `${plan.currency || 'LKR'} ${Number(plan.price).toLocaleString()}`}
                    </span>
                    {!plan.is_free && (
                      <span className={`text-xs font-semibold ${textMuted}`}>/{plan.billing_period || 'monthly'}</span>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="mt-6 pt-5 border-t border-inherit space-y-2.5">
                    <p className={`text-[11px] font-bold uppercase tracking-wider ${textMuted}`}>Included Features:</p>
                    {Array.isArray(plan.features) && plan.features.length > 0 ? (
                      plan.features.map((feat, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs font-medium">
                          <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className={textMain}>{feat}</span>
                        </div>
                      ))
                    ) : (
                      <p className={`text-xs italic ${textMuted}`}>No specific features listed</p>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-8 pt-4 border-t border-inherit flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(plan)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs font-bold transition-all"
                  >
                    <Edit2 size={13} /> Edit Plan
                  </button>

                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all"
                    title="Delete Plan"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Plan Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${modalBg}`}
          >
            <div className="flex items-center justify-between border-b border-inherit pb-4 mb-5">
              <h2 className={`text-lg font-bold ${textMain} flex items-center gap-2`}>
                <Sparkles className="text-violet-500" size={18} />
                <span>{editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}</span>
              </h2>
              <button onClick={() => setModalOpen(false)} className={`p-1 rounded-lg ${textMuted} hover:text-gray-200`}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              {/* Name */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${textMuted}`}>Plan Title / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pro Student, Premium Plus, Custom Enterprise"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                    isDark ? 'bg-slate-950 border-white/15 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {/* Free Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-inherit bg-violet-500/5">
                <div>
                  <p className={`text-xs font-bold ${textMain}`}>Free Tier Plan</p>
                  <p className={`text-[11px] ${textMuted}`}>Check this to make the plan 100% free (Price LKR 0)</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.is_free}
                  onChange={e => setForm(f => ({ ...f, is_free: e.target.checked, price: e.target.checked ? 0 : f.price }))}
                  className="w-5 h-5 accent-violet-600 rounded cursor-pointer"
                />
              </div>

              {/* Pricing & Currency */}
              {!form.is_free && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${textMuted}`}>Price Amount</label>
                    <input
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                        isDark ? 'bg-slate-950 border-white/15 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${textMuted}`}>Currency</label>
                    <select
                      value={form.currency}
                      onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                        isDark ? 'bg-slate-950 border-white/15 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="LKR">LKR (Sri Lankan Rupee)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Billing Period & Accent Color */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${textMuted}`}>Billing Period</label>
                  <select
                    value={form.billing_period}
                    onChange={e => setForm(f => ({ ...f, billing_period: e.target.value }))}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                      isDark ? 'bg-slate-950 border-white/15 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${textMuted}`}>Badge Accent Color</label>
                  <select
                    value={form.color}
                    onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                      isDark ? 'bg-slate-950 border-white/15 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="indigo">Indigo</option>
                    <option value="violet">Violet</option>
                    <option value="amber">Amber Gold</option>
                    <option value="emerald">Emerald Green</option>
                    <option value="rose">Rose Pink</option>
                    <option value="slate">Slate Gray</option>
                  </select>
                </div>
              </div>

              {/* Features Editor */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${textMuted}`}>Plan Features</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add feature item..."
                    value={newFeatureInput}
                    onChange={e => setNewFeatureInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                      isDark ? 'bg-slate-950 border-white/15 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={addFeature}
                    className="px-3.5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-xs transition-all"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {form.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/5 border border-inherit text-xs">
                      <span className={textMain}>{feat}</span>
                      <button type="button" onClick={() => removeFeature(idx)} className="text-rose-400 hover:text-rose-300 p-0.5">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-inherit flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    isDark ? 'border-white/10 text-gray-300 hover:bg-white/5' : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-violet-500/25 transition-all disabled:opacity-60"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  <span>{editingPlan ? 'Save Changes' : 'Create Plan'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;

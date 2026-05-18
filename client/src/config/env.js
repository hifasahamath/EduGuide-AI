/**
 * Centralized API URL configuration.
 *
 * LOCAL DEVELOPMENT  → falls back to http://localhost:5000/api
 * PRODUCTION (Vercel) → reads VITE_API_URL from .env.production
 *
 * Never hardcode localhost URLs in components — import from here instead.
 */
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export default API_BASE;

// Named endpoint helpers for convenience
export const API_AUTH   = `${API_BASE}/auth`;
export const API_CHAT   = `${API_BASE}/chat`;
export const API_COURSES = `${API_BASE}/courses`;
export const API_FAQ    = `${API_BASE}/faq`;
export const API_USERS  = `${API_BASE}/users`;
export const API_ANALYTICS = `${API_BASE}/analytics`;
export const API_TRAINING  = `${API_BASE}/training`;
export const API_SETTINGS  = `${API_BASE}/settings`;

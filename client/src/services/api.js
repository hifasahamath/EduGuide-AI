import axios from 'axios';
import { supabase } from '../lib/supabase';

// Base URL for our Express server API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Automatically attach Supabase JWT token to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
}, (error) => Promise.reject(error));


// ── Chat API ──────────────────────────────────────────────
export const sendChatMessage = (data) => api.post('/chat', data);
export const createChatSession = (title) => api.post('/chat/sessions', { title });
export const getChatSessions = () => api.get('/chat/sessions');
export const getChatSession = (id) => api.get(`/chat/sessions/${id}`);
export const deleteChatSession = (id) => api.delete(`/chat/sessions/${id}`);
export const renameChatSession = (id, title) => api.patch(`/chat/sessions/${id}/rename`, { title });
export const pinChatSession = (id, pinned) => api.patch(`/chat/sessions/${id}/pin`, { pinned });

// ── Courses API ───────────────────────────────────────────
export const getCourses = () => api.get('/courses');
export const addCourse = (data) => api.post('/courses', data);
export const updateCourse = (id, data) => api.put(`/courses/${id}`, data);
export const deleteCourse = (id) => api.delete(`/courses/${id}`);
export const bulkImportCourses = (data) => api.post('/courses/bulk', data);

// ── FAQ API ───────────────────────────────────────────────
export const getFaqs = () => api.get('/faq');
export const addFaq = (data) => api.post('/faq', data);
export const updateFaq = (id, data) => api.put(`/faq/${id}`, data);
export const deleteFaq = (id) => api.delete(`/faq/${id}`);
export const suggestFaqs = (q) => api.get(`/faq/suggest?q=${q}`);

// ── Training API ──────────────────────────────────────────
export const getPendingTraining = () => api.get('/training/pending');
export const getTrainedData = () => api.get('/training/trained');
export const respondToTraining = (data) => api.post('/training/respond', data);
export const deleteTraining = (id) => api.delete(`/training/${id}`);

// ── Document Upload API (for RAG knowledge base) ──────────
export const getDocuments = () => api.get('/training/documents');
export const uploadDocument = (formData) => api.post('/training/documents/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteDocument = (id) => api.delete(`/training/documents/${id}`);

// ── Users & Profile API ──────────────────────────────────
export const getUsers = () => api.get('/users');
export const updateProfile = (id, data) => api.put(`/auth/profile/${id}`, data);
export const updateAiSettings = (id, data) => api.put(`/auth/profile/${id}/ai-settings`, data);
export const getActivityLog = (id) => api.get(`/auth/profile/${id}/activity`);

// ── Settings & Analytics ─────────────────────────────────
export const getSettings = (id) => api.get(`/settings/${id}`);
export const saveSettings = (id, data) => api.put(`/settings/${id}`, data);
export const getDashboardAnalytics = () => api.get('/analytics/dashboard');
export const getInsightsAnalytics = () => api.get('/analytics/insights');

// Attach helper methods directly to api instance for backward compatibility
api.getCourses = getCourses;
api.addCourse = addCourse;
api.updateCourse = updateCourse;
api.deleteCourse = deleteCourse;
api.bulkImportCourses = bulkImportCourses;

api.getFaqs = getFaqs;
api.addFaq = addFaq;
api.updateFaq = updateFaq;
api.deleteFaq = deleteFaq;
api.suggestFaqs = suggestFaqs;

api.getPendingTraining = getPendingTraining;
api.getTrainedData = getTrainedData;
api.respondToTraining = respondToTraining;
api.deleteTraining = deleteTraining;

api.getDocuments = getDocuments;
api.uploadDocument = uploadDocument;
api.deleteDocument = deleteDocument;

api.getUsers = getUsers;
api.updateProfile = updateProfile;
api.updateAiSettings = updateAiSettings;
api.getActivityLog = getActivityLog;

api.getSettings = getSettings;
api.saveSettings = saveSettings;
api.getDashboardAnalytics = getDashboardAnalytics;
api.getInsightsAnalytics = getInsightsAnalytics;

export { api };
export default api;

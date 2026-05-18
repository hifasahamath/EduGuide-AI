import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  // Courses
  getCourses: () => axios.get(`${API_URL}/courses`),
  addCourse: (data) => axios.post(`${API_URL}/courses`, data),
  updateCourse: (id, data) => axios.put(`${API_URL}/courses/${id}`, data),
  deleteCourse: (id) => axios.delete(`${API_URL}/courses/${id}`),
  bulkImportCourses: (courses) => axios.post(`${API_URL}/courses/bulk`, { courses }),

  // FAQ
  getFaqs: () => axios.get(`${API_URL}/faq`),
  addFaq: (data) => axios.post(`${API_URL}/faq`, data),
  updateFaq: (id, data) => axios.put(`${API_URL}/faq/${id}`, data),
  deleteFaq: (id) => axios.delete(`${API_URL}/faq/${id}`),

  // Training
  getPendingTraining: () => axios.get(`${API_URL}/training/pending`),
  respondToTraining: (id, response) => axios.post(`${API_URL}/training/respond`, { id, response }),

  // Users
  getUsers: () => axios.get(`${API_URL}/users`),

  // History
  getHistory: () => axios.get(`${API_URL}/history`),

  // Analytics
  getAnalytics: () => axios.get(`${API_URL}/analytics`),
};

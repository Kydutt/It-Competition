import api from './api';
import mockService from './mockService';

export const authService = {
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch {
      // Graceful fallback to mock service for frontend prototype
      return await mockService.login(credentials);
    }
  },

  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch {
      // Graceful fallback to mock service for frontend prototype
      return await mockService.register(userData);
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors in prototype mode
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
    return { success: true };
  },

  async getMe() {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch {
      // Return user from localStorage in mock mode
      const saved = localStorage.getItem('auth_user');
      if (saved) {
        return { success: true, data: JSON.parse(saved) };
      }
      throw new Error('Unauthenticated');
    }
  },
};

export default authService;

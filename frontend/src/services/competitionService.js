import api from './api';

export const competitionService = {
  // Public APIs
  async getCompetitions(params = {}) {
    const response = await api.get('/competitions', { params });
    return response.data;
  },

  async getCompetitionBySlug(slug) {
    const response = await api.get(`/competitions/${slug}`);
    return response.data;
  },

  // Admin APIs
  async getAdminCompetitions(params = {}) {
    const response = await api.get('/admin/competitions', { params });
    return response.data;
  },

  async getAdminCompetition(id) {
    const response = await api.get(`/admin/competitions/${id}`);
    return response.data;
  },

  async createCompetition(data) {
    const response = await api.post('/admin/competitions', data);
    return response.data;
  },

  async updateCompetition(id, data) {
    const response = await api.put(`/admin/competitions/${id}`, data);
    return response.data;
  },

  async deleteCompetition(id) {
    const response = await api.delete(`/admin/competitions/${id}`);
    return response.data;
  },

  async publishCompetition(id) {
    const response = await api.patch(`/admin/competitions/${id}/publish`);
    return response.data;
  },

  async unpublishCompetition(id) {
    const response = await api.patch(`/admin/competitions/${id}/unpublish`);
    return response.data;
  },

  async changeCompetitionStatus(id, status) {
    const response = await api.patch(`/admin/competitions/${id}/status`, { status });
    return response.data;
  },

  // Content APIs
  async getAnnouncements(params = {}) {
    const response = await api.get('/announcements', { params });
    return response.data;
  },

  async getAnnouncementBySlug(slug) {
    const response = await api.get(`/announcements/${slug}`);
    return response.data;
  },

  async getFaqs() {
    const response = await api.get('/faqs');
    return response.data;
  },

  async getSponsors() {
    const response = await api.get('/sponsors');
    return response.data;
  },

  async getWinners() {
    const response = await api.get('/winners');
    return response.data;
  },
};

export default competitionService;

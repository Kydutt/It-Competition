import api from './api';

export const registrationService = {
  // --- Participant Registrations ---
  async getRegistrations() {
    const response = await api.get('/participant/registrations');
    return response.data;
  },

  async getRegistration(id) {
    const response = await api.get(`/participant/registrations/${id}`);
    return response.data;
  },

  async createRegistration(data) {
    const response = await api.post('/participant/registrations', data);
    return response.data;
  },

  async submitRegistration(id) {
    const response = await api.post(`/participant/registrations/${id}/submit`);
    return response.data;
  },

  async cancelRegistration(id) {
    const response = await api.post(`/participant/registrations/${id}/cancel`);
    return response.data;
  },

  // --- Participant Teams ---
  async getTeams() {
    const response = await api.get('/participant/teams');
    return response.data;
  },

  async getTeam(id) {
    const response = await api.get(`/participant/teams/${id}`);
    return response.data;
  },

  async createTeam(data) {
    const response = await api.post('/participant/teams', data);
    return response.data;
  },

  async joinTeam(code) {
    const response = await api.post('/participant/teams/join', { code });
    return response.data;
  },

  async leaveTeam(teamId) {
    const response = await api.post(`/participant/teams/${teamId}/leave`);
    return response.data;
  },

  async removeTeamMember(teamId, userId) {
    const response = await api.delete(`/participant/teams/${teamId}/members/${userId}`);
    return response.data;
  },

  async transferLeadership(teamId, userId) {
    const response = await api.post(`/participant/teams/${teamId}/transfer-leadership`, { user_id: userId });
    return response.data;
  },

  async dissolveTeam(teamId) {
    const response = await api.delete(`/participant/teams/${teamId}`);
    return response.data;
  },

  // --- Admin Registrations ---
  async getAdminRegistrations(params = {}) {
    const response = await api.get('/admin/registrations', { params });
    return response.data;
  },

  async getAdminRegistration(id) {
    const response = await api.get(`/admin/registrations/${id}`);
    return response.data;
  },

  async approveRegistration(id) {
    const response = await api.post(`/admin/registrations/${id}/approve`);
    return response.data;
  },

  async rejectRegistration(id, rejectionReason) {
    const response = await api.post(`/admin/registrations/${id}/reject`, {
      rejection_reason: rejectionReason,
    });
    return response.data;
  },

  async requestRevision(id, revisionNote) {
    const response = await api.post(`/admin/registrations/${id}/revision`, {
      revision_note: revisionNote,
    });
    return response.data;
  },
};

export default registrationService;

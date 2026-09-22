import api from './api';

export const registrationService = {
  async getRegistrations() {
    const response = await api.get('/participant/registrations');
    return response.data;
  },

  async createRegistration(data) {
    const response = await api.post('/participant/registrations', data);
    return response.data;
  },

  async getAdminRegistrations() {
    const response = await api.get('/admin/registrations');
    return response.data;
  },

  async verifyRegistration(registrationId, verificationData) {
    const response = await api.put(`/admin/registrations/${registrationId}/verify`, verificationData);
    return response.data;
  },
};

export default registrationService;

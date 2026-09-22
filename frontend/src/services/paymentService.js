import api from './api';

export const paymentService = {
  // --- Participant Payments ---
  async getParticipantPayments() {
    const response = await api.get('/participant/payments');
    return response.data;
  },

  async getPayment(id) {
    const response = await api.get(`/participant/payments/${id}`);
    return response.data;
  },

  async createPayment(data) {
    const response = await api.post('/participant/payments', data);
    return response.data;
  },

  async uploadProof(paymentId, formData) {
    const response = await api.post(`/participant/payments/${paymentId}/proof`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async submitPayment(paymentId) {
    const response = await api.post(`/participant/payments/${paymentId}/submit`);
    return response.data;
  },

  async downloadProof(paymentId) {
    const response = await api.get(`/participant/payments/${paymentId}/proof`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // --- Admin Payments ---
  async getAdminPayments(params = {}) {
    const response = await api.get('/admin/payments', { params });
    return response.data;
  },

  async getAdminPayment(id) {
    const response = await api.get(`/admin/payments/${id}`);
    return response.data;
  },

  async approvePayment(id) {
    const response = await api.post(`/admin/payments/${id}/approve`);
    return response.data;
  },

  async rejectPayment(id, reason) {
    const response = await api.post(`/admin/payments/${id}/reject`, { reason });
    return response.data;
  },

  async downloadAdminProof(paymentId) {
    const response = await api.get(`/admin/payments/${paymentId}/proof`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default paymentService;

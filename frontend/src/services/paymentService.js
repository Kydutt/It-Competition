import api from './api';

export const paymentService = {
  async getParticipantPayments() {
    const response = await api.get('/participant/payments');
    return response.data;
  },

  async submitPayment(data) {
    const response = await api.post('/participant/payments', data);
    return response.data;
  },

  async getAdminPayments() {
    const response = await api.get('/admin/payments');
    return response.data;
  },

  async verifyPayment(paymentId, verificationData) {
    const response = await api.put(`/admin/payments/${paymentId}/verify`, verificationData);
    return response.data;
  },
};

export default paymentService;

import api from './api';

export const submissionService = {
  // --- Participant Submissions ---
  async getParticipantSubmissions() {
    const response = await api.get('/participant/submissions');
    return response.data;
  },

  async getSubmission(id) {
    const response = await api.get(`/participant/submissions/${id}`);
    return response.data;
  },

  async createSubmission(data) {
    const response = await api.post('/participant/submissions', data);
    return response.data;
  },

  async uploadFile(submissionId, formData) {
    const response = await api.post(`/participant/submissions/${submissionId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async removeFile(submissionId, fileId) {
    const response = await api.delete(`/participant/submissions/${submissionId}/files/${fileId}`);
    return response.data;
  },

  async submitSubmission(submissionId) {
    const response = await api.post(`/participant/submissions/${submissionId}/submit`);
    return response.data;
  },

  async downloadFile(submissionId, fileId) {
    const response = await api.get(`/participant/submissions/${submissionId}/files/${fileId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // --- Admin Submissions ---
  async getAdminSubmissions(params = {}) {
    const response = await api.get('/admin/submissions', { params });
    return response.data;
  },

  async getAdminSubmission(id) {
    const response = await api.get(`/admin/submissions/${id}`);
    return response.data;
  },

  async downloadAdminFile(submissionId, fileId) {
    const response = await api.get(`/admin/submissions/${submissionId}/files/${fileId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // --- Judge Placeholders (Phase 5) ---
  async getJudgeSubmissions() {
    const response = await api.get('/judge/submissions');
    return response.data;
  },

  async getJudgeSubmissionDetail(id) {
    const response = await api.get(`/judge/submissions/${id}`);
    return response.data;
  },

  async submitScore(scoreData) {
    const response = await api.post('/judge/scores', scoreData);
    return response.data;
  },
};

export default submissionService;

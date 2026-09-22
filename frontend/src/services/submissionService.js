import api from './api';

export const submissionService = {
  async getParticipantSubmissions() {
    const response = await api.get('/participant/submissions');
    return response.data;
  },

  async createSubmission(data) {
    const response = await api.post('/participant/submissions', data);
    return response.data;
  },

  async getAdminSubmissions() {
    const response = await api.get('/admin/submissions');
    return response.data;
  },

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

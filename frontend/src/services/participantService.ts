import { api } from '../lib/axios'
import type {
  DashboardResponse,
  ProfileResponse,
  TeamListResponse,
  TeamDetailResponse,
  RegistrationListResponse,
  RegistrationDetailResponse,
  RegistrationDocumentResponse,
  SubmissionListResponse,
  SubmissionDetailResponse,
  NotificationListResponse,
  NotificationDetailResponse,
} from '../types/participant'
import type { PaymentDetailResponse, PaymentListResponse } from '../types/payment'
import type { ApiResponse } from '../types/api'

export const participantService = {
  // Dashboard
  async getDashboard(): Promise<DashboardResponse> {
    const res = await api.get<DashboardResponse>('/api/v1/participant/dashboard')
    return res.data
  },

  // Profile
  async getProfile(): Promise<ProfileResponse> {
    const res = await api.get<ProfileResponse>('/api/v1/participant/profile')
    return res.data
  },

  async updateProfile(data: {
    name?: string
    phone?: string
    institution?: string
    education_level?: string
    identity_number?: string
    address?: string
  }): Promise<ProfileResponse> {
    const res = await api.put<ProfileResponse>('/api/v1/participant/profile', data)
    return res.data
  },

  async uploadAvatar(formData: FormData): Promise<ApiResponse<{ profile_photo_url: string }>> {
    const res = await api.post<ApiResponse<{ profile_photo_url: string }>>(
      '/api/v1/participant/profile/avatar',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return res.data
  },

  // Teams
  async getTeams(): Promise<TeamListResponse> {
    const res = await api.get<TeamListResponse>('/api/v1/participant/teams')
    return res.data
  },

  async getTeam(id: number): Promise<TeamDetailResponse> {
    const res = await api.get<TeamDetailResponse>(`/api/v1/participant/teams/${id}`)
    return res.data
  },

  async createTeam(name: string): Promise<TeamDetailResponse> {
    const res = await api.post<TeamDetailResponse>('/api/v1/participant/teams', { name })
    return res.data
  },

  async updateTeam(id: number, name: string): Promise<TeamDetailResponse> {
    const res = await api.put<TeamDetailResponse>(`/api/v1/participant/teams/${id}`, { name })
    return res.data
  },

  async addTeamMember(teamId: number, email: string): Promise<TeamDetailResponse> {
    const res = await api.post<TeamDetailResponse>(`/api/v1/participant/teams/${teamId}/members`, {
      email,
    })
    return res.data
  },

  async removeTeamMember(teamId: number, memberId: number): Promise<TeamDetailResponse> {
    const res = await api.delete<TeamDetailResponse>(
      `/api/v1/participant/teams/${teamId}/members/${memberId}`
    )
    return res.data
  },

  // Registrations
  async getRegistrations(params?: { status?: string; page?: number }): Promise<RegistrationListResponse> {
    const res = await api.get<RegistrationListResponse>('/api/v1/participant/registrations', {
      params,
    })
    return res.data
  },

  async getRegistration(id: number): Promise<RegistrationDetailResponse> {
    const res = await api.get<RegistrationDetailResponse>(`/api/v1/participant/registrations/${id}`)
    return res.data
  },

  async createRegistrationDraft(data: {
    competition_id: number
    team_id?: number | null
    notes?: string
  }): Promise<RegistrationDetailResponse> {
    const res = await api.post<RegistrationDetailResponse>(
      '/api/v1/participant/registrations',
      data
    )
    return res.data
  },

  async updateRegistrationDraft(id: number, notes: string): Promise<RegistrationDetailResponse> {
    const res = await api.put<RegistrationDetailResponse>(
      `/api/v1/participant/registrations/${id}`,
      { notes }
    )
    return res.data
  },

  async uploadDocument(
    registrationId: number,
    formData: FormData
  ): Promise<RegistrationDocumentResponse> {
    const res = await api.post<RegistrationDocumentResponse>(
      `/api/v1/participant/registrations/${registrationId}/documents`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return res.data
  },

  async submitRegistration(registrationId: number): Promise<RegistrationDetailResponse> {
    const res = await api.post<RegistrationDetailResponse>(
      `/api/v1/participant/registrations/${registrationId}/submit`
    )
    return res.data
  },

  // Submissions
  async getSubmissions(): Promise<SubmissionListResponse> {
    const res = await api.get<SubmissionListResponse>('/api/v1/participant/submissions')
    return res.data
  },

  async getSubmission(id: number): Promise<SubmissionDetailResponse> {
    const res = await api.get<SubmissionDetailResponse>(`/api/v1/participant/submissions/${id}`)
    return res.data
  },

  async submitWork(formData: FormData): Promise<SubmissionDetailResponse> {
    const res = await api.post<SubmissionDetailResponse>(
      '/api/v1/participant/submissions',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return res.data
  },

  async submitRevision(
    submissionId: number,
    formData: FormData
  ): Promise<SubmissionDetailResponse> {
    const res = await api.post<SubmissionDetailResponse>(
      `/api/v1/participant/submissions/${submissionId}/revisions`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return res.data
  },

  // Notifications
  async getNotifications(page = 1): Promise<NotificationListResponse> {
    const res = await api.get<NotificationListResponse>('/api/v1/participant/notifications', {
      params: { page },
    })
    return res.data
  },

  async markNotificationRead(id: number): Promise<NotificationDetailResponse> {
    const res = await api.patch<NotificationDetailResponse>(
      `/api/v1/participant/notifications/${id}/read`
    )
    return res.data
  },

  async markAllNotificationsRead(): Promise<ApiResponse<null>> {
    const res = await api.patch<ApiResponse<null>>('/api/v1/participant/notifications/read-all')
    return res.data
  },

  // Payments (Midtrans Snap)
  async getPayments(params?: { page?: number; per_page?: number }): Promise<PaymentListResponse> {
    const res = await api.get<PaymentListResponse>('/api/v1/participant/payments', { params })
    return res.data
  },

  async getRegistrationPayments(
    registrationId: number,
    params?: { page?: number; per_page?: number }
  ): Promise<PaymentListResponse> {
    const res = await api.get<PaymentListResponse>(
      `/api/v1/participant/registrations/${registrationId}/payments`,
      { params }
    )
    return res.data
  },

  async createOrReusePayment(registrationId: number): Promise<PaymentDetailResponse> {
    const res = await api.post<PaymentDetailResponse>(
      `/api/v1/participant/registrations/${registrationId}/payments`
    )
    return res.data
  },

  async getPayment(paymentId: number): Promise<PaymentDetailResponse> {
    const res = await api.get<PaymentDetailResponse>(`/api/v1/participant/payments/${paymentId}`)
    return res.data
  },

  async syncPayment(paymentId: number): Promise<PaymentDetailResponse> {
    const res = await api.post<PaymentDetailResponse>(`/api/v1/participant/payments/${paymentId}/sync`)
    return res.data
  },
}

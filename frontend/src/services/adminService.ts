import api from '../lib/axios'
import type {
  AdminDashboardData,
  AdminEvent,
  AdminCategory,
  AdminCompetition,
  AdminRegistration,
  AdminSubmission,
  AdminAnnouncement,
  AdminFaq,
  AdminSchedule,
  ActivityLog,
} from '../types/admin'
import type { ApiResponse } from '../types/api'

export const adminService = {
  // Dashboard
  async getDashboard(): Promise<ApiResponse<AdminDashboardData>> {
    const res = await api.get<ApiResponse<AdminDashboardData>>('/api/v1/admin/dashboard')
    return res.data
  },

  // Events
  async getEvents(params?: { page?: number; per_page?: number }): Promise<ApiResponse<{ data: AdminEvent[]; current_page: number; last_page: number; total: number }>> {
    const res = await api.get('/api/v1/admin/events', { params })
    return res.data
  },

  async getEvent(id: number): Promise<ApiResponse<AdminEvent>> {
    const res = await api.get<ApiResponse<AdminEvent>>(`/api/v1/admin/events/${id}`)
    return res.data
  },

  async createEvent(data: Partial<AdminEvent>): Promise<ApiResponse<AdminEvent>> {
    const res = await api.post<ApiResponse<AdminEvent>>('/api/v1/admin/events', data)
    return res.data
  },

  async updateEvent(id: number, data: Partial<AdminEvent>): Promise<ApiResponse<AdminEvent>> {
    const res = await api.put<ApiResponse<AdminEvent>>(`/api/v1/admin/events/${id}`, data)
    return res.data
  },

  async deleteEvent(id: number): Promise<ApiResponse<null>> {
    const res = await api.delete<ApiResponse<null>>(`/api/v1/admin/events/${id}`)
    return res.data
  },

  // Categories
  async getCategories(): Promise<ApiResponse<AdminCategory[]>> {
    const res = await api.get<ApiResponse<AdminCategory[]>>('/api/v1/admin/categories')
    return res.data
  },

  async createCategory(data: Partial<AdminCategory>): Promise<ApiResponse<AdminCategory>> {
    const res = await api.post<ApiResponse<AdminCategory>>('/api/v1/admin/categories', data)
    return res.data
  },

  async updateCategory(id: number, data: Partial<AdminCategory>): Promise<ApiResponse<AdminCategory>> {
    const res = await api.put<ApiResponse<AdminCategory>>(`/api/v1/admin/categories/${id}`, data)
    return res.data
  },

  async deleteCategory(id: number): Promise<ApiResponse<null>> {
    const res = await api.delete<ApiResponse<null>>(`/api/v1/admin/categories/${id}`)
    return res.data
  },

  // Competitions
  async getCompetitions(params?: {
    page?: number
    per_page?: number
    event_id?: number
    category_id?: number
    status?: string
    search?: string
  }): Promise<ApiResponse<{ data: AdminCompetition[]; current_page: number; last_page: number; total: number }>> {
    const res = await api.get('/api/v1/admin/competitions', { params })
    return res.data
  },

  async getCompetition(id: number): Promise<ApiResponse<AdminCompetition>> {
    const res = await api.get<ApiResponse<AdminCompetition>>(`/api/v1/admin/competitions/${id}`)
    return res.data
  },

  async createCompetition(data: Partial<AdminCompetition>): Promise<ApiResponse<AdminCompetition>> {
    const res = await api.post<ApiResponse<AdminCompetition>>('/api/v1/admin/competitions', data)
    return res.data
  },

  async updateCompetition(id: number, data: Partial<AdminCompetition>): Promise<ApiResponse<AdminCompetition>> {
    const res = await api.put<ApiResponse<AdminCompetition>>(`/api/v1/admin/competitions/${id}`, data)
    return res.data
  },

  async deleteCompetition(id: number): Promise<ApiResponse<null>> {
    const res = await api.delete<ApiResponse<null>>(`/api/v1/admin/competitions/${id}`)
    return res.data
  },

  // Registrations
  async getRegistrations(params?: {
    page?: number
    per_page?: number
    competition_id?: number | string
    category_id?: number | string
    status?: string
    search?: string
  }): Promise<ApiResponse<{ data: AdminRegistration[]; current_page: number; last_page: number; total: number }>> {
    const res = await api.get('/api/v1/admin/registrations', { params })
    return res.data
  },

  async getRegistration(id: number): Promise<ApiResponse<{ registration: AdminRegistration; audit_logs: ActivityLog[] }>> {
    const res = await api.get(`/api/v1/admin/registrations/${id}`)
    return res.data
  },

  async updateRegistrationStatus(id: number, status: string, note?: string): Promise<ApiResponse<AdminRegistration>> {
    const res = await api.patch<ApiResponse<AdminRegistration>>(`/api/v1/admin/registrations/${id}/status`, {
      status,
      note,
    })
    return res.data
  },

  async verifyDocument(documentId: number, status: string, note?: string): Promise<ApiResponse<any>> {
    const res = await api.patch(`/api/v1/admin/documents/${documentId}/verify`, {
      status,
      note,
    })
    return res.data
  },

  async exportRegistrationsCsv(params?: { competition_id?: number | string; status?: string }): Promise<Blob> {
    const res = await api.get('/api/v1/admin/reports/registrations', {
      params,
      responseType: 'blob',
    })
    return res.data
  },

  // Submissions
  async getSubmissions(params?: {
    page?: number
    per_page?: number
    competition_id?: number | string
    status?: string
    search?: string
  }): Promise<ApiResponse<{ data: AdminSubmission[]; current_page: number; last_page: number; total: number }>> {
    const res = await api.get('/api/v1/admin/submissions', { params })
    return res.data
  },

  async getSubmission(id: number): Promise<ApiResponse<AdminSubmission>> {
    const res = await api.get<ApiResponse<AdminSubmission>>(`/api/v1/admin/submissions/${id}`)
    return res.data
  },

  async reviewSubmission(id: number, status: string, notes?: string): Promise<ApiResponse<AdminSubmission>> {
    const res = await api.patch<ApiResponse<AdminSubmission>>(`/api/v1/admin/submissions/${id}/review`, {
      status,
      notes,
    })
    return res.data
  },

  async exportSubmissionsCsv(params?: { competition_id?: number | string; status?: string }): Promise<Blob> {
    const res = await api.get('/api/v1/admin/reports/submissions', {
      params,
      responseType: 'blob',
    })
    return res.data
  },

  // Announcements
  async getAnnouncements(params?: {
    page?: number
    per_page?: number
    audience?: string
    status?: string
    search?: string
  }): Promise<ApiResponse<{ data: AdminAnnouncement[]; current_page: number; last_page: number; total: number }>> {
    const res = await api.get('/api/v1/admin/announcements', { params })
    return res.data
  },

  async createAnnouncement(data: Partial<AdminAnnouncement>): Promise<ApiResponse<AdminAnnouncement>> {
    const res = await api.post<ApiResponse<AdminAnnouncement>>('/api/v1/admin/announcements', data)
    return res.data
  },

  async updateAnnouncement(id: number, data: Partial<AdminAnnouncement>): Promise<ApiResponse<AdminAnnouncement>> {
    const res = await api.put<ApiResponse<AdminAnnouncement>>(`/api/v1/admin/announcements/${id}`, data)
    return res.data
  },

  async deleteAnnouncement(id: number): Promise<ApiResponse<null>> {
    const res = await api.delete<ApiResponse<null>>(`/api/v1/admin/announcements/${id}`)
    return res.data
  },

  // FAQs
  async getFaqs(params?: { category?: string; search?: string }): Promise<ApiResponse<AdminFaq[]>> {
    const res = await api.get<ApiResponse<AdminFaq[]>>('/api/v1/admin/faqs', { params })
    return res.data
  },

  async createFaq(data: Partial<AdminFaq>): Promise<ApiResponse<AdminFaq>> {
    const res = await api.post<ApiResponse<AdminFaq>>('/api/v1/admin/faqs', data)
    return res.data
  },

  async updateFaq(id: number, data: Partial<AdminFaq>): Promise<ApiResponse<AdminFaq>> {
    const res = await api.put<ApiResponse<AdminFaq>>(`/api/v1/admin/faqs/${id}`, data)
    return res.data
  },

  async deleteFaq(id: number): Promise<ApiResponse<null>> {
    const res = await api.delete<ApiResponse<null>>(`/api/v1/admin/faqs/${id}`)
    return res.data
  },

  // Schedules
  async getSchedules(params?: { event_id?: number }): Promise<ApiResponse<AdminSchedule[]>> {
    const res = await api.get<ApiResponse<AdminSchedule[]>>('/api/v1/admin/schedules', { params })
    return res.data
  },

  async createSchedule(data: Partial<AdminSchedule>): Promise<ApiResponse<AdminSchedule>> {
    const res = await api.post<ApiResponse<AdminSchedule>>('/api/v1/admin/schedules', data)
    return res.data
  },

  async updateSchedule(id: number, data: Partial<AdminSchedule>): Promise<ApiResponse<AdminSchedule>> {
    const res = await api.put<ApiResponse<AdminSchedule>>(`/api/v1/admin/schedules/${id}`, data)
    return res.data
  },

  async deleteSchedule(id: number): Promise<ApiResponse<null>> {
    const res = await api.delete<ApiResponse<null>>(`/api/v1/admin/schedules/${id}`)
    return res.data
  },

  // Activity Logs
  async getActivityLogs(params?: {
    page?: number
    per_page?: number
    action?: string
    entity_type?: string
    user_id?: number
    date_from?: string
    date_to?: string
  }): Promise<ApiResponse<{ data: ActivityLog[]; current_page: number; last_page: number; total: number }>> {
    const res = await api.get('/api/v1/admin/activity-logs', { params })
    return res.data
  },

  // Settings
  async getSettings(): Promise<ApiResponse<Record<string, string>>> {
    const res = await api.get<ApiResponse<Record<string, string>>>('/api/v1/admin/settings')
    return res.data
  },

  async updateSettings(settings: Record<string, any>): Promise<ApiResponse<Record<string, string>>> {
    const res = await api.patch<ApiResponse<Record<string, string>>>('/api/v1/admin/settings', { settings })
    return res.data
  },
}

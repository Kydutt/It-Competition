import { api } from '../lib/axios'
import type {
  CategoryListResponse,
  CompetitionDetailResponse,
  CompetitionListResponse,
  EventDetailResponse,
  EventListResponse,
  FaqListResponse,
  PaginationParams,
  ScheduleListResponse,
  AnnouncementDetailResponse,
  AnnouncementListResponse,
  StatisticsResponse,
} from '../types/public'
import type { PaymentConfigResponse } from '../types/payment'

export const publicService = {
  /**
   * Fetch active published events
   */
  async getEvents(): Promise<EventListResponse> {
    const response = await api.get<EventListResponse>('/api/v1/events')
    return response.data
  },

  /**
   * Fetch event detail by slug
   */
  async getEventBySlug(slug: string): Promise<EventDetailResponse> {
    const response = await api.get<EventDetailResponse>(`/api/v1/events/${slug}`)
    return response.data
  },

  /**
   * Fetch competition categories
   */
  async getCategories(): Promise<CategoryListResponse> {
    const response = await api.get<CategoryListResponse>('/api/v1/categories')
    return response.data
  },

  /**
   * Fetch competitions with search, category, status, and pagination
   */
  async getCompetitions(params?: PaginationParams): Promise<CompetitionListResponse> {
    const response = await api.get<CompetitionListResponse>('/api/v1/competitions', { params })
    return response.data
  },

  /**
   * Fetch single competition detail by slug
   */
  async getCompetitionBySlug(slug: string): Promise<CompetitionDetailResponse> {
    const response = await api.get<CompetitionDetailResponse>(`/api/v1/competitions/${slug}`)
    return response.data
  },

  /**
   * Fetch published schedule / timeline
   */
  async getSchedules(eventId?: number): Promise<ScheduleListResponse> {
    const response = await api.get<ScheduleListResponse>('/api/v1/schedules', {
      params: eventId ? { event_id: eventId } : undefined,
    })
    return response.data
  },

  /**
   * Fetch published announcements
   */
  async getAnnouncements(page = 1, perPage = 9): Promise<AnnouncementListResponse> {
    const response = await api.get<AnnouncementListResponse>('/api/v1/announcements', {
      params: { page, per_page: perPage },
    })
    return response.data
  },

  /**
   * Fetch single announcement by slug
   */
  async getAnnouncementBySlug(slug: string): Promise<AnnouncementDetailResponse> {
    const response = await api.get<AnnouncementDetailResponse>(`/api/v1/announcements/${slug}`)
    return response.data
  },

  /**
   * Fetch FAQs optionally filtered by category
   */
  async getFaqs(category?: string): Promise<FaqListResponse> {
    const response = await api.get<FaqListResponse>('/api/v1/faqs', {
      params: category ? { category } : undefined,
    })
    return response.data
  },

  /**
   * Fetch aggregated public statistics
   */
  async getStatistics(): Promise<StatisticsResponse> {
    const response = await api.get<StatisticsResponse>('/api/v1/public/statistics')
    return response.data
  },

  /**
   * Fetch public payment activation status and Midtrans Snap client configuration
   */
  async getPaymentConfig(eventId?: number): Promise<PaymentConfigResponse> {
    const response = await api.get<PaymentConfigResponse>('/api/v1/public/payment-config', {
      params: eventId ? { event_id: eventId } : undefined,
    })
    return response.data
  },
}

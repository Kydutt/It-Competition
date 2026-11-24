import type { ApiResponse } from './api'

export interface CompetitionCategory {
  id: number
  name: string
  slug: string
  description?: string
  competitions_count?: number
}

export interface Competition {
  id: number
  name: string
  slug: string
  short_description: string
  description: string
  cover_image_url?: string | null
  eligibility: string
  registration_type: 'individual' | 'team'
  min_members: number
  max_members: number
  registration_fee: number
  registration_start: string | null
  registration_deadline: string | null
  submission_deadline: string | null
  status: 'draft' | 'published' | 'registration_open' | 'registration_closed' | 'submission_phase' | 'completed' | 'archived'
  category?: CompetitionCategory
  contact_information?: Record<string, string>
  event?: Event
}

export interface Event {
  id: number
  name: string
  slug: string
  theme: string
  description: string
  start_date: string | null
  end_date: string | null
  location: string
  status: 'draft' | 'published' | 'archived'
  competitions_count?: number
  competitions?: Competition[]
}

export interface Schedule {
  id: number
  event_id: number
  title: string
  description?: string
  start_at: string
  end_at: string | null
  location: string
  meeting_url?: string | null
  is_published: boolean
}

export interface Announcement {
  id: number
  event_id: number
  competition_id?: number | null
  title: string
  slug: string
  content: string
  excerpt: string
  thumbnail_url?: string | null
  audience: 'public' | 'all_participants' | 'specific_competition'
  status: 'draft' | 'published' | 'archived'
  published_at: string | null
  created_at: string
  event_name?: string
  competition_name?: string
}

export interface Faq {
  id: number
  question: string
  answer: string
  category: string
  sort_order: number
}

export interface PublicStatistics {
  total_events: number
  total_competitions: number
  total_categories: number
  total_registrations: number
  total_participants: number
}

export interface PaginationParams {
  page?: number
  per_page?: number
  search?: string
  category?: string
  event?: string
  status?: string
  type?: string
}

export type EventListResponse = ApiResponse<Event[]>
export type EventDetailResponse = ApiResponse<Event>
export type CategoryListResponse = ApiResponse<CompetitionCategory[]>
export type CompetitionListResponse = ApiResponse<Competition[]>
export type CompetitionDetailResponse = ApiResponse<Competition>
export type ScheduleListResponse = ApiResponse<Schedule[]>
export type AnnouncementListResponse = ApiResponse<Announcement[]>
export type AnnouncementDetailResponse = ApiResponse<Announcement>
export type FaqListResponse = ApiResponse<Faq[]>
export type StatisticsResponse = ApiResponse<PublicStatistics>

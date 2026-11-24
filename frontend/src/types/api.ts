export interface ParticipantProfile {
  phone?: string | null
  institution?: string | null
  education_level?: string | null
  identity_number?: string | null
  address?: string | null
  profile_photo_url?: string | null
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data: T
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    unread_count?: number
  } | null
}

export interface ApiError {
  success: false
  message: string
  errors?: Record<string, string[]>
}

export type UserRole = 'participant' | 'admin'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  is_active: boolean
  dashboard_url?: string
  profile?: ParticipantProfile | null
  created_at?: string
}

export interface PingData {
  status: string
  app: string
  version: string
  timestamp: string
}

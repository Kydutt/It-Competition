import type { Competition } from './public'
import type { User, ApiResponse } from './api'
import type { Payment } from './payment'

export interface ParticipantProfile {
  phone?: string | null
  institution?: string | null
  education_level?: string | null
  identity_number?: string | null
  address?: string | null
  profile_photo_url?: string | null
}

export interface TeamMember {
  id: number
  name: string
  email: string
  role: string
  member_role: 'leader' | 'member'
  profile?: ParticipantProfile | null
}

export interface Team {
  id: number
  name: string
  team_code: string
  leader?: User | null
  members?: TeamMember[]
  members_count?: number
  created_at?: string
}

export interface RegistrationDocument {
  id: number
  registration_id: number
  document_type: string
  original_filename: string
  mime_type: string
  file_size: number
  verification_status: 'pending' | 'verified' | 'rejected'
  verification_note?: string | null
  download_url: string
  verified_at?: string | null
  created_at?: string
}

export interface SubmissionRevision {
  id: number
  file_url?: string | null
  external_url?: string | null
  revision_note?: string | null
  submitted_at?: string
}

export interface Submission {
  id: number
  registration_id: number
  registration_number?: string
  competition_name?: string
  title: string
  description?: string | null
  file_url?: string | null
  external_url?: string | null
  repository_url?: string | null
  status: 'draft' | 'submitted' | 'under_review' | 'revision_required' | 'accepted' | 'rejected'
  submitted_at?: string
  review_note?: string | null
  revisions?: SubmissionRevision[]
  revisions_count?: number
  created_at?: string
}

export interface Registration {
  id: number
  registration_number: string
  status: 'draft' | 'submitted' | 'under_review' | 'revision_required' | 'approved' | 'rejected' | 'cancelled'
  registration_fee_snapshot?: number | null
  fee_locked_at?: string | null
  notes?: string | null
  admin_notes?: string | null
  submitted_at?: string | null
  verified_at?: string | null
  competition?: Competition
  participant?: User
  team?: Team
  documents?: RegistrationDocument[]
  submissions?: Submission[]
  latest_payment?: Payment | null
  created_at?: string
}

export interface NotificationItem {
  id: number
  title: string
  message: string
  type: string
  action_url?: string | null
  read_at?: string | null
  is_read: boolean
  created_at: string
}

export interface DashboardData {
  status_counts: {
    total: number
    draft: number
    submitted: number
    under_review: number
    revision_required: number
    approved: number
    rejected: number
    cancelled: number
  }
  recent_registrations: Registration[]
  announcements: Array<{
    id: number
    title: string
    slug: string
    excerpt: string
    published_at: string
  }>
  notifications: NotificationItem[]
  unread_notifications_count: number
  upcoming_deadlines: Array<{
    competition_name: string
    registration_number: string
    registration_deadline?: string
    submission_deadline?: string
    status: string
  }>
}

export type DashboardResponse = ApiResponse<DashboardData>
export type ProfileResponse = ApiResponse<User>
export type TeamListResponse = ApiResponse<Team[]>
export type TeamDetailResponse = ApiResponse<Team>
export type RegistrationListResponse = ApiResponse<Registration[]>
export type RegistrationDetailResponse = ApiResponse<Registration>
export type RegistrationDocumentResponse = ApiResponse<RegistrationDocument>
export type SubmissionListResponse = ApiResponse<Submission[]>
export type SubmissionDetailResponse = ApiResponse<Submission>
export type NotificationListResponse = ApiResponse<NotificationItem[]>
export type NotificationDetailResponse = ApiResponse<NotificationItem>

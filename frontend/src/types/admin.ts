export interface ActivityLog {
  id: number
  user_id?: number | null
  user?: {
    id: number
    name: string
    email: string
    role: string
  } | null
  action: string
  entity_type: string
  entity_id: number
  old_values?: Record<string, any> | null
  new_values?: Record<string, any> | null
  ip_address?: string | null
  user_agent?: string | null
  created_at: string
}

export interface AdminDashboardData {
  overview: {
    total_participants: number
    total_teams: number
    total_competitions: number
    total_events: number
    total_registrations: number
  }
  registrations_by_status: Record<string, number>
  submissions_by_status: Record<string, number>
  recent_activity_logs: ActivityLog[]
}

export interface AdminEvent {
  id: number
  name: string
  slug: string
  description?: string | null
  theme?: string | null
  start_date: string
  end_date: string
  location?: string | null
  status: 'draft' | 'published' | 'archived'
  competitions_count?: number
  competitions?: AdminCompetition[]
  created_at?: string
}

export interface AdminCategory {
  id: number
  name: string
  slug: string
  description?: string | null
  competitions_count?: number
  created_at?: string
}

export interface AdminCompetition {
  id: number
  event_id: number
  category_id: number
  name: string
  slug: string
  short_description?: string | null
  description: string
  cover_image_path?: string | null
  eligibility?: string | null
  registration_type: 'individual' | 'team'
  min_members?: number | null
  max_members?: number | null
  registration_fee?: number | string | null
  registration_start: string
  registration_deadline: string
  submission_deadline?: string | null
  status: 'draft' | 'published' | 'closed' | 'archived'
  guidebook_path?: string | null
  contact_information?: Record<string, any> | null
  event?: { id: number; name: string }
  category?: { id: number; name: string }
  registrations_count?: number
  created_at?: string
}

export interface AdminRegistrationDocument {
  id: number
  registration_id: number
  document_type: string
  file_path: string
  original_filename: string
  mime_type: string
  file_size: number
  verification_status: 'pending' | 'verified' | 'rejected'
  verification_note?: string | null
  verified_by?: number | null
  verified_at?: string | null
  verifier?: { id: number; name: string } | null
  created_at: string
}

export interface AdminRegistration {
  id: number
  registration_number: string
  competition_id: number
  participant_id: number
  team_id?: number | null
  status: 'draft' | 'submitted' | 'under_review' | 'revision_required' | 'approved' | 'rejected' | 'cancelled'
  notes?: string | null
  admin_notes?: string | null
  submitted_at?: string | null
  verified_at?: string | null
  verified_by?: number | null
  verifier?: { id: number; name: string; email: string } | null
  competition: {
    id: number
    name: string
    slug: string
    category_id?: number
    registration_type?: 'individual' | 'team'
    category?: { id: number; name: string }
    event?: { id: number; name: string }
  }
  participant?: {
    id: number
    name: string
    email: string
    profile?: {
      id?: number
      institution?: string | null
      phone?: string | null
      phone_number?: string | null
      education_level?: string | null
    } | null
  }
  user?: {
    id: number
    name: string
    email: string
    profile?: {
      id?: number
      institution?: string | null
      phone?: string | null
      phone_number?: string | null
      education_level?: string | null
    } | null
  }
  team?: {
    id: number
    name: string
    leader_id: number
    leader?: {
      id: number
      name: string
      email: string
      profile?: {
        institution?: string | null
        phone?: string | null
        phone_number?: string | null
      } | null
    } | null
    members?: Array<{
      id: number
      name?: string
      email?: string
      user_id?: number
      member_role?: string
      pivot?: {
        member_role?: string
        joined_at?: string
      }
      profile?: {
        institution?: string | null
        phone?: string | null
        phone_number?: string | null
      } | null
      user?: {
        id: number
        name: string
        email: string
        profile?: {
          institution?: string | null
          phone?: string | null
          phone_number?: string | null
        } | null
      }
    }>
  } | null
  documents?: AdminRegistrationDocument[]
  submissions?: AdminSubmission[]
  documents_count?: number
  submissions_count?: number
  created_at?: string
}

export interface AdminSubmissionRevision {
  id: number
  submission_id: number
  file_path?: string | null
  external_url?: string | null
  revision_note?: string | null
  submitted_at: string
}

export interface AdminSubmission {
  id: number
  registration_id: number
  title: string
  description?: string | null
  file_path?: string | null
  external_url?: string | null
  repository_url?: string | null
  status: 'submitted' | 'under_review' | 'revision_required' | 'accepted' | 'rejected'
  admin_notes?: string | null
  review_note?: string | null
  submitted_at: string
  revisions_count?: number
  revisions?: AdminSubmissionRevision[]
  registration?: AdminRegistration
}

export interface AdminAnnouncement {
  id: number
  event_id?: number | null
  competition_id?: number | null
  title: string
  slug: string
  content: string
  thumbnail_path?: string | null
  audience: 'public' | 'all_participants' | 'specific_competition'
  status: 'draft' | 'published' | 'archived'
  published_at?: string | null
  event?: { id: number; name: string } | null
  competition?: { id: number; name: string } | null
  created_at?: string
}

export interface AdminFaq {
  id: number
  question: string
  answer: string
  category?: string | null
  sort_order: number
  is_published: boolean
  created_at?: string
}

export interface AdminSchedule {
  id: number
  event_id: number
  title: string
  description?: string | null
  start_at: string
  end_at?: string | null
  location?: string | null
  meeting_url?: string | null
  is_published: boolean
  event?: { id: number; name: string }
  created_at?: string
}

export type UserRole = "member" | "organizer" | "admin"
export type EventStatus = "draft" | "published" | "cancelled"
export type EventType = "virtual" | "in_person" | "hybrid"
export type EventCategory = "Tech" | "Business" | "Arts" | "Sports" | "Education" | "Social" | "Other"
export type SponsorTier = "platinum" | "gold" | "silver" | "bronze" | "partner"

export interface Profile {
  id: string
  name: string
  email: string
  role: UserRole
  city?: string
  bio?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Community {
  id: string
  name: string
  description: string
  category: EventCategory
  city: string
  image_url?: string
  organizer_id: string
  organizer?: Profile
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  title: string
  description: string
  community_id: string
  community?: Community
  organizer_id: string
  organizer?: Profile

  // Required fields
  event_type: EventType
  status: EventStatus
  timezone: string
  start_date: string
  end_date: string

  // Optional core fields
  image_url?: string
  is_hidden?: boolean
  facebook_pixel_id?: string
  tags?: string[]

  // Location fields (required for in_person & hybrid)
  venue_name?: string
  address?: string
  city?: string
  show_map?: boolean
  location?: string // legacy field

  // Virtual event fields (required for virtual & hybrid)
  external_url?: string
  virtual_instructions?: string

  // Legacy fields (deprecated but kept for compatibility)
  event_date?: string // deprecated, use start_date
  duration_hours?: number // deprecated, calculate from start/end
  is_online?: boolean // deprecated, use event_type
  max_attendees?: number

  // Timestamps
  created_at: string
  updated_at: string

  // Relations
  agenda_items?: AgendaItem[]
  speakers?: Speaker[]
  sponsors?: Sponsor[]
  tickets?: Ticket[]
}

export type CheckInMethod = "qr_scan" | "manual" | "self_check_in"

export interface RSVP {
  id: string
  event_id: string
  event?: Event
  user_id: string
  user?: Profile
  ticket_id?: string
  ticket?: Ticket
  qr_code?: string
  qr_token?: string
  checked_in?: boolean
  check_in_count?: number
  check_in_time?: string // deprecated
  created_at: string
}

export interface CheckIn {
  id: string
  rsvp_id: string
  rsvp?: RSVP
  event_id: string
  event?: Event
  user_id: string
  user?: Profile
  checked_in_at: string
  checked_in_by?: string
  checked_in_by_profile?: Profile
  check_in_method: CheckInMethod
  notes?: string
  created_at: string
  updated_at: string
}

export interface CheckInStats {
  event_id: string
  event_title: string
  total_rsvps: number
  checked_in_count: number
  no_show_count: number
  check_in_rate: number
  first_check_in?: string
  last_check_in?: string
}

export interface CommunityFollower {
  id: string
  community_id: string
  user_id: string
  created_at: string
}

// ==========================================
// New event-related interfaces
// ==========================================

export interface AgendaItem {
  id: string
  event_id: string
  title: string
  description?: string
  start_time: string // HH:MM format
  end_time: string // HH:MM format
  order_index: number
  created_at: string
  updated_at: string
}

export interface Speaker {
  id: string
  event_id: string
  name: string
  title?: string // Job title/role
  bio?: string
  image_url?: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface Sponsor {
  id: string
  event_id: string
  name: string
  logo_url?: string
  tier?: SponsorTier
  website_url?: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface Ticket {
  id: string
  event_id: string
  name: string
  description?: string
  price: number
  quantity?: number // null = unlimited
  available_quantity?: number
  order_index: number
  created_at: string
  updated_at: string
}

// ==========================================
// Form input types (for creation/editing)
// ==========================================

export interface AgendaItemInput {
  id?: string // Optional for new items
  title: string
  description?: string
  start_time: string
  end_time: string
}

export interface SpeakerInput {
  id?: string
  name: string
  title?: string
  bio?: string
  image_url?: string
  imageFile?: File // For file upload
}

export interface SponsorInput {
  id?: string
  name: string
  logo_url?: string
  logoFile?: File // For file upload
  tier?: SponsorTier
  website_url?: string
}

export interface TicketInput {
  id?: string
  name: string
  description?: string
  price: number
  quantity?: number
}

export type UserRole = "member" | "organizer" | "admin"
export type EventStatus = "upcoming" | "past" | "cancelled"
export type EventCategory = "Tech" | "Business" | "Arts" | "Sports" | "Education" | "Social" | "Other"

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
  event_date: string
  duration_hours: number
  venue_name: string
  address: string
  city: string
  is_online: boolean
  max_attendees?: number
  image_url?: string
  status: EventStatus
  created_at: string
  updated_at: string
}

export interface RSVP {
  id: string
  event_id: string
  event?: Event
  user_id: string
  user?: Profile
  created_at: string
}

export interface CommunityFollower {
  id: string
  community_id: string
  user_id: string
  created_at: string
}

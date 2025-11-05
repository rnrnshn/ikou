import { createServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { Event

DetailHeader } from "./components/EventDetailHeader"
import { EventDetailContent } from "./components/EventDetailContent"
import { EventDetailSidebar } from "./components/EventDetailSidebar"

export const dynamic = "force-dynamic"

interface EventDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PublicEventDetailPage(props: EventDetailPageProps) {
  const params = await props.params
  const supabase = createServerClient()

  // Fetch event with all related data
  const { data: event, error } = await supabase
    .from("events")
    .select(`
      *,
      communities(id, name, category, city, organizer_id),
      event_agenda_items(id, title, description, start_time, end_time, order_index),
      event_speakers(id, name, title, bio, image_url, order_index),
      event_sponsors(id, name, tier, website_url, logo_url, order_index),
      event_tickets(id, name, description, price, quantity, available_quantity, order_index)
    `)
    .eq("id", params.id)
    .eq("status", "published")
    .single()

  if (error || !event) {
    redirect("/events")
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if user already has an RSVP
  let existingRSVP = null
  if (user) {
    const { data: rsvp } = await supabase
      .from("rsvps")
      .select("*, event_tickets(name, price)")
      .eq("event_id", event.id)
      .eq("user_id", user.id)
      .single()

    existingRSVP = rsvp
  }

  // Get RSVP count
  const { count: rsvpCount } = await supabase
    .from("rsvps")
    .select("id", { count: "exact", head: true })
    .eq("event_id", event.id)

  return (
    <div className="min-h-screen bg-background">
      <EventDetailHeader event={event} />

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <EventDetailContent event={event} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <EventDetailSidebar
              event={event}
              user={user}
              existingRSVP={existingRSVP}
              rsvpCount={rsvpCount || 0}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

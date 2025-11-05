import { createClient } from "@/lib/supabase-client"
import type { Event } from "@/types/models"
import type { EventFormData } from "./types"

// ==========================================
// Helper: Upload Images
// ==========================================

async function uploadImages(formData: EventFormData, organizerId: string) {
  const supabase = createClient()
  const timestamp = Date.now()
  const uploads = {
    event: null as string | null,
    speakers: [] as (string | null)[],
    sponsors: [] as (string | null)[],
  }

  // Upload main event image
  if (formData.imageFile) {
    const fileExt = formData.imageFile.name.split(".").pop()
    const fileName = `${organizerId}-${timestamp}.${fileExt}`
    const filePath = `events/${fileName}`

    const { error: uploadError } = await supabase.storage.from("images").upload(filePath, formData.imageFile)

    if (!uploadError) {
      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(filePath)
      uploads.event = publicUrl
    }
  }

  // Upload speaker images
  for (let i = 0; i < formData.speakers.length; i++) {
    const speaker = formData.speakers[i]
    if (speaker.imageFile instanceof File) {
      const fileExt = speaker.imageFile.name.split(".").pop()
      const fileName = `${organizerId}-${timestamp}-speaker-${i}.${fileExt}`
      const filePath = `speakers/${fileName}`

      const { error: uploadError } = await supabase.storage.from("images").upload(filePath, speaker.imageFile)

      if (!uploadError) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("images").getPublicUrl(filePath)
        uploads.speakers[i] = publicUrl
      }
    } else {
      uploads.speakers[i] = null
    }
  }

  // Upload sponsor logos
  for (let i = 0; i < formData.sponsors.length; i++) {
    const sponsor = formData.sponsors[i]
    if (sponsor.logoFile instanceof File) {
      const fileExt = sponsor.logoFile.name.split(".").pop()
      const fileName = `${organizerId}-${timestamp}-sponsor-${i}.${fileExt}`
      const filePath = `sponsors/${fileName}`

      const { error: uploadError } = await supabase.storage.from("images").upload(filePath, sponsor.logoFile)

      if (!uploadError) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("images").getPublicUrl(filePath)
        uploads.sponsors[i] = publicUrl
      }
    } else {
      uploads.sponsors[i] = null
    }
  }

  return uploads
}

// ==========================================
// Helper: Convert dates to UTC
// ==========================================

function convertToUTC(date: string, time: string, timezone: string): string {
  // For simplicity, we'll just combine date and time
  // In production, you'd use date-fns-tz or similar for proper timezone conversion
  return new Date(`${date}T${time}`).toISOString()
}

// ==========================================
// Create Event
// ==========================================

export async function createEvent(formData: EventFormData, communityId: string, organizerId: string): Promise<Event> {
  const supabase = createClient()

  try {
    // Step 1: Upload all images
    const imageUrls = await uploadImages(formData, organizerId)

    // Step 2: Create the main event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        title: formData.title,
        description: formData.description,
        event_type: formData.event_type,
        status: "published",
        timezone: formData.timezone,
        start_date: convertToUTC(formData.start_date, formData.start_time, formData.timezone),
        end_date: convertToUTC(formData.end_date, formData.end_time, formData.timezone),
        image_url: imageUrls.event,
        community_id: communityId,
        organizer_id: organizerId,
        is_hidden: formData.is_hidden,
        facebook_pixel_id: formData.facebook_pixel_id || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        // Location (for in_person & hybrid)
        venue_name: formData.venue_name || null,
        address: formData.address || null,
        city: formData.city || null,
        show_map: formData.show_map,
        // Virtual (for virtual & hybrid)
        external_url: formData.external_url || null,
        virtual_instructions: formData.virtual_instructions || null,
      })
      .select()
      .single()

    if (eventError) throw eventError

    // Step 3: Insert related entities in parallel
    await Promise.all([
      // Agenda items
      formData.agenda_items.length > 0 &&
        supabase.from("event_agenda_items").insert(
          formData.agenda_items.map((item, index) => ({
            event_id: event.id,
            title: item.title,
            description: item.description || null,
            start_time: item.start_time,
            end_time: item.end_time,
            order_index: index,
          }))
        ),

      // Speakers
      formData.speakers.length > 0 &&
        supabase.from("event_speakers").insert(
          formData.speakers.map((speaker, index) => ({
            event_id: event.id,
            name: speaker.name,
            title: speaker.title || null,
            bio: speaker.bio || null,
            image_url: imageUrls.speakers[index],
            order_index: index,
          }))
        ),

      // Sponsors
      formData.sponsors.length > 0 &&
        supabase.from("event_sponsors").insert(
          formData.sponsors.map((sponsor, index) => ({
            event_id: event.id,
            name: sponsor.name,
            logo_url: imageUrls.sponsors[index],
            tier: sponsor.tier || null,
            website_url: sponsor.website_url || null,
            order_index: index,
          }))
        ),

      // Tickets
      formData.tickets.length > 0 &&
        supabase.from("event_tickets").insert(
          formData.tickets.map((ticket, index) => ({
            event_id: event.id,
            name: ticket.name,
            description: ticket.description || null,
            price: ticket.price,
            quantity: ticket.quantity || null,
            available_quantity: ticket.quantity || null,
            order_index: index,
          }))
        ),
    ])

    return event
  } catch (error) {
    console.error("Error creating event:", error)
    throw error
  }
}

// ==========================================
// Save Draft
// ==========================================

export async function saveDraft(formData: EventFormData, communityId: string, organizerId: string): Promise<void> {
  // For MVP, just save to localStorage
  // In production, you'd save to the database
  localStorage.setItem(
    "event_draft",
    JSON.stringify({
      ...formData,
      community_id: communityId,
      organizer_id: organizerId,
      saved_at: new Date().toISOString(),
    })
  )
}

import { createClient } from "@/lib/supabase-client"
import { CheckIn, CheckInStats, RSVP, CheckInMethod } from "@/types/models"
import { validateQRCode, parseQRCodeData, QRCodeData } from "@/lib/qrcode"

export interface CheckInResult {
  success: boolean
  error?: string
  checkIn?: CheckIn
  rsvp?: RSVP
}

/**
 * Perform check-in for an RSVP using QR code data
 */
export async function checkInByQRCode(
  qrDataString: string,
  checkedInBy: string
): Promise<CheckInResult> {
  const supabase = createClient()

  try {
    // Parse QR code data
    const qrData = parseQRCodeData(qrDataString)
    if (!qrData) {
      return { success: false, error: "QR code inválido" }
    }

    // Validate QR code
    const validation = await validateQRCode(qrData)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    const rsvp = validation.rsvp

    // Create check-in record
    const { data: checkIn, error } = await supabase
      .from("event_check_ins")
      .insert({
        rsvp_id: rsvp.id,
        event_id: rsvp.event_id,
        user_id: rsvp.user_id,
        checked_in_by: checkedInBy,
        check_in_method: "qr_scan",
      })
      .select(`
        *,
        profiles!event_check_ins_user_id_fkey(id, name, email),
        events(id, title)
      `)
      .single()

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation - already checked in
        return { success: false, error: "Já realizou check-in neste evento" }
      }
      console.error("Check-in error:", error)
      return { success: false, error: "Erro ao realizar check-in" }
    }

    return { success: true, checkIn: checkIn as CheckIn, rsvp }
  } catch (error) {
    console.error("Check-in error:", error)
    return { success: false, error: "Erro ao realizar check-in" }
  }
}

/**
 * Perform manual check-in for an RSVP
 */
export async function checkInManually(
  rsvpId: string,
  eventId: string,
  checkedInBy: string,
  notes?: string
): Promise<CheckInResult> {
  const supabase = createClient()

  try {
    // Verify RSVP exists and belongs to event
    const { data: rsvp, error: rsvpError } = await supabase
      .from("rsvps")
      .select(`
        *,
        events!inner(id, title),
        profiles!inner(id, name, email)
      `)
      .eq("id", rsvpId)
      .eq("event_id", eventId)
      .single()

    if (rsvpError || !rsvp) {
      return { success: false, error: "RSVP não encontrado" }
    }

    if (rsvp.checked_in) {
      return { success: false, error: "Já realizou check-in", rsvp }
    }

    // Create check-in record
    const { data: checkIn, error } = await supabase
      .from("event_check_ins")
      .insert({
        rsvp_id: rsvpId,
        event_id: eventId,
        user_id: rsvp.user_id,
        checked_in_by: checkedInBy,
        check_in_method: "manual",
        notes,
      })
      .select(`
        *,
        profiles!event_check_ins_user_id_fkey(id, name, email),
        events(id, title)
      `)
      .single()

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Já realizou check-in neste evento" }
      }
      console.error("Manual check-in error:", error)
      return { success: false, error: "Erro ao realizar check-in" }
    }

    return { success: true, checkIn: checkIn as CheckIn, rsvp }
  } catch (error) {
    console.error("Manual check-in error:", error)
    return { success: false, error: "Erro ao realizar check-in" }
  }
}

/**
 * Undo a check-in (delete check-in record)
 */
export async function undoCheckIn(checkInId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase.from("event_check_ins").delete().eq("id", checkInId)

    if (error) {
      console.error("Undo check-in error:", error)
      return { success: false, error: "Erro ao desfazer check-in" }
    }

    return { success: true }
  } catch (error) {
    console.error("Undo check-in error:", error)
    return { success: false, error: "Erro ao desfazer check-in" }
  }
}

/**
 * Get all check-ins for an event
 */
export async function getEventCheckIns(eventId: string): Promise<CheckIn[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("event_check_ins")
    .select(`
      *,
      profiles!event_check_ins_user_id_fkey(id, name, email, avatar_url),
      rsvps!inner(id, ticket_id, event_tickets(id, name, price))
    `)
    .eq("event_id", eventId)
    .order("checked_in_at", { ascending: false })

  if (error) {
    console.error("Error fetching check-ins:", error)
    return []
  }

  return (data || []) as unknown as CheckIn[]
}

/**
 * Get check-in statistics for an event
 */
export async function getCheckInStats(eventId: string): Promise<CheckInStats | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("event_check_in_stats")
    .select("*")
    .eq("event_id", eventId)
    .single()

  if (error) {
    console.error("Error fetching check-in stats:", error)
    return null
  }

  return data as CheckInStats
}

/**
 * Get all RSVPs for an event with check-in status
 */
export async function getEventRSVPsWithCheckInStatus(eventId: string): Promise<RSVP[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("rsvps")
    .select(`
      *,
      profiles!inner(id, name, email, avatar_url),
      event_tickets(id, name, price)
    `)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching RSVPs:", error)
    return []
  }

  return (data || []) as unknown as RSVP[]
}

/**
 * Search RSVPs by name or email
 */
export async function searchRSVPs(eventId: string, query: string): Promise<RSVP[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("rsvps")
    .select(`
      *,
      profiles!inner(id, name, email, avatar_url),
      event_tickets(id, name, price)
    `)
    .eq("event_id", eventId)
    .or(`profiles.name.ilike.%${query}%,profiles.email.ilike.%${query}%`)
    .limit(20)

  if (error) {
    console.error("Error searching RSVPs:", error)
    return []
  }

  return (data || []) as unknown as RSVP[]
}

/**
 * Get user's tickets (RSVPs with QR codes)
 */
export async function getUserTickets(userId: string): Promise<RSVP[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("rsvps")
    .select(`
      *,
      events!inner(
        id,
        title,
        description,
        start_date,
        end_date,
        image_url,
        venue_name,
        address,
        city,
        event_type,
        status
      ),
      event_tickets(id, name, price)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching user tickets:", error)
    return []
  }

  return (data || []) as unknown as RSVP[]
}

/**
 * Export attendee list as CSV data
 */
export async function exportAttendeeList(
  eventId: string,
  filter?: "all" | "checked_in" | "no_shows"
): Promise<any[]> {
  const supabase = createClient()

  let query = supabase
    .from("rsvps")
    .select(`
      id,
      created_at,
      checked_in,
      profiles!inner(name, email),
      event_tickets(name, price),
      event_check_ins(checked_in_at)
    `)
    .eq("event_id", eventId)

  // Apply filter
  if (filter === "checked_in") {
    query = query.eq("checked_in", true)
  } else if (filter === "no_shows") {
    query = query.eq("checked_in", false)
  }

  const { data, error } = await query.order("created_at", { ascending: false })

  if (error) {
    console.error("Error exporting attendees:", error)
    return []
  }

  // Transform to flat structure for CSV
  return (data || []).map((rsvp: any) => ({
    nome: rsvp.profiles?.name || "—",
    email: rsvp.profiles?.email || "—",
    ingresso: rsvp.event_tickets?.name || "Gratuito",
    preco: rsvp.event_tickets?.price || 0,
    inscricao: new Date(rsvp.created_at).toLocaleString("pt-MZ"),
    check_in: rsvp.checked_in ? "Sim" : "Não",
    hora_check_in: rsvp.event_check_ins?.[0]?.checked_in_at
      ? new Date(rsvp.event_check_ins[0].checked_in_at).toLocaleString("pt-MZ")
      : "—",
  }))
}

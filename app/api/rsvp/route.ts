import { createServerClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"
import { generateQRToken, generateQRCodeImage, QRCodeData } from "@/lib/qrcode"
import { sendRSVPConfirmationEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { eventId, ticketId } = body

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    // Generate QR token for this RSVP
    const qrToken = generateQRToken()

    // Create RSVP
    const { data: rsvp, error: rsvpError } = await supabase
      .from("rsvps")
      .insert({
        event_id: eventId,
        user_id: user.id,
        ticket_id: ticketId || null,
        qr_token: qrToken,
      })
      .select(`
        *,
        event_tickets(id, name, price)
      `)
      .single()

    if (rsvpError) {
      if (rsvpError.code === "23505") {
        return NextResponse.json({ error: "Você já está inscrito neste evento" }, { status: 400 })
      }
      throw rsvpError
    }

    // Fetch event details
    const { data: event } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single()

    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single()

    // Generate QR code image
    const qrData: QRCodeData = {
      event_id: eventId,
      rsvp_id: rsvp.id,
      token: qrToken,
      created_at: rsvp.created_at,
    }
    const qrCodeDataUrl = await generateQRCodeImage(qrData)

    // Send confirmation email (don't wait for it)
    if (event && profile) {
      sendRSVPConfirmationEmail(
        user.email!,
        profile.name || "Participante",
        event,
        rsvp,
        qrCodeDataUrl
      ).catch((err) => {
        console.error("Error sending confirmation email:", err)
        // Don't fail the RSVP if email fails
      })
    }

    return NextResponse.json({ success: true, rsvp })
  } catch (error: any) {
    console.error("RSVP error:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao fazer inscrição" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createServerClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rsvpId = searchParams.get("rsvpId")

    if (!rsvpId) {
      return NextResponse.json({ error: "RSVP ID is required" }, { status: 400 })
    }

    // Delete RSVP (ticket quantity will be auto-incremented by trigger)
    const { error: deleteError } = await supabase
      .from("rsvps")
      .delete()
      .eq("id", rsvpId)
      .eq("user_id", user.id) // Ensure user can only delete their own RSVP

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete RSVP error:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao cancelar inscrição" },
      { status: 500 }
    )
  }
}

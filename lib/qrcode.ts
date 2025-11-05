import QRCode from "qrcode"
import { createClient } from "@/lib/supabase-client"

export interface QRCodeData {
  event_id: string
  rsvp_id: string
  token: string
  created_at: string
}

/**
 * Generate a QR code data string for an RSVP
 */
export function generateQRCodeData(data: QRCodeData): string {
  return JSON.stringify(data)
}

/**
 * Parse QR code data string
 */
export function parseQRCodeData(dataString: string): QRCodeData | null {
  try {
    const data = JSON.parse(dataString)
    if (data.event_id && data.rsvp_id && data.token) {
      return data as QRCodeData
    }
    return null
  } catch (error) {
    console.error("Error parsing QR code data:", error)
    return null
  }
}

/**
 * Generate QR code as data URL (base64 PNG)
 */
export async function generateQRCodeImage(data: QRCodeData): Promise<string> {
  const dataString = generateQRCodeData(data)
  return await QRCode.toDataURL(dataString, {
    width: 300,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  })
}

/**
 * Generate QR code as SVG string
 */
export async function generateQRCodeSVG(data: QRCodeData): Promise<string> {
  const dataString = generateQRCodeData(data)
  return await QRCode.toString(dataString, {
    type: "svg",
    width: 300,
    margin: 2,
  })
}

/**
 * Generate a unique token for RSVP
 */
export function generateQRToken(): string {
  return crypto.randomUUID()
}

/**
 * Validate QR code data against database
 */
export async function validateQRCode(
  qrData: QRCodeData
): Promise<{ valid: boolean; error?: string; rsvp?: any }> {
  const supabase = createClient()

  try {
    // Fetch the RSVP with the token
    const { data: rsvp, error } = await supabase
      .from("rsvps")
      .select(`
        *,
        events!inner(id, title, start_date, end_date, community_id),
        profiles!inner(id, name, email)
      `)
      .eq("id", qrData.rsvp_id)
      .eq("qr_token", qrData.token)
      .single()

    if (error || !rsvp) {
      return { valid: false, error: "QR code inválido ou expirado" }
    }

    // Verify event_id matches
    if (rsvp.events.id !== qrData.event_id) {
      return { valid: false, error: "QR code não pertence a este evento" }
    }

    // Check if already checked in
    if (rsvp.checked_in) {
      return { valid: false, error: "Já realizou check-in", rsvp }
    }

    return { valid: true, rsvp }
  } catch (error) {
    console.error("Error validating QR code:", error)
    return { valid: false, error: "Erro ao validar QR code" }
  }
}

/**
 * Download QR code as PNG file
 */
export function downloadQRCode(dataUrl: string, filename: string) {
  const link = document.createElement("a")
  link.href = dataUrl
  link.download = `${filename}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

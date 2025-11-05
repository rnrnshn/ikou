"use client"

import { RSVP } from "@/types/models"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Check, X, Download, ExternalLink } from "lucide-react"
import { useEffect, useState } from "react"
import { generateQRCodeImage, QRCodeData, generateQRToken } from "@/lib/qrcode"
import { createClient } from "@/lib/supabase-client"
import { downloadQRCode } from "@/lib/qrcode"

interface TicketCardProps {
  rsvp: RSVP
  isPast?: boolean
}

export function TicketCard({ rsvp, isPast = false }: TicketCardProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const event = rsvp.events
  const ticket = rsvp.event_tickets?.[0]

  useEffect(() => {
    generateQRCode()
  }, [rsvp])

  async function generateQRCode() {
    setLoading(true)
    try {
      const supabase = createClient()

      // Check if RSVP already has a QR token, if not generate one
      let qrToken = rsvp.qr_token
      if (!qrToken) {
        qrToken = generateQRToken()
        // Update RSVP with QR token
        await supabase.from("rsvps").update({ qr_token: qrToken }).eq("id", rsvp.id)
      }

      const qrData: QRCodeData = {
        event_id: rsvp.event_id,
        rsvp_id: rsvp.id,
        token: qrToken,
        created_at: rsvp.created_at,
      }

      const qrUrl = await generateQRCodeImage(qrData)
      setQrCodeUrl(qrUrl)
    } catch (error) {
      console.error("Error generating QR code:", error)
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    if (qrCodeUrl && event) {
      downloadQRCode(qrCodeUrl, `ticket-${event.title.replace(/\s+/g, "-").toLowerCase()}`)
    }
  }

  if (!event) return null

  const isUpcoming = new Date(event.start_date) >= new Date()
  const eventDate = new Date(event.start_date)

  return (
    <Card className={isPast ? "opacity-75" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
            <CardDescription className="mt-1">
              {ticket ? ticket.name : "Entrada Gratuita"}
            </CardDescription>
          </div>
          <Badge variant={rsvp.checked_in ? "default" : isPast ? "secondary" : "outline"}>
            {rsvp.checked_in ? (
              <>
                <Check className="h-3 w-3 mr-1" /> Check-in
              </>
            ) : isPast ? (
              <>
                <X className="h-3 w-3 mr-1" /> Não foi
              </>
            ) : (
              "Pendente"
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Event Details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <div className="font-medium">
                {eventDate.toLocaleDateString("pt-MZ", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <div className="text-muted-foreground">
                {eventDate.toLocaleTimeString("pt-MZ", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>

          {(event.venue_name || event.address) && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                {event.venue_name && <div className="font-medium">{event.venue_name}</div>}
                {event.address && <div className="text-muted-foreground">{event.address}</div>}
                {event.city && <div className="text-muted-foreground">{event.city}</div>}
              </div>
            </div>
          )}
        </div>

        {/* QR Code (only for upcoming events that haven't been checked in) */}
        {isUpcoming && !rsvp.checked_in && (
          <div className="border-t pt-4">
            <div className="flex flex-col items-center">
              <p className="text-sm font-medium mb-3">Seu QR Code de Entrada</p>
              {loading ? (
                <div className="w-48 h-48 bg-muted animate-pulse rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : qrCodeUrl ? (
                <>
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 rounded-lg" />
                  <p className="text-xs text-muted-foreground text-center mt-2 mb-3">
                    Apresente este código no evento para fazer check-in
                  </p>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Ingresso
                  </Button>
                </>
              ) : (
                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Erro ao gerar QR code</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Check-in Status */}
        {rsvp.checked_in && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
              <Check className="h-5 w-5" />
              <span className="font-medium">Check-in realizado</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="border-t pt-4">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <a href={`/dashboard/events/${event.id}`}>
              Ver Detalhes do Evento
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

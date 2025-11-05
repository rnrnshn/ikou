"use client"

import { useState } from "react"
import { Event } from "@/types/models"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase-client"
import { generateQRToken } from "@/lib/qrcode"
import { Loader2 } from "lucide-react"

interface RSVPDialogProps {
  event: Event
  tickets: any[]
  onClose: () => void
  onSuccess: () => void
}

export function RSVPDialog({ event, tickets, onClose, onSuccess }: RSVPDialogProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    tickets.length === 1 ? tickets[0].id : null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  async function handleRSVP() {
    if (!selectedTicketId && tickets.length > 0) {
      setError("Por favor, selecione um ingresso")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Call API route to create RSVP and send email
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          ticketId: selectedTicketId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer inscrição")
      }

      onSuccess()
    } catch (err: any) {
      console.error("RSVP error:", err)
      setError(err.message || "Erro ao fazer inscrição. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId)

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar Inscrição</DialogTitle>
          <DialogDescription>Selecione um ingresso para continuar</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ticket Selection */}
          {tickets.length > 0 ? (
            <div className="space-y-3">
              <Label>Selecione seu ingresso</Label>
              <RadioGroup value={selectedTicketId || ""} onValueChange={setSelectedTicketId}>
                {tickets.map((ticket) => {
                  const price = parseFloat(ticket.price)
                  const isAvailable = ticket.available_quantity > 0

                  return (
                    <div
                      key={ticket.id}
                      className={`flex items-start space-x-3 border rounded-lg p-4 ${
                        isAvailable ? "hover:bg-accent cursor-pointer" : "opacity-50"
                      }`}
                    >
                      <RadioGroupItem value={ticket.id} id={ticket.id} disabled={!isAvailable} />
                      <Label htmlFor={ticket.id} className="flex-1 cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{ticket.name}</p>
                            {ticket.description && (
                              <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {isAvailable ? (
                                <span>{ticket.available_quantity} disponíveis</span>
                              ) : (
                                <span className="text-red-600">Esgotado</span>
                              )}
                            </p>
                          </div>
                          <div className="ml-4">
                            {price === 0 ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Gratuito
                              </Badge>
                            ) : (
                              <p className="font-bold whitespace-nowrap">{price.toFixed(2)} MT</p>
                            )}
                          </div>
                        </div>
                      </Label>
                    </div>
                  )
                })}
              </RadioGroup>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Este evento não requer seleção de ingresso
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Summary */}
          {selectedTicket && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Total:</span>
                <span className="text-lg font-bold">
                  {parseFloat(selectedTicket.price) === 0
                    ? "Gratuito"
                    : `${parseFloat(selectedTicket.price).toFixed(2)} MT`}
                </span>
              </div>
              {parseFloat(selectedTicket.price) > 0 && (
                <p className="text-xs text-muted-foreground">
                  Nota: O pagamento será processado após a confirmação
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleRSVP} disabled={isSubmitting || (!selectedTicketId && tickets.length > 0)}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Processando..." : "Confirmar Inscrição"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { Event } from "@/types/models"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, Clock, Ticket } from "lucide-react"
import { RSVPDialog } from "./RSVPDialog"
import { useState } from "react"
import Link from "next/link"

interface EventDetailSidebarProps {
  event: Event
  user: any
  existingRSVP: any
  rsvpCount: number
}

export function EventDetailSidebar({ event, user, existingRSVP, rsvpCount }: EventDetailSidebarProps) {
  const [showRSVPDialog, setShowRSVPDialog] = useState(false)
  const tickets = (event as any).event_tickets || []

  // Sort tickets by price
  tickets.sort((a: any, b: any) => parseFloat(a.price) - parseFloat(b.price))

  const eventDate = new Date(event.start_date)
  const eventEndDate = new Date(event.end_date)
  const now = new Date()
  const isEventPast = eventEndDate < now
  const hasAvailableTickets = tickets.some((t: any) => t.available_quantity > 0)

  return (
    <div className="space-y-6 sticky top-8">
      {/* RSVP Card */}
      <Card>
        <CardHeader>
          <CardTitle>Inscrição</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* RSVP Count */}
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              <span className="font-semibold">{rsvpCount}</span> pessoas confirmadas
            </span>
          </div>

          {/* Event Status */}
          {isEventPast ? (
            <div className="text-center py-4">
              <Badge variant="secondary">Evento Encerrado</Badge>
            </div>
          ) : existingRSVP ? (
            <div className="space-y-3">
              <div className="text-center py-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                <Badge variant="default" className="bg-green-600 mb-2">
                  ✓ Você está Inscrito
                </Badge>
                {existingRSVP.event_tickets && (
                  <p className="text-sm text-muted-foreground">
                    Ingresso: {existingRSVP.event_tickets.name}
                  </p>
                )}
              </div>
              <Link href="/dashboard/my-tickets" className="block">
                <Button variant="outline" className="w-full">
                  Ver Meu Ingresso
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.length > 0 && !hasAvailableTickets && (
                <div className="text-center py-4">
                  <Badge variant="destructive">Ingressos Esgotados</Badge>
                </div>
              )}

              {user ? (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setShowRSVPDialog(true)}
                  disabled={tickets.length > 0 && !hasAvailableTickets}
                >
                  {tickets.length > 0 && !hasAvailableTickets ? "Esgotado" : "Inscrever-se"}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Link href={`/auth/login?redirect=/events/${event.id}`} className="block">
                    <Button className="w-full" size="lg">
                      Fazer Login para Inscrever
                    </Button>
                  </Link>
                  <p className="text-xs text-center text-muted-foreground">
                    Não tem conta?{" "}
                    <Link href={`/auth/register?redirect=/events/${event.id}`} className="text-primary hover:underline">
                      Cadastre-se
                    </Link>
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tickets Info */}
      {tickets.length > 0 && !existingRSVP && !isEventPast && (
        <Card>
          <CardHeader>
            <CardTitle>Ingressos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tickets.map((ticket: any) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex-1">
                    <p className="font-medium">{ticket.name}</p>
                    {ticket.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Ticket className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {ticket.available_quantity > 0 ? (
                          <span className="text-green-600">{ticket.available_quantity} disponíveis</span>
                        ) : (
                          <span className="text-red-600">Esgotado</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    {parseFloat(ticket.price) === 0 ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Gratuito
                      </Badge>
                    ) : (
                      <p className="font-bold">{parseFloat(ticket.price).toFixed(2)} MT</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="font-medium">Data de Início</p>
              <p className="text-muted-foreground">
                {eventDate.toLocaleDateString("pt-MZ", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="font-medium">Data de Término</p>
              <p className="text-muted-foreground">
                {eventEndDate.toLocaleDateString("pt-MZ", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {event.timezone && (
            <div>
              <p className="font-medium">Fuso Horário</p>
              <p className="text-muted-foreground">{event.timezone}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* RSVP Dialog */}
      {user && showRSVPDialog && (
        <RSVPDialog
          event={event}
          tickets={tickets}
          onClose={() => setShowRSVPDialog(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  )
}

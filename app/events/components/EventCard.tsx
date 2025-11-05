"use client"

import { Event } from "@/types/models"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Users, Ticket } from "lucide-react"
import Link from "next/link"

interface EventCardProps {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.start_date)
  const community = (event as any).communities
  const tickets = (event as any).event_tickets || []

  // Check if event has free tickets
  const hasFreeTickets = tickets.some((t: any) => parseFloat(t.price) === 0)
  const hasAvailableTickets = tickets.some((t: any) => t.available_quantity > 0)

  // Get lowest price
  const prices = tickets.map((t: any) => parseFloat(t.price)).filter((p: number) => p > 0)
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : null

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/events/${event.id}`}>
        {/* Event Image */}
        {event.image_url && (
          <div className="h-48 overflow-hidden">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        <CardHeader className="pb-3">
          {/* Event Type Badge */}
          <div className="flex items-center justify-between mb-2">
            <Badge variant={event.event_type === "virtual" ? "default" : "secondary"}>
              {event.event_type === "virtual" && "Virtual"}
              {event.event_type === "in_person" && "Presencial"}
              {event.event_type === "hybrid" && "Híbrido"}
            </Badge>

            {/* Price Badge */}
            {hasFreeTickets ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Gratuito
              </Badge>
            ) : lowestPrice ? (
              <Badge variant="outline">{lowestPrice.toFixed(2)} MT</Badge>
            ) : null}
          </div>

          {/* Event Title */}
          <h3 className="text-xl font-bold line-clamp-2 hover:text-primary transition-colors">
            {event.title}
          </h3>

          {/* Community Name */}
          {community && (
            <p className="text-sm text-muted-foreground">{community.name}</p>
          )}
        </CardHeader>

        <CardContent className="pb-3">
          {/* Event Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <div className="font-medium">
                  {eventDate.toLocaleDateString("pt-MZ", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
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

            {event.city && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{event.city}</span>
              </div>
            )}

            {/* Ticket Availability */}
            {tickets.length > 0 && (
              <div className="flex items-start gap-2">
                <Ticket className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">
                  {hasAvailableTickets ? (
                    <span className="text-green-600 font-medium">Ingressos Disponíveis</span>
                  ) : (
                    <span className="text-red-600 font-medium">Esgotado</span>
                  )}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Link>

      <CardFooter className="pt-3 border-t">
        <Link href={`/events/${event.id}`} className="w-full">
          <Button className="w-full" disabled={tickets.length > 0 && !hasAvailableTickets}>
            {tickets.length > 0 && !hasAvailableTickets ? "Esgotado" : "Ver Detalhes"}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

import { Event } from "@/types/models"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users } from "lucide-react"

interface EventDetailHeaderProps {
  event: Event
}

export function EventDetailHeader({ event }: EventDetailHeaderProps) {
  const community = (event as any).communities
  const eventDate = new Date(event.start_date)

  return (
    <div className="relative">
      {/* Banner Image */}
      {event.image_url && (
        <div className="h-[400px] w-full overflow-hidden">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        </div>
      )}

      {/* Event Header Info */}
      <div className={event.image_url ? "absolute bottom-0 left-0 right-0" : ""}>
        <div className="container py-8">
          <div className="max-w-4xl">
            {/* Event Type Badge */}
            <Badge variant={event.event_type === "virtual" ? "default" : "secondary"} className="mb-4">
              {event.event_type === "virtual" && "Virtual"}
              {event.event_type === "in_person" && "Presencial"}
              {event.event_type === "hybrid" && "Híbrido"}
            </Badge>

            {/* Event Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              {event.title}
            </h1>

            {/* Community Name */}
            {community && (
              <p className="text-lg text-muted-foreground mb-4">
                Organizado por <span className="font-semibold text-foreground">{community.name}</span>
              </p>
            )}

            {/* Event Meta */}
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
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

              {event.city && event.event_type !== "virtual" && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{event.venue_name || event.city}</div>
                    {event.address && <div className="text-muted-foreground">{event.address}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

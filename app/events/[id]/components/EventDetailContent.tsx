import { Event } from "@/types/models"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, User } from "lucide-react"

interface EventDetailContentProps {
  event: Event
}

export function EventDetailContent({ event }: EventDetailContentProps) {
  const agendaItems = (event as any).event_agenda_items || []
  const speakers = (event as any).event_speakers || []
  const sponsors = (event as any).event_sponsors || []

  // Sort by order_index
  agendaItems.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
  speakers.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
  sponsors.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))

  return (
    <div className="space-y-8">
      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre o Evento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
            {event.description}
          </p>
        </CardContent>
      </Card>

      {/* Agenda */}
      {agendaItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Agenda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agendaItems.map((item: any) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                  <div className="flex items-start gap-2 shrink-0">
                    <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div className="text-sm">
                      <div className="font-medium">
                        {new Date(item.start_time).toLocaleTimeString("pt-MZ", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      {item.end_time && (
                        <div className="text-muted-foreground">
                          {new Date(item.end_time).toLocaleTimeString("pt-MZ", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{item.title}</h4>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Speakers */}
      {speakers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Palestrantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {speakers.map((speaker: any) => (
                <div key={speaker.id} className="flex gap-4">
                  <div className="shrink-0">
                    {speaker.image_url ? (
                      <img
                        src={speaker.image_url}
                        alt={speaker.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{speaker.name}</h4>
                    {speaker.title && (
                      <p className="text-sm text-muted-foreground mb-2">{speaker.title}</p>
                    )}
                    {speaker.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-3">{speaker.bio}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sponsors */}
      {sponsors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Patrocinadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {sponsors.map((sponsor: any) => (
                <a
                  key={sponsor.id}
                  href={sponsor.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 hover:opacity-75 transition-opacity"
                >
                  {sponsor.logo_url ? (
                    <img
                      src={sponsor.logo_url}
                      alt={sponsor.name}
                      className="h-16 w-full object-contain"
                    />
                  ) : (
                    <div className="h-16 w-full bg-muted rounded flex items-center justify-center">
                      <span className="text-sm font-medium text-muted-foreground">
                        {sponsor.name}
                      </span>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-sm font-medium">{sponsor.name}</p>
                    {sponsor.tier && (
                      <Badge variant="outline" className="mt-1">
                        {sponsor.tier === "platinum" && "Platina"}
                        {sponsor.tier === "gold" && "Ouro"}
                        {sponsor.tier === "silver" && "Prata"}
                        {sponsor.tier === "bronze" && "Bronze"}
                        {sponsor.tier === "partner" && "Parceiro"}
                      </Badge>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Virtual Event Link */}
      {event.event_type !== "in_person" && event.external_url && (
        <Card>
          <CardHeader>
            <CardTitle>Link do Evento</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={event.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
            >
              {event.external_url}
            </a>
            {event.virtual_instructions && (
              <p className="text-sm text-muted-foreground mt-4 whitespace-pre-wrap">
                {event.virtual_instructions}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

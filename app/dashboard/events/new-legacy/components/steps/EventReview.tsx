import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import type { EventFormData } from "../../types"
import { Check, MapPin, Monitor, Globe, Calendar, Users, Award, Ticket } from "lucide-react"

interface EventReviewProps {
  formData: EventFormData
  imagePreview: string | null
}

export function EventReview({ formData, imagePreview }: EventReviewProps) {
  const eventTypeLabels = {
    virtual: "Virtual",
    in_person: "Presencial",
    hybrid: "Híbrido",
  }

  const eventTypeIcons = {
    virtual: Monitor,
    in_person: MapPin,
    hybrid: Globe,
  }

  const Icon = formData.event_type ? eventTypeIcons[formData.event_type] : Monitor

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Revisar e Publicar</h2>
        <p className="text-muted-foreground">Revise todos os detalhes do evento antes de publicar</p>
      </div>

      {/* Summary Cards */}
      <div className="space-y-4">
        {/* General Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Informações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              {imagePreview && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                  <Image src={imagePreview} alt="Event" fill className="object-cover" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">{formData.title || "Sem título"}</h3>
                <div className="flex items-center gap-2 mb-2">
                  {formData.event_type && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Icon className="h-3 w-3" />
                      {eventTypeLabels[formData.event_type]}
                    </Badge>
                  )}
                  {formData.is_hidden && <Badge variant="outline">Oculto</Badge>}
                </div>
                {formData.description && <p className="text-sm text-muted-foreground line-clamp-3">{formData.description}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Horário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Início</p>
                <p className="font-medium">
                  {formData.start_date} às {formData.start_time}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Término</p>
                <p className="font-medium">
                  {formData.end_date} às {formData.end_time}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Fuso horário: {formData.timezone}</p>
            {formData.agenda_items.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-2">Agenda ({formData.agenda_items.length} items)</p>
                <ul className="text-xs space-y-1">
                  {formData.agenda_items.slice(0, 3).map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-muted-foreground">
                        {item.start_time} - {item.end_time}:
                      </span>
                      <span>{item.title}</span>
                    </li>
                  ))}
                  {formData.agenda_items.length > 3 && (
                    <li className="text-muted-foreground">+{formData.agenda_items.length - 3} mais...</li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location (conditional) */}
        {(formData.event_type === "in_person" || formData.event_type === "hybrid") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" />
                Localização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{formData.venue_name || "Não especificado"}</p>
              <p className="text-sm text-muted-foreground">
                {formData.address || "Sem endereço"}
                {formData.city && `, ${formData.city}`}
              </p>
              {formData.show_map && <p className="text-xs text-muted-foreground mt-2">✓ Mapa será exibido</p>}
            </CardContent>
          </Card>
        )}

        {/* Virtual Platform (conditional) */}
        {(formData.event_type === "virtual" || formData.event_type === "hybrid") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Monitor className="h-5 w-5 text-purple-600" />
                Plataforma Virtual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm break-all">{formData.external_url || "Não especificado"}</p>
              {formData.virtual_instructions && (
                <p className="text-xs text-muted-foreground mt-2">{formData.virtual_instructions}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Speakers */}
        {formData.speakers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                Palestrantes ({formData.speakers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                {formData.speakers.map((speaker, i) => (
                  <li key={i}>
                    <span className="font-medium">{speaker.name}</span>
                    {speaker.title && <span className="text-muted-foreground"> - {speaker.title}</span>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Sponsors */}
        {formData.sponsors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600" />
                Patrocinadores ({formData.sponsors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                {formData.sponsors.map((sponsor, i) => (
                  <li key={i}>
                    <span className="font-medium">{sponsor.name}</span>
                    {sponsor.tier && <Badge variant="outline" className="ml-2 text-xs">{sponsor.tier}</Badge>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Tickets */}
        {formData.tickets.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Ticket className="h-5 w-5 text-green-600" />
                Ingressos ({formData.tickets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                {formData.tickets.map((ticket, i) => (
                  <li key={i} className="flex justify-between">
                    <span className="font-medium">{ticket.name}</span>
                    <span className="text-muted-foreground">
                      {ticket.price === 0 ? "Gratuito" : `${ticket.price} MZN`}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Final Note */}
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Nota:</strong> Após publicar, o evento ficará visível para todos os membros da comunidade. Você pode salvá-lo
          como rascunho para continuar editando mais tarde.
        </p>
      </div>
    </div>
  )
}

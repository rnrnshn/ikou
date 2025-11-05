import { Card, CardContent } from "@/components/ui/card"
import { Monitor, MapPin, Globe } from "lucide-react"
import type { EventType } from "@/types/models"

interface EventTypeSelectorProps {
  value: EventType | null
  onChange: (type: EventType) => void
  disabled?: boolean // For edit mode - event type is immutable
}

const EVENT_TYPES = [
  {
    type: "virtual" as const,
    icon: Monitor,
    title: "Virtual",
    description: "Evento online apenas, sem localização física",
    features: ["Plataforma virtual obrigatória", "Sem localização física", "Acesso remoto"],
  },
  {
    type: "in_person" as const,
    icon: MapPin,
    title: "Presencial",
    description: "Evento físico em um local específico",
    features: ["Localização obrigatória", "Sem componente virtual", "Presença física"],
  },
  {
    type: "hybrid" as const,
    icon: Globe,
    title: "Híbrido",
    description: "Combinação de presencial e virtual",
    features: ["Localização obrigatória", "Plataforma virtual obrigatória", "Acesso presencial e remoto"],
  },
]

export function EventTypeSelector({ value, onChange, disabled = false }: EventTypeSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Tipo de Evento</h2>
        {disabled ? (
          <p className="text-muted-foreground">
            O tipo de evento não pode ser alterado após a criação.
          </p>
        ) : (
          <p className="text-muted-foreground">
            Selecione o tipo de evento. Esta escolha determinará quais seções você precisará preencher.
          </p>
        )}
        {!disabled && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <span>
                <strong>Importante:</strong> O tipo de evento não pode ser alterado após a criação. Escolha com cuidado.
              </span>
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {EVENT_TYPES.map(({ type, icon: Icon, title, description, features }) => (
          <Card
            key={type}
            className={`transition-all ${
              value === type ? "border-primary border-2 shadow-md" : "border-border"
            } ${
              disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-lg hover:border-primary/50"
            }`}
            onClick={() => !disabled && onChange(type)}
          >
            <CardContent className="p-6">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                  value === type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{description}</p>
              <ul className="space-y-1">
                {features.map((feature, index) => (
                  <li key={index} className="text-xs flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {value && (
        <div className={`p-4 border rounded-lg ${
          disabled
            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900"
            : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900"
        }`}>
          <p className={`text-sm font-medium ${
            disabled ? "text-blue-800 dark:text-blue-200" : "text-green-800 dark:text-green-200"
          }`}>
            {disabled ? "🔒" : "✓"} Tipo selecionado: <strong>{EVENT_TYPES.find((t) => t.type === value)?.title}</strong>
          </p>
        </div>
      )}
    </div>
  )
}

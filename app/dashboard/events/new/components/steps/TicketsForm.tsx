import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import type { TicketInput } from "@/types/models"

interface TicketsFormProps {
  tickets: TicketInput[]
  onAddTicket: () => void
  onRemoveTicket: (index: number) => void
  onTicketChange: (index: number, field: keyof TicketInput, value: string | number) => void
}

export function TicketsForm({ tickets, onAddTicket, onRemoveTicket, onTicketChange }: TicketsFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Ingressos/RSVPs</h2>
        <p className="text-muted-foreground">Configure os tipos de ingressos para o evento (opcional)</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {tickets.length === 0 ? "Nenhum tipo de ingresso" : `${tickets.length} tipo(s) de ingresso`}
          </p>
          <Button type="button" onClick={onAddTicket} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Tipo de Ingresso
          </Button>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground mb-2">Nenhum tipo de ingresso configurado</p>
            <p className="text-xs text-muted-foreground">
              Se você não adicionar ingressos, o evento terá RSVP livre para todos
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {tickets.map((ticket, index) => (
              <div key={index} className="p-6 border rounded-lg space-y-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Ingresso {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveTicket(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Ingresso *</Label>
                    <Input
                      placeholder="Ex: Entrada Geral, VIP"
                      value={ticket.name}
                      onChange={(e) => onTicketChange(index, "name", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Preço (MZN) *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={ticket.price || ""}
                      onChange={(e) => onTicketChange(index, "price", Number.parseFloat(e.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">Use 0 para ingressos gratuitos</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantidade Disponível</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Deixe vazio para ilimitado"
                      value={ticket.quantity || ""}
                      onChange={(e) => onTicketChange(index, "quantity", Number.parseInt(e.target.value) || 0)}
                    />
                    <p className="text-xs text-muted-foreground">Deixe em branco para quantidade ilimitada</p>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      placeholder="Descrição do tipo de ingresso..."
                      value={ticket.description || ""}
                      onChange={(e) => onTicketChange(index, "description", e.target.value)}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>💡 Dica:</strong> Se o seu evento é gratuito e não requer diferentes tipos de ingressos, você pode pular esta
          etapa. Os participantes poderão fazer RSVP gratuitamente.
        </p>
      </div>
    </div>
  )
}

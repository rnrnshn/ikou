import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import type { AgendaItemInput } from "@/types/models"

interface ScheduleAgendaFormProps {
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  timezone: string
  agendaItems: AgendaItemInput[]
  onStartDateChange: (value: string) => void
  onStartTimeChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onEndTimeChange: (value: string) => void
  onTimezoneChange: (value: string) => void
  onAddAgendaItem: () => void
  onRemoveAgendaItem: (index: number) => void
  onAgendaItemChange: (index: number, field: keyof AgendaItemInput, value: string) => void
}

export function ScheduleAgendaForm({
  startDate,
  startTime,
  endDate,
  endTime,
  timezone,
  agendaItems,
  onStartDateChange,
  onStartTimeChange,
  onEndDateChange,
  onEndTimeChange,
  onTimezoneChange,
  onAddAgendaItem,
  onRemoveAgendaItem,
  onAgendaItemChange,
}: ScheduleAgendaFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Horário e Agenda</h2>
        <p className="text-muted-foreground">Defina quando o evento acontecerá e adicione items à agenda</p>
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-date">
            Data de Início <span className="text-destructive">*</span>
          </Label>
          <Input id="start-date" type="date" required value={startDate} onChange={(e) => onStartDateChange(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="start-time">
            Hora de Início <span className="text-destructive">*</span>
          </Label>
          <Input id="start-time" type="time" required value={startTime} onChange={(e) => onStartTimeChange(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="end-date">
            Data de Término <span className="text-destructive">*</span>
          </Label>
          <Input id="end-date" type="date" required value={endDate} onChange={(e) => onEndDateChange(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-time">
            Hora de Término <span className="text-destructive">*</span>
          </Label>
          <Input id="end-time" type="time" required value={endTime} onChange={(e) => onEndTimeChange(e.target.value)} />
        </div>
      </div>

      {/* Timezone */}
      <div className="space-y-2">
        <Label htmlFor="timezone">Fuso Horário</Label>
        <select
          id="timezone"
          value={timezone}
          onChange={(e) => onTimezoneChange(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="Africa/Maputo">África/Maputo (GMT+2)</option>
          <option value="Africa/Johannesburg">África/Joanesburgo (GMT+2)</option>
          <option value="Africa/Lagos">África/Lagos (GMT+1)</option>
          <option value="Africa/Nairobi">África/Nairobi (GMT+3)</option>
          <option value="Europe/Lisbon">Europa/Lisboa (GMT+0)</option>
          <option value="UTC">UTC (GMT+0)</option>
        </select>
        <p className="text-xs text-muted-foreground">
          O fuso horário padrão é Africa/Maputo. Ajuste se o evento acontecer em outro fuso.
        </p>
      </div>

      {/* Agenda Items */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Items da Agenda</h3>
            <p className="text-sm text-muted-foreground">Adicione actividades programadas para o evento</p>
          </div>
          <Button type="button" onClick={onAddAgendaItem} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Item
          </Button>
        </div>

        {agendaItems.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">Nenhum item na agenda. Clique em "Adicionar Item" para começar.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {agendaItems.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveAgendaItem(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <Label>Título</Label>
                    <Input
                      placeholder="Ex: Palestra de Abertura"
                      value={item.title}
                      onChange={(e) => onAgendaItemChange(index, "title", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Hora de Início</Label>
                    <Input
                      type="time"
                      value={item.start_time}
                      onChange={(e) => onAgendaItemChange(index, "start_time", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Hora de Término</Label>
                    <Input
                      type="time"
                      value={item.end_time}
                      onChange={(e) => onAgendaItemChange(index, "end_time", e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Descrição (opcional)</Label>
                    <Textarea
                      placeholder="Descrição do item da agenda..."
                      value={item.description || ""}
                      onChange={(e) => onAgendaItemChange(index, "description", e.target.value)}
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
    </div>
  )
}

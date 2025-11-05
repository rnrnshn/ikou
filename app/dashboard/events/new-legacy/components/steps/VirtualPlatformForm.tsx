import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface VirtualPlatformFormProps {
  externalUrl: string
  virtualInstructions: string
  onExternalUrlChange: (value: string) => void
  onVirtualInstructionsChange: (value: string) => void
}

export function VirtualPlatformForm({
  externalUrl,
  virtualInstructions,
  onExternalUrlChange,
  onVirtualInstructionsChange,
}: VirtualPlatformFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Plataforma Virtual</h2>
        <p className="text-muted-foreground">Configure o acesso virtual ao evento</p>
      </div>

      {/* External URL */}
      <div className="space-y-2">
        <Label htmlFor="external-url">
          URL da Plataforma Virtual <span className="text-destructive">*</span>
        </Label>
        <Input
          id="external-url"
          type="url"
          required
          placeholder="https://zoom.us/j/123456789 ou https://meet.google.com/abc-defg-hij"
          value={externalUrl}
          onChange={(e) => onExternalUrlChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Forneça o link para a plataforma virtual (Zoom, Google Meet, Microsoft Teams, etc.)
        </p>
      </div>

      {/* Instructions */}
      <div className="space-y-2">
        <Label htmlFor="virtual-instructions">Instruções para Participar (opcional)</Label>
        <Textarea
          id="virtual-instructions"
          placeholder="Ex: Entre no evento 10 minutos mais cedo para networking! Senha: 123456"
          value={virtualInstructions}
          onChange={(e) => onVirtualInstructionsChange(e.target.value)}
          rows={4}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Estas instruções serão exibidas em todos os lugares onde a URL do evento virtual é mostrada (página do evento,
          e-mails, etc.)
        </p>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>💡 Dica:</strong> Certifique-se de que a URL está correcta e acessível antes de publicar o evento. Os
          participantes receberão esta URL após se registarem.
        </p>
      </div>
    </div>
  )
}

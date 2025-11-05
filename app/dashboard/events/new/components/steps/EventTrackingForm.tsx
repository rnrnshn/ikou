import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface EventTrackingFormProps {
  facebookPixelId: string
  onFacebookPixelIdChange: (value: string) => void
}

export function EventTrackingForm({ facebookPixelId, onFacebookPixelIdChange }: EventTrackingFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Rastreamento do Evento</h2>
        <p className="text-muted-foreground">Configure ferramentas de análise e rastreamento (opcional)</p>
      </div>

      {/* Facebook Pixel ID */}
      <div className="space-y-2">
        <Label htmlFor="facebook-pixel-id">Facebook Pixel ID</Label>
        <Input
          id="facebook-pixel-id"
          placeholder="Ex: 1234567890123456"
          value={facebookPixelId}
          onChange={(e) => onFacebookPixelIdChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Se você tem um Facebook Pixel configurado, insira o ID aqui para rastrear conversões e eventos.
        </p>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-muted border rounded-lg">
        <h4 className="font-medium mb-2">O que é o Facebook Pixel?</h4>
        <p className="text-sm text-muted-foreground mb-3">
          O Facebook Pixel é uma ferramenta de análise que permite rastrear conversões de anúncios no Facebook, otimizar
          anúncios, criar públicos-alvo e remarketizar para pessoas que já realizaram alguma acção no seu site.
        </p>
        <p className="text-sm text-muted-foreground">
          Se você não tem um Pixel configurado ou não usa anúncios no Facebook, pode deixar este campo em branco.
        </p>
      </div>

      {/* Optional: Could add more tracking options in the future */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Nota:</strong> Esta secção é completamente opcional. Você pode pular para o próximo passo se não precisar
          de rastreamento avançado.
        </p>
      </div>
    </div>
  )
}

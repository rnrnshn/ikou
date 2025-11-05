import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface LocationFormProps {
  venueName: string
  address: string
  city: string
  showMap: boolean
  onVenueNameChange: (value: string) => void
  onAddressChange: (value: string) => void
  onCityChange: (value: string) => void
  onShowMapChange: (checked: boolean) => void
}

export function LocationForm({
  venueName,
  address,
  city,
  showMap,
  onVenueNameChange,
  onAddressChange,
  onCityChange,
  onShowMapChange,
}: LocationFormProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Localização</h2>
        <p className="text-muted-foreground">Forneça os detalhes do local onde o evento acontecerá</p>
      </div>

      {/* Venue Name */}
      <div className="space-y-2">
        <Label htmlFor="venue-name">
          Nome do Local <span className="text-destructive">*</span>
        </Label>
        <Input
          id="venue-name"
          required
          placeholder="Ex: Centro de Inovação de Maputo"
          value={venueName}
          onChange={(e) => onVenueNameChange(e.target.value)}
        />
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">
          Endereço <span className="text-destructive">*</span>
        </Label>
        <Input
          id="address"
          required
          placeholder="Ex: Av. Julius Nyerere, 123"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
        />
      </div>

      {/* City */}
      <div className="space-y-2">
        <Label htmlFor="city">
          Cidade <span className="text-destructive">*</span>
        </Label>
        <Input
          id="city"
          required
          placeholder="Ex: Maputo"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
        />
      </div>

      {/* Show Map */}
      <div className="flex items-start space-x-3 p-4 border rounded-lg">
        <Checkbox id="show-map" checked={showMap} onCheckedChange={onShowMapChange} />
        <div className="space-y-1 leading-none">
          <label
            htmlFor="show-map"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Mostrar mapa na página do evento
          </label>
          <p className="text-sm text-muted-foreground">
            Um mapa interactivo será exibido na página do evento para ajudar os participantes a encontrar o local.
          </p>
        </div>
      </div>
    </div>
  )
}

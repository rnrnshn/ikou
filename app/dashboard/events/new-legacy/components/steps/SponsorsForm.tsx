import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Upload, X } from "lucide-react"
import Image from "next/image"
import type { SponsorInput, SponsorTier } from "@/types/models"
import type React from "react"

interface SponsorsFormProps {
  sponsors: SponsorInput[]
  onAddSponsor: () => void
  onRemoveSponsor: (index: number) => void
  onSponsorChange: (index: number, field: keyof SponsorInput, value: string | File) => void
  getSponsorLogoPreview: (index: number) => string | null
}

export function SponsorsForm({
  sponsors,
  onAddSponsor,
  onRemoveSponsor,
  onSponsorChange,
  getSponsorLogoPreview,
}: SponsorsFormProps) {
  function handleImageChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onSponsorChange(index, "logoFile", file)
    }
  }

  const tierOptions: { value: SponsorTier; label: string }[] = [
    { value: "platinum", label: "Platina" },
    { value: "gold", label: "Ouro" },
    { value: "silver", label: "Prata" },
    { value: "bronze", label: "Bronze" },
    { value: "partner", label: "Parceiro" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Patrocinadores e Parceiros</h2>
        <p className="text-muted-foreground">Adicione os patrocinadores e parceiros do evento (opcional)</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {sponsors.length === 0 ? "Nenhum patrocinador adicionado" : `${sponsors.length} patrocinador(es)`}
          </p>
          <Button type="button" onClick={onAddSponsor} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Patrocinador
          </Button>
        </div>

        {sponsors.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">Clique em "Adicionar Patrocinador" para começar</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sponsors.map((sponsor, index) => {
              const logoPreview = getSponsorLogoPreview(index)
              return (
                <div key={index} className="p-6 border rounded-lg space-y-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Patrocinador {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveSponsor(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome *</Label>
                      <Input
                        placeholder="Nome do patrocinador"
                        value={sponsor.name}
                        onChange={(e) => onSponsorChange(index, "name", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Nível</Label>
                      <select
                        value={sponsor.tier || ""}
                        onChange={(e) => onSponsorChange(index, "tier", e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Selecione o nível</option>
                        {tierOptions.map((tier) => (
                          <option key={tier.value} value={tier.value}>
                            {tier.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label>Website</Label>
                      <Input
                        type="url"
                        placeholder="https://example.com"
                        value={sponsor.website_url || ""}
                        onChange={(e) => onSponsorChange(index, "website_url", e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label>Logotipo</Label>
                      {!logoPreview ? (
                        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(index, e)}
                            className="hidden"
                            id={`sponsor-logo-${index}`}
                          />
                          <label htmlFor={`sponsor-logo-${index}`} className="cursor-pointer">
                            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">Clique para fazer upload do logo</p>
                          </label>
                        </div>
                      ) : (
                        <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-white">
                          <Image src={logoPreview} alt="Sponsor logo preview" fill className="object-contain p-2" />
                          <button
                            type="button"
                            onClick={() => onSponsorChange(index, "logoFile", "")}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

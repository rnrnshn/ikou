import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Upload, X } from "lucide-react"
import Image from "next/image"
import type { SpeakerInput } from "@/types/models"
import type React from "react"

interface SpeakersFormProps {
  speakers: SpeakerInput[]
  onAddSpeaker: () => void
  onRemoveSpeaker: (index: number) => void
  onSpeakerChange: (index: number, field: keyof SpeakerInput, value: string | File) => void
  getSpeakerImagePreview: (index: number) => string | null
}

export function SpeakersForm({
  speakers,
  onAddSpeaker,
  onRemoveSpeaker,
  onSpeakerChange,
  getSpeakerImagePreview,
}: SpeakersFormProps) {
  function handleImageChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onSpeakerChange(index, "imageFile", file)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Palestrantes</h2>
        <p className="text-muted-foreground">Adicione os palestrantes do evento (opcional)</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {speakers.length === 0 ? "Nenhum palestrante adicionado" : `${speakers.length} palestrante(s)`}
          </p>
          <Button type="button" onClick={onAddSpeaker} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Palestrante
          </Button>
        </div>

        {speakers.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">Clique em "Adicionar Palestrante" para começar</p>
          </div>
        ) : (
          <div className="space-y-6">
            {speakers.map((speaker, index) => {
              const imagePreview = getSpeakerImagePreview(index)
              return (
                <div key={index} className="p-6 border rounded-lg space-y-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Palestrante {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveSpeaker(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome *</Label>
                      <Input
                        placeholder="Nome do palestrante"
                        value={speaker.name}
                        onChange={(e) => onSpeakerChange(index, "name", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Cargo/Título</Label>
                      <Input
                        placeholder="Ex: CEO, Developer Advocate"
                        value={speaker.title || ""}
                        onChange={(e) => onSpeakerChange(index, "title", e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label>Biografia</Label>
                      <Textarea
                        placeholder="Breve biografia do palestrante..."
                        value={speaker.bio || ""}
                        onChange={(e) => onSpeakerChange(index, "bio", e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label>Foto do Palestrante</Label>
                      {!imagePreview ? (
                        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(index, e)}
                            className="hidden"
                            id={`speaker-image-${index}`}
                          />
                          <label htmlFor={`speaker-image-${index}`} className="cursor-pointer">
                            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">Clique para fazer upload</p>
                          </label>
                        </div>
                      ) : (
                        <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                          <Image src={imagePreview} alt="Speaker preview" fill className="object-cover" />
                          <button
                            type="button"
                            onClick={() => onSpeakerChange(index, "imageFile", "")}
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

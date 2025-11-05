import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, X } from "lucide-react"
import Image from "next/image"
import type React from "react"

interface GeneralInfoFormProps {
  title: string
  description: string
  imagePreview: string | null
  isHidden: boolean
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onImageChange: (file: File) => void
  onImageRemove: () => void
  onHiddenChange: (checked: boolean) => void
}

export function GeneralInfoForm({
  title,
  description,
  imagePreview,
  isHidden,
  onTitleChange,
  onDescriptionChange,
  onImageChange,
  onImageRemove,
  onHiddenChange,
}: GeneralInfoFormProps) {
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      onImageChange(file)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Informações Gerais</h2>
        <p className="text-muted-foreground">Forneça os detalhes básicos sobre o seu evento</p>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Título do Evento <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          required
          placeholder="Ex: Meetup de Desenvolvedores Maputo"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="text-base"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          placeholder="Descreva seu evento em detalhes..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={6}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Descreva o que os participantes podem esperar, agenda preliminar, e outras informações importantes.
        </p>
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label>Imagem do Evento</Label>
        {!imagePreview ? (
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="event-image-upload"
            />
            <label htmlFor="event-image-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-1">Clique para fazer upload da imagem</p>
              <p className="text-xs text-muted-foreground">PNG, JPG, GIF até 10MB</p>
            </label>
          </div>
        ) : (
          <div className="relative w-full h-64 border rounded-lg overflow-hidden">
            <Image src={imagePreview} alt="Preview" fill className="object-cover" />
            <button
              type="button"
              onClick={onImageRemove}
              className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-2 hover:bg-destructive/90 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Hide Event */}
      <div className="flex items-start space-x-3 p-4 border rounded-lg">
        <Checkbox id="is-hidden" checked={isHidden} onCheckedChange={onHiddenChange} />
        <div className="space-y-1 leading-none">
          <label
            htmlFor="is-hidden"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Ocultar evento
          </label>
          <p className="text-sm text-muted-foreground">
            O evento não aparecerá na página da comunidade e nenhum email será enviado aos membros.
          </p>
        </div>
      </div>
    </div>
  )
}

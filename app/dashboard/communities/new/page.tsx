"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, X } from "lucide-react"
import Image from "next/image"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createCommunitySchema, type CreateCommunityFormData } from "@/lib/validations"

export default function NewCommunityPage() {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateCommunityFormData>({
    resolver: zodResolver(createCommunitySchema),
    defaultValues: {
      name: "",
      description: "",
      category: undefined,
      city: "",
      image_url: "",
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const onSubmit = async (data: CreateCommunityFormData) => {
    setError("")

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Você deve estar autenticado")
        return
      }

      // Check if user already has a community
      const { data: existingCommunities, error: checkError } = await supabase
        .from("communities")
        .select("id")
        .eq("organizer_id", user.id)

      if (checkError) throw checkError

      if (existingCommunities && existingCommunities.length > 0) {
        setError("Você já tem uma comunidade. Cada organizador pode criar apenas uma comunidade.")
        return
      }

      let uploadedImageUrl = data.image_url || null

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `communities/${fileName}`

        const { error: uploadError } = await supabase.storage.from("images").upload(filePath, imageFile)

        if (uploadError) {
          console.error("Upload error:", uploadError)
          // Continue without image if upload fails
        } else {
          const {
            data: { publicUrl },
          } = supabase.storage.from("images").getPublicUrl(filePath)
          uploadedImageUrl = publicUrl
        }
      }

      const { error: insertError } = await supabase.from("communities").insert({
        name: data.name,
        description: data.description,
        category: data.category,
        city: data.city,
        image_url: uploadedImageUrl,
        organizer_id: user.id,
      })

      if (insertError) throw insertError

      router.push("/dashboard/communities")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar comunidade")
    }
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Criar Nova Comunidade</CardTitle>
          <CardDescription>Crie uma nova comunidade para conectar pessoas com interesses em comum</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="name">Nome da Comunidade</Label>
              <Input
                id="name"
                placeholder="Ex: Desenvolvedores de Moçambique"
                {...register("name")}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva sua comunidade..."
                {...register("description")}
                disabled={isSubmitting}
                rows={4}
              />
              {errors.description && (
                <p className="text-xs text-destructive mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tech">Tecnologia</SelectItem>
                      <SelectItem value="Business">Negócios</SelectItem>
                      <SelectItem value="Arts">Artes</SelectItem>
                      <SelectItem value="Sports">Desportos</SelectItem>
                      <SelectItem value="Education">Educação</SelectItem>
                      <SelectItem value="Social">Social</SelectItem>
                      <SelectItem value="Other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <p className="text-xs text-destructive mt-1">{errors.category.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                placeholder="Ex: Maputo"
                {...register("city")}
                disabled={isSubmitting}
              />
              {errors.city && (
                <p className="text-xs text-destructive mt-1">{errors.city.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Imagem da Comunidade</label>
              {imagePreview ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-muted">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-muted rounded-lg cursor-pointer hover:bg-accent transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Clique para carregar</span> ou arraste e solte
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG ou WEBP (MAX. 5MB)</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              )}
            </div>

            {error && <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">{error}</div>}

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Criando..." : "Criar Comunidade"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

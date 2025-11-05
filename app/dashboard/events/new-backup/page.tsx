"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X } from "lucide-react"
import Image from "next/image"

export default function NewEventPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [communityId, setCommunityId] = useState<string>("")
  const [error, setError] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
  })

  useEffect(() => {
    fetchOrganizerCommunity()
  }, [])

  async function fetchOrganizerCommunity() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Get the organizer's community
      const { data: community, error } = await supabase
        .from("communities")
        .select("id")
        .eq("organizer_id", user.id)
        .single()

      if (error || !community) {
        setError("Você precisa criar uma comunidade primeiro")
        return
      }

      setCommunityId(community.id)
    } catch (error) {
      console.error("Error fetching community:", error)
      setError("Erro ao carregar comunidade")
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
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

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (!communityId) {
        setError("Você precisa criar uma comunidade primeiro")
        setLoading(false)
        return
      }

      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`).toISOString()
      const endDateTime = new Date(`${formData.end_date}T${formData.end_time}`).toISOString()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Você deve estar autenticado")
        return
      }

      // Upload image if provided
      let uploadedImageUrl = null
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `events/${fileName}`

        const { error: uploadError } = await supabase.storage.from("images").upload(filePath, imageFile)

        if (uploadError) {
          console.error("Upload error:", uploadError)
          setError("Erro ao fazer upload da imagem")
          return
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("images").getPublicUrl(filePath)
        uploadedImageUrl = publicUrl
      }

      const { error: insertError } = await supabase.from("events").insert({
        title: formData.title,
        description: formData.description,
        location: formData.location,
        image_url: uploadedImageUrl,
        start_date: startDateTime,
        end_date: endDateTime,
        community_id: communityId,
        organizer_id: user.id,
      })

      if (insertError) throw insertError

      router.push("/dashboard/events")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar evento")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Evento</CardTitle>
          <CardDescription>Crie um novo evento para sua comunidade</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Título do Evento</label>
              <Input
                required
                placeholder="Ex: Meetup de Desenvolvedores"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descrição</label>
              <Textarea
                placeholder="Descreva seu evento..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Localização</label>
              <Input
                placeholder="Ex: Centro de Inovação, Maputo"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Imagem do Evento</label>
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
                <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-2 hover:bg-destructive/90"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Data de Início</label>
                <Input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hora de Início</label>
                <Input
                  type="time"
                  required
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Data de Término</label>
                <Input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hora de Término</label>
                <Input
                  type="time"
                  required
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>

            {error && <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">{error}</div>}

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Criando..." : "Criar Evento"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X, ArrowLeft } from "lucide-react"
import Image from "next/image"

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [fetchingEvent, setFetchingEvent] = useState(true)
  const [error, setError] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)

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
    fetchEvent()
  }, [])

  async function fetchEvent() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: event, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", params.id)
        .single()

      if (error) throw error

      // Check if user is the organizer
      if (event.organizer_id !== user.id) {
        setError("Você não tem permissão para editar este evento")
        return
      }

      // Parse dates for form inputs
      const startDate = new Date(event.start_date)
      const endDate = new Date(event.end_date)

      setFormData({
        title: event.title,
        description: event.description || "",
        location: event.location || "",
        start_date: startDate.toISOString().split("T")[0],
        start_time: startDate.toTimeString().slice(0, 5),
        end_date: endDate.toISOString().split("T")[0],
        end_time: endDate.toTimeString().slice(0, 5),
      })

      setCurrentImageUrl(event.image_url)
      setImagePreview(event.image_url)
    } catch (error) {
      console.error("Error fetching event:", error)
      setError("Erro ao carregar evento")
    } finally {
      setFetchingEvent(false)
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
    setCurrentImageUrl(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`).toISOString()
      const endDateTime = new Date(`${formData.end_date}T${formData.end_time}`).toISOString()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Você deve estar autenticado")
        return
      }

      // Upload new image if provided
      let uploadedImageUrl = currentImageUrl
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

        // Delete old image if it exists
        if (currentImageUrl) {
          try {
            const oldPath = currentImageUrl.split("/").slice(-2).join("/")
            await supabase.storage.from("images").remove([oldPath])
          } catch (err) {
            console.error("Error deleting old image:", err)
          }
        }
      }

      const { error: updateError } = await supabase
        .from("events")
        .update({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          image_url: uploadedImageUrl,
          start_date: startDateTime,
          end_date: endDateTime,
        })
        .eq("id", params.id)

      if (updateError) throw updateError

      router.push(`/dashboard/events/${params.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar evento")
    } finally {
      setLoading(false)
    }
  }

  if (fetchingEvent) {
    return <div className="text-center py-12 text-muted-foreground">Carregando evento...</div>
  }

  if (error && !formData.title) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => router.back()}>Voltar</Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Editar Evento</CardTitle>
          <CardDescription>Atualize as informações do seu evento</CardDescription>
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
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

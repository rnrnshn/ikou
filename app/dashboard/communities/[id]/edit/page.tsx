"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, X, ArrowLeft } from "lucide-react"
import Image from "next/image"

export default function EditCommunityPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    city: "",
    image_url: "",
  })

  useEffect(() => {
    fetchCommunity()
  }, [])

  async function fetchCommunity() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data, error } = await supabase.from("communities").select("*").eq("id", params.id).single()

      if (error) throw error

      // Check if user is the organizer
      if (data.organizer_id !== user.id) {
        setError("Você não tem permissão para editar esta comunidade")
        return
      }

      setFormData({
        name: data.name || "",
        description: data.description || "",
        category: data.category || "",
        city: data.city || "",
        image_url: data.image_url || "",
      })

      if (data.image_url) {
        setImagePreview(data.image_url)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar comunidade")
    } finally {
      setInitialLoading(false)
    }
  }

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
    setFormData({ ...formData, image_url: "" })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Você deve estar autenticado")
        return
      }

      let uploadedImageUrl = formData.image_url

      // Upload new image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `communities/${fileName}`

        const { error: uploadError } = await supabase.storage.from("images").upload(filePath, imageFile)

        if (uploadError) {
          console.error("Upload error:", uploadError)
          setError("Erro ao fazer upload da imagem")
          setLoading(false)
          return
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("images").getPublicUrl(filePath)
        uploadedImageUrl = publicUrl
      }

      const { error: updateError } = await supabase
        .from("communities")
        .update({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          city: formData.city,
          image_url: uploadedImageUrl,
        })
        .eq("id", params.id)

      if (updateError) throw updateError

      router.push(`/dashboard/communities/${params.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar comunidade")
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return <div className="text-center py-12">Carregando...</div>
  }

  if (error && !formData.name) {
    return (
      <div className="max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-destructive">{error}</div>
            <Button onClick={() => router.back()} className="mt-4 w-full">
              Voltar
            </Button>
          </CardContent>
        </Card>
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
          <CardTitle>Editar Comunidade</CardTitle>
          <CardDescription>Atualize as informações da sua comunidade</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Nome da Comunidade</label>
              <Input
                required
                placeholder="Ex: Desenvolvedores de Moçambique"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descrição</label>
              <Textarea
                required
                placeholder="Descreva sua comunidade..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Categoria</label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
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
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Cidade</label>
              <Input
                required
                placeholder="Ex: Maputo"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
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

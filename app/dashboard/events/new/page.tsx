"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Community {
  id: string
  name: string
}

export default function NewEventPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [communities, setCommunities] = useState<Community[]>([])
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    image_url: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    community_id: "",
  })

  useEffect(() => {
    fetchUserCommunities()
  }, [])

  async function fetchUserCommunities() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase.from("community_members").select("communities(*)").eq("user_id", user.id)

      if (error) throw error

      const communityList = data.map((item: any) => item.communities).filter((c: any) => c !== null)

      setCommunities(communityList)
    } catch (error) {
      console.error("Error fetching communities:", error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (!formData.community_id) {
        setError("Selecione uma comunidade")
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

      const { error: insertError } = await supabase.from("events").insert({
        title: formData.title,
        description: formData.description,
        location: formData.location,
        image_url: formData.image_url,
        start_date: startDateTime,
        end_date: endDateTime,
        community_id: formData.community_id,
        created_by: user.id,
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
              <label className="block text-sm font-medium mb-2">Comunidade</label>
              <Select
                value={formData.community_id}
                onValueChange={(value) => setFormData({ ...formData, community_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma comunidade" />
                </SelectTrigger>
                <SelectContent>
                  {communities.map((community) => (
                    <SelectItem key={community.id} value={community.id}>
                      {community.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
              <label className="block text-sm font-medium mb-2">URL da Imagem</label>
              <Input
                placeholder="https://exemplo.com/imagem.jpg"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
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

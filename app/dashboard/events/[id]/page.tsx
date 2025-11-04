"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, MapPin, Users, Edit, Trash2, ArrowLeft, BarChart3 } from "lucide-react"
import Link from "next/link"

interface Event {
  id: string
  title: string
  description: string
  image_url: string
  location: string
  start_date: string
  end_date: string
  attendee_count: number
  organizer_id: string
  community_id: string
  communities?: {
    name: string
  }
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState("")
  const [isAttending, setIsAttending] = useState(false)

  useEffect(() => {
    fetchEvent()
    getCurrentUser()
  }, [])

  async function getCurrentUser() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)
    } catch (error) {
      console.error("Error getting user:", error)
    }
  }

  async function fetchEvent() {
    try {
      const { data, error } = await supabase.from("events").select("*, communities(name)").eq("id", params.id).single()

      if (error) throw error
      setEvent(data)

      // Check if user is attending
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: attendeeData } = await supabase
          .from("event_attendees")
          .select("*")
          .eq("event_id", params.id)
          .eq("user_id", user.id)
          .single()

        setIsAttending(!!attendeeData)
      }
    } catch (error) {
      console.error("Error fetching event:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAttend() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from("event_attendees").insert({
        event_id: params.id,
        user_id: user.id,
      })

      setIsAttending(true)
    } catch (error) {
      console.error("Error attending event:", error)
    }
  }

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja deletar este evento?")) return

    try {
      await supabase.from("events").delete().eq("id", params.id)
      router.push("/dashboard/events")
    } catch (error) {
      console.error("Error deleting event:", error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-MZ", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return <div className="text-center py-12">Carregando...</div>
  }

  if (!event) {
    return <div className="text-center py-12">Evento não encontrado</div>
  }

  const isOwner = currentUserId === event.organizer_id

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <Card>
        {event.image_url && (
          <div className="h-64 bg-secondary overflow-hidden rounded-t-lg">
            <img src={event.image_url || "/placeholder.svg"} alt={event.title} className="w-full h-full object-cover" />
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl">{event.title}</CardTitle>
              <CardDescription className="mt-2">{event.description}</CardDescription>
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <Link href={`/dashboard/events/${event.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Início</p>
                <p>{formatDate(event.start_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Término</p>
                <p>{formatDate(event.end_date)}</p>
              </div>
            </div>
            {event.location && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span>{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span>{event.attendee_count} participantes</span>
            </div>
            {event.communities && <div className="text-primary font-medium">Comunidade: {event.communities.name}</div>}
          </div>

          <div className="pt-4 border-t border-border space-y-3">
            {isOwner && (
              <Link href={`/dashboard/events/${event.id}/attendees`}>
                <Button className="w-full bg-transparent" variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Ver e Gerenciar Participantes
                </Button>
              </Link>
            )}

            {!isOwner && (
              <Button onClick={handleAttend} disabled={isAttending} className="w-full">
                {isAttending ? "Você já está participando" : "Participar do Evento"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

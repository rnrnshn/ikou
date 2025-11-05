"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { EventCreationWizard } from "../../new/components/EventCreationWizard"
import { loadEvent } from "../../new/api"
import type { EventFormData } from "../../new/types"

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [eventData, setEventData] = useState<EventFormData | null>(null)
  const [communityId, setCommunityId] = useState<string>("")
  const [organizerId, setOrganizerId] = useState<string>("")

  useEffect(() => {
    fetchEventData()
  }, [])

  async function fetchEventData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setOrganizerId(user.id)

      // Get the organizer's community
      const { data: community, error: communityError } = await supabase
        .from("communities")
        .select("id")
        .eq("organizer_id", user.id)
        .single()

      if (communityError || !community) {
        setError("Você precisa ter uma comunidade para editar eventos.")
        setLoading(false)
        return
      }

      setCommunityId(community.id)

      // Check if user is the organizer of this event
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("organizer_id")
        .eq("id", params.id)
        .single()

      if (eventError) {
        setError("Evento não encontrado")
        setLoading(false)
        return
      }

      if (event.organizer_id !== user.id) {
        setError("Você não tem permissão para editar este evento")
        setLoading(false)
        return
      }

      // Load full event data
      const data = await loadEvent(params.id as string)
      if (!data) {
        setError("Erro ao carregar evento")
        setLoading(false)
        return
      }

      setEventData(data)
      setLoading(false)
    } catch (err) {
      console.error("Error fetching event data:", err)
      setError("Erro ao carregar evento")
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando evento...</p>
        </div>
      </div>
    )
  }

  if (error || !eventData) {
    return (
      <div className="max-w-2xl mx-auto mt-20">
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-6 text-center">
          <p className="font-medium mb-4">{error || "Evento não encontrado"}</p>
          <button
            onClick={() => router.push("/dashboard/events")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Voltar para Eventos
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Editar Evento</h1>
        <p className="text-muted-foreground">
          Atualize as informações do evento em múltiplas etapas
        </p>
      </div>

      <EventCreationWizard
        communityId={communityId}
        organizerId={organizerId}
        eventId={params.id as string}
        initialData={eventData}
        isEditMode={true}
      />
    </div>
  )
}

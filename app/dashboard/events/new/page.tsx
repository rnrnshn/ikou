"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { EventCreationWizard } from "./components/EventCreationWizard"

export default function NewEventPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [communityId, setCommunityId] = useState<string>("")
  const [organizerId, setOrganizerId] = useState<string>("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetchOrganizerData()
  }, [])

  async function fetchOrganizerData() {
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
        setError("Você precisa criar uma comunidade primeiro antes de criar eventos.")
        setLoading(false)
        return
      }

      setCommunityId(community.id)
      setLoading(false)
    } catch (err) {
      console.error("Error fetching organizer data:", err)
      setError("Erro ao carregar dados do organizador")
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-20">
        <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-6 text-center">
          <p className="font-medium mb-4">{error}</p>
          <button
            onClick={() => router.push("/dashboard/communities/new")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Criar Comunidade
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Criar Novo Evento</h1>
        <p className="text-muted-foreground">
          Preencha todas as informações do evento em múltiplas etapas
        </p>
      </div>

      <EventCreationWizard communityId={communityId} organizerId={organizerId} />
    </div>
  )
}

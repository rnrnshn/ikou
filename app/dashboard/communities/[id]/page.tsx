"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, MapPin, Edit, Trash2, ArrowLeft } from "lucide-react"

interface Community {
  id: string
  name: string
  description: string
  image_url: string
  location: string
  member_count: number
  organizer_id: string
}

export default function CommunityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [community, setCommunity] = useState<Community | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState("")
  const [isMember, setIsMember] = useState(false)

  useEffect(() => {
    fetchCommunity()
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

  async function fetchCommunity() {
    try {
      const { data, error } = await supabase.from("communities").select("*").eq("id", params.id).single()

      if (error) throw error
      setCommunity(data)

      // Check if user is a member
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: memberData } = await supabase
          .from("community_members")
          .select("*")
          .eq("community_id", params.id)
          .eq("user_id", user.id)
          .single()

        setIsMember(!!memberData)
      }
    } catch (error) {
      console.error("Error fetching community:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from("community_members").insert({
        community_id: params.id,
        user_id: user.id,
      })

      setIsMember(true)
    } catch (error) {
      console.error("Error joining community:", error)
    }
  }

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja deletar esta comunidade?")) return

    try {
      await supabase.from("communities").delete().eq("id", params.id)
      router.push("/dashboard/communities")
    } catch (error) {
      console.error("Error deleting community:", error)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Carregando...</div>
  }

  if (!community) {
    return <div className="text-center py-12">Comunidade não encontrada</div>
  }

  const isOwner = currentUserId === community.organizer_id

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <Card>
        {community.image_url && (
          <div className="h-64 bg-secondary overflow-hidden rounded-t-lg">
            <img
              src={community.image_url || "/placeholder.svg"}
              alt={community.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl">{community.name}</CardTitle>
              <CardDescription className="mt-2">{community.description}</CardDescription>
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/communities/${params.id}/edit`)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-6">
            {community.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span>{community.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span>{community.member_count} membros</span>
            </div>
          </div>

          {!isOwner && (
            <Button onClick={handleJoin} disabled={isMember} className="w-full">
              {isMember ? "Membro da Comunidade" : "Juntar-se à Comunidade"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

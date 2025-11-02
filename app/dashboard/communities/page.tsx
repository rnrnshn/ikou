"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Users, MapPin } from "lucide-react"

interface Community {
  id: string
  name: string
  description: string
  image_url: string
  location: string
  member_count: number
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchCommunities()
  }, [])

  async function fetchCommunities() {
    try {
      const { data, error } = await supabase.from("communities").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setCommunities(data || [])
    } catch (error) {
      console.error("Error fetching communities:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Comunidades</h1>
          <p className="text-muted-foreground">Gerencie e explore comunidades</p>
        </div>
        <Link href="/dashboard/communities/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Comunidade
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando comunidades...</div>
      ) : communities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Nenhuma comunidade encontrada</p>
            <Link href="/dashboard/communities/new">
              <Button>Criar Primeira Comunidade</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community) => (
            <Link key={community.id} href={`/dashboard/communities/${community.id}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                {community.image_url && (
                  <div className="h-48 bg-secondary overflow-hidden rounded-t-lg">
                    <img
                      src={community.image_url || "/placeholder.svg"}
                      alt={community.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{community.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{community.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {community.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {community.location}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {community.member_count} membros
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

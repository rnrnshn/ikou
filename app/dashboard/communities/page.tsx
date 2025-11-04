"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Users, MapPin } from "lucide-react"

interface Community {
  id: string
  name: string
  description: string
  image_url: string
  category: string
  city: string
  organizer_id: string
}

export default function CommunitiesPage() {
  const router = useRouter()
  const [community, setCommunity] = useState<Community | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchUserCommunity()
  }, [])

  async function fetchUserCommunity() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Fetch only the organizer's community
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .eq("organizer_id", user.id)
        .single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        throw error
      }

      setCommunity(data)

      // If community exists, redirect to it
      if (data) {
        router.push(`/dashboard/communities/${data.id}`)
      }
    } catch (error) {
      console.error("Error fetching community:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="max-w-md mx-auto space-y-4 text-center">
              <Skeleton className="h-16 w-16 mx-auto rounded" />
              <Skeleton className="h-7 w-64 mx-auto" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-11 w-48 mx-auto mt-4" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If no community exists, show create prompt
  if (!community) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Sua Comunidade</h1>
          <p className="text-muted-foreground">Crie sua comunidade para começar a organizar eventos</p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <Plus className="h-16 w-16 text-muted-foreground mx-auto" />
              <h3 className="text-xl font-semibold">Crie Sua Comunidade</h3>
              <p className="text-muted-foreground">
                Como organizador, você pode criar uma comunidade e gerenciar eventos para conectar pessoas com interesses
                em comum.
              </p>
              <Link href="/dashboard/communities/new">
                <Button size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Comunidade
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // This return will never be reached because of the redirect,
  // but we keep it for the loading state
  return null
}

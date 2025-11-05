"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Calendar, Activity, Plus, UserIcon } from "lucide-react"

interface Stats {
  totalMembers: number
  totalEvents: number
  upcomingEvents: number
  communityName: string
  communityId: string
}

interface RecentMember {
  id: string
  name: string
  email: string
  joined_at: string
}

interface UpcomingEvent {
  id: string
  title: string
  start_date: string
  location: string
}

export default function DashboardHome() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [hasCommunity, setHasCommunity] = useState(false)
  const [stats, setStats] = useState<Stats>({
    totalMembers: 0,
    totalEvents: 0,
    upcomingEvents: 0,
    communityName: "",
    communityId: "",
  })
  const [recentMembers, setRecentMembers] = useState<RecentMember[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Get organizer's community
      const { data: community } = await supabase
        .from("communities")
        .select("id, name")
        .eq("organizer_id", user.id)
        .single()

      if (!community) {
        setHasCommunity(false)
        setLoading(false)
        return
      }

      setHasCommunity(true)

      // Fetch total members
      const { data: membersData, count: membersCount } = await supabase
        .from("community_members")
        .select("*", { count: "exact" })
        .eq("community_id", community.id)

      // Fetch recent members (last 5)
      const { data: recentMembersData } = await supabase
        .from("community_members")
        .select(
          `
          id,
          joined_at,
          profiles!inner (
            name,
            email
          )
        `
        )
        .eq("community_id", community.id)
        .order("joined_at", { ascending: false })
        .limit(5)

      // Fetch total events
      const { data: eventsData, count: eventsCount } = await supabase
        .from("events")
        .select("*", { count: "exact" })
        .eq("community_id", community.id)

      // Fetch upcoming events
      const now = new Date().toISOString()
      const { data: upcomingEventsData } = await supabase
        .from("events")
        .select("id, title, start_date, location")
        .eq("community_id", community.id)
        .gte("start_date", now)
        .order("start_date", { ascending: true })
        .limit(5)

      setStats({
        totalMembers: membersCount || 0,
        totalEvents: eventsCount || 0,
        upcomingEvents: upcomingEventsData?.length || 0,
        communityName: community.name,
        communityId: community.id,
      })

      // Map recent members
      if (recentMembersData) {
        setRecentMembers(
          recentMembersData.map((m: any) => ({
            id: m.id,
            name: m.profiles.name,
            email: m.profiles.email,
            joined_at: m.joined_at,
          }))
        )
      }

      setUpcomingEvents(upcomingEventsData || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-40 mb-4" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!hasCommunity) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Bem-vindo ao Ikou</h1>
          <p className="text-muted-foreground">Comece criando sua comunidade</p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <Users className="h-16 w-16 text-muted-foreground mx-auto" />
              <h3 className="text-xl font-semibold">Crie Sua Primeira Comunidade</h3>
              <p className="text-muted-foreground">
                Como organizador, você pode criar uma comunidade e começar a organizar eventos para conectar pessoas.
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">{stats.communityName}</h1>
        <p className="text-muted-foreground">Visão geral da sua comunidade e eventos</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalMembers === 1 ? "membro" : "membros"} na comunidade
            </p>
            <Link href="/dashboard/members" className="mt-4 inline-block">
              <Button variant="outline" size="sm" className="w-full">
                Ver Membros
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalEvents === 1 ? "evento criado" : "eventos criados"}
            </p>
            <Link href="/dashboard/events" className="mt-4 inline-block">
              <Button variant="outline" size="sm" className="w-full">
                Ver Eventos
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Próximos</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.upcomingEvents === 1 ? "evento próximo" : "eventos próximos"}
            </p>
            <Link href="/dashboard/events/new" className="mt-4 inline-block">
              <Button variant="outline" size="sm" className="w-full">
                Criar Evento
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Members */}
        <Card>
          <CardHeader>
            <CardTitle>Membros Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2">Nenhum membro ainda</p>
                <p className="text-xs">Compartilhe sua comunidade para atrair membros</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(member.joined_at).toLocaleDateString("pt-MZ")}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {recentMembers.length > 0 && (
              <Link href="/dashboard/members" className="mt-4 block">
                <Button variant="outline" size="sm" className="w-full">
                  Ver Todos os Membros
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Próximos Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2">Nenhum evento próximo</p>
                <Link href="/dashboard/events/new" className="inline-block mt-2">
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Evento
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/dashboard/events/${event.id}`}
                    className="block p-3 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <p className="font-medium">{event.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(event.start_date).toLocaleDateString("pt-MZ")}</span>
                      {event.location && (
                        <>
                          <span>•</span>
                          <span>{event.location}</span>
                        </>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {upcomingEvents.length > 0 && (
              <Link href="/dashboard/events" className="mt-4 block">
                <Button variant="outline" size="sm" className="w-full">
                  Ver Todos os Eventos
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/dashboard/events/new">
              <Button className="w-full" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Criar Evento
              </Button>
            </Link>
            <Link href={`/dashboard/communities/${stats.communityId}/edit`}>
              <Button className="w-full" variant="outline">
                Editar Comunidade
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button className="w-full" variant="outline">
                Definições
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

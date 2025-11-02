"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Calendar, Activity, ArrowRight } from "lucide-react"

interface Stats {
  communitiesCount: number
  eventsCount: number
  attendingEventsCount: number
}

interface RecentActivity {
  id: string
  type: "community" | "event"
  title: string
  description: string
  date: string
  link: string
}

export default function DashboardHome() {
  const [stats, setStats] = useState<Stats>({
    communitiesCount: 0,
    eventsCount: 0,
    attendingEventsCount: 0,
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

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

      // Fetch user's communities
      const { data: communitiesData } = await supabase.from("community_members").select("*").eq("user_id", user.id)

      // Fetch all events
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: true })
        .limit(10)

      // Fetch user's attended events
      const { data: attendedEvents } = await supabase.from("event_attendees").select("*").eq("user_id", user.id)

      setStats({
        communitiesCount: communitiesData?.length || 0,
        eventsCount: eventsData?.length || 0,
        attendingEventsCount: attendedEvents?.length || 0,
      })

      // Build recent activity
      const activity: RecentActivity[] = []

      // Add recent communities
      if (communitiesData && communitiesData.length > 0) {
        const recentCommunities = communitiesData.slice(-3).reverse()
        recentCommunities.forEach((item: any) => {
          activity.push({
            id: `community-${item.id}`,
            type: "community",
            title: `Você se juntou a uma comunidade`,
            description: `Novo membro adicionado`,
            date: new Date(item.joined_at).toLocaleDateString("pt-MZ"),
            link: `/dashboard/communities/${item.community_id}`,
          })
        })
      }

      // Add recent events
      if (eventsData && eventsData.length > 0) {
        const recentEvents = eventsData.slice(0, 3)
        recentEvents.forEach((item: any) => {
          activity.push({
            id: `event-${item.id}`,
            type: "event",
            title: item.title,
            description: new Date(item.start_date).toLocaleDateString("pt-MZ"),
            date: new Date(item.created_at).toLocaleDateString("pt-MZ"),
            link: `/dashboard/events/${item.id}`,
          })
        })
      }

      setRecentActivity(activity.slice(0, 5))
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Bem-vindo ao Seu Dashboard</h1>
        <p className="text-muted-foreground">Acompanhe suas comunidades, eventos e atividades</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comunidades</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.communitiesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.communitiesCount === 1 ? "comunidade" : "comunidades"} que segue
            </p>
            <Link href="/dashboard/communities" className="mt-4 inline-block">
              <Button variant="outline" size="sm">
                Ver Comunidades
                <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eventsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.eventsCount === 1 ? "evento" : "eventos"} próximos
            </p>
            <Link href="/dashboard/events" className="mt-4 inline-block">
              <Button variant="outline" size="sm">
                Ver Eventos
                <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participações</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendingEventsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.attendingEventsCount === 1 ? "evento" : "eventos"} que participa
            </p>
            <Link href="/dashboard/events" className="mt-4 inline-block">
              <Button variant="outline" size="sm">
                Minhas Participações
                <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Últimas atualizações nas suas comunidades e eventos</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando atividades...</div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">Nenhuma atividade ainda.</p>
              <div className="flex gap-4 justify-center">
                <Link href="/dashboard/communities">
                  <Button variant="outline">Explorar Comunidades</Button>
                </Link>
                <Link href="/dashboard/events">
                  <Button variant="outline">Ver Eventos</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <Link
                  key={activity.id}
                  href={activity.link}
                  className="flex items-start gap-4 p-4 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="mt-1">
                    {activity.type === "community" ? (
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-accent mt-2" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">{activity.date}</div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/dashboard/communities/new">
              <Button className="w-full bg-transparent" variant="outline">
                Criar Nova Comunidade
              </Button>
            </Link>
            <Link href="/dashboard/events/new">
              <Button className="w-full bg-transparent" variant="outline">
                Criar Novo Evento
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

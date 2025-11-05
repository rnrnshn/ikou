"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-client"
import { KPICard } from "./KPICard"
import { DateRangeFilter, DateRange, getDateFromRange } from "./DateRangeFilter"
import { ExportButton } from "./ExportButton"
import { UserCheck, TrendingUp, Users, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface RegistrationsMetrics {
  totalRSVPs: number
  averagePerEvent: number
  conversionRate: number
  growthRate: number
}

interface RSVPTrendData {
  date: string
  rsvps: number
}

interface EventRSVPData {
  event_title: string
  rsvps: number
}

interface RecentRSVP {
  id: string
  user_name: string
  user_email: string
  event_title: string
  created_at: string
  has_ticket: boolean
}

export function RegistrationsDashboard() {
  const supabase = createClient()
  const [dateRange, setDateRange] = useState<DateRange>("30d")
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<RegistrationsMetrics>({
    totalRSVPs: 0,
    averagePerEvent: 0,
    conversionRate: 0,
    growthRate: 0,
  })
  const [rsvpTrend, setRsvpTrend] = useState<RSVPTrendData[]>([])
  const [topEvents, setTopEvents] = useState<EventRSVPData[]>([])
  const [recentRSVPs, setRecentRSVPs] = useState<RecentRSVP[]>([])

  useEffect(() => {
    fetchRegistrationsData()
  }, [dateRange])

  async function fetchRegistrationsData() {
    setLoading(true)
    try {
      const startDate = getDateFromRange(dateRange)
      const startDateISO = startDate?.toISOString()

      // Get current user's community
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: community } = await supabase
        .from("communities")
        .select("id")
        .eq("organizer_id", user.id)
        .single()

      if (!community) return

      // Fetch RSVPs data
      const [rsvpsResult, eventsResult, recentRSVPsResult] = await Promise.all([
        // All RSVPs in period
        supabase
          .from("rsvps")
          .select(`
            id,
            created_at,
            ticket_id,
            events!inner(community_id)
          `)
          .eq("events.community_id", community.id)
          .gte("created_at", startDateISO || "1970-01-01"),

        // Events in period for average calculation
        supabase
          .from("events")
          .select("id")
          .eq("community_id", community.id)
          .gte("start_date", startDateISO || "1970-01-01"),

        // Recent RSVPs with details
        supabase
          .from("rsvps")
          .select(`
            id,
            created_at,
            ticket_id,
            profiles!inner(name, email),
            events!inner(title, community_id)
          `)
          .eq("events.community_id", community.id)
          .gte("created_at", startDateISO || "1970-01-01")
          .order("created_at", { ascending: false })
          .limit(20),
      ])

      // Calculate metrics
      const totalRSVPs = rsvpsResult.data?.length || 0
      const totalEvents = eventsResult.data?.length || 0
      const averagePerEvent = totalEvents > 0 ? Math.round(totalRSVPs / totalEvents) : 0

      // Calculate conversion rate (RSVPs with tickets / total RSVPs)
      const rsvpsWithTickets = rsvpsResult.data?.filter((r: any) => r.ticket_id).length || 0
      const conversionRate = totalRSVPs > 0 ? (rsvpsWithTickets / totalRSVPs) * 100 : 0

      // Growth rate (simplified for MVP)
      const growthRate = 0

      setMetrics({
        totalRSVPs,
        averagePerEvent,
        conversionRate,
        growthRate,
      })

      // Generate RSVP trend data
      const trendData = generateRSVPTrend(rsvpsResult.data || [])
      setRsvpTrend(trendData)

      // Get top events by RSVPs
      const eventRSVPCount = (rsvpsResult.data || []).reduce((acc: any, rsvp: any) => {
        const eventId = rsvp.events?.id
        if (!eventId) return acc
        acc[eventId] = (acc[eventId] || 0) + 1
        return acc
      }, {})

      // Fetch event titles for top events
      const topEventIds = Object.entries(eventRSVPCount)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 10)
        .map(([id]) => id)

      const { data: topEventsData } = await supabase
        .from("events")
        .select("id, title")
        .in("id", topEventIds)

      const topEventsWithRSVPs: EventRSVPData[] = (topEventsData || []).map((event) => ({
        event_title: event.title,
        rsvps: eventRSVPCount[event.id] || 0,
      })).sort((a, b) => b.rsvps - a.rsvps)

      setTopEvents(topEventsWithRSVPs)

      // Process recent RSVPs
      const recentRSVPsData: RecentRSVP[] = (recentRSVPsResult.data || []).map((rsvp: any) => ({
        id: rsvp.id,
        user_name: rsvp.profiles?.name || "Sem nome",
        user_email: rsvp.profiles?.email || "",
        event_title: rsvp.events?.title || "Evento desconhecido",
        created_at: rsvp.created_at,
        has_ticket: !!rsvp.ticket_id,
      })).slice(0, 10)

      setRecentRSVPs(recentRSVPsData)
    } catch (error) {
      console.error("Error fetching registrations data:", error)
    } finally {
      setLoading(false)
    }
  }

  function generateRSVPTrend(rsvps: any[]): RSVPTrendData[] {
    // Group RSVPs by date
    const grouped = rsvps.reduce((acc, rsvp) => {
      const date = new Date(rsvp.created_at).toISOString().split("T")[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Convert to array
    return Object.entries(grouped)
      .map(([date, rsvps]) => ({ date, rsvps }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30) // Last 30 data points
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Inscrições</h2>
          <p className="text-sm text-muted-foreground">Análise de RSVPs e engajamento</p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <ExportButton data={recentRSVPs} filename="registrations_recent" disabled={loading || recentRSVPs.length === 0} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total de Inscrições" value={metrics.totalRSVPs} icon={UserCheck} loading={loading} />
        <KPICard
          title="Média por Evento"
          value={metrics.averagePerEvent}
          icon={Calendar}
          description="Inscrições por evento"
          loading={loading}
        />
        <KPICard
          title="Taxa de Conversão"
          value={`${metrics.conversionRate.toFixed(1)}%`}
          icon={Users}
          description="RSVPs com ingressos"
          loading={loading}
        />
        <KPICard
          title="Crescimento"
          value={`${metrics.growthRate.toFixed(1)}%`}
          icon={TrendingUp}
          description="Comparado ao período anterior"
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RSVP Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tendência de Inscrições</CardTitle>
            <CardDescription>Inscrições ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : rsvpTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={rsvpTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("pt-MZ", { month: "short", day: "numeric" })
                    }
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(value) => new Date(value as string).toLocaleDateString("pt-MZ")} />
                  <Legend />
                  <Line type="monotone" dataKey="rsvps" stroke="#10b981" strokeWidth={2} name="Inscrições" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Events by RSVPs Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos com Mais Inscrições</CardTitle>
            <CardDescription>Top 10 eventos por número de RSVPs</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : topEvents.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topEvents} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="event_title"
                    width={150}
                    tickFormatter={(value) => (value.length > 20 ? `${value.slice(0, 20)}...` : value)}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rsvps" fill="#3b82f6" name="Inscrições" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent RSVPs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inscrições Recentes</CardTitle>
          <CardDescription>Últimas inscrições realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : recentRSVPs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ingresso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRSVPs.map((rsvp) => (
                  <TableRow key={rsvp.id}>
                    <TableCell className="font-medium">{rsvp.user_name}</TableCell>
                    <TableCell>{rsvp.user_email}</TableCell>
                    <TableCell>{rsvp.event_title}</TableCell>
                    <TableCell>
                      {new Date(rsvp.created_at).toLocaleDateString("pt-MZ", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      {rsvp.has_ticket ? (
                        <span className="text-green-600 dark:text-green-400">✓ Sim</span>
                      ) : (
                        <span className="text-muted-foreground">— Gratuito</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Nenhuma inscrição encontrada no período selecionado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

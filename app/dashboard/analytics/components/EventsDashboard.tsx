"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-client"
import { KPICard } from "./KPICard"
import { DateRangeFilter, DateRange, getDateFromRange } from "./DateRangeFilter"
import { ExportButton } from "./ExportButton"
import { Calendar, CalendarCheck, Users, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface EventsMetrics {
  totalEvents: number
  upcomingEvents: number
  averageAttendance: number
  eventGrowth: number
}

interface EventTrendData {
  date: string
  events: number
}

interface EventTypeData {
  name: string
  value: number
  color: string
}

interface EventPerformance {
  id: string
  title: string
  start_date: string
  event_type: string
  status: string
  rsvps: number
  attendance_rate: number
}

const COLORS = {
  virtual: "#3b82f6",
  in_person: "#10b981",
  hybrid: "#8b5cf6",
}

export function EventsDashboard() {
  const supabase = createClient()
  const [dateRange, setDateRange] = useState<DateRange>("30d")
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<EventsMetrics>({
    totalEvents: 0,
    upcomingEvents: 0,
    averageAttendance: 0,
    eventGrowth: 0,
  })
  const [eventTrend, setEventTrend] = useState<EventTrendData[]>([])
  const [eventsByType, setEventsByType] = useState<EventTypeData[]>([])
  const [eventPerformance, setEventPerformance] = useState<EventPerformance[]>([])

  useEffect(() => {
    fetchEventsData()
  }, [dateRange])

  async function fetchEventsData() {
    setLoading(true)
    try {
      const startDate = getDateFromRange(dateRange)
      const startDateISO = startDate?.toISOString()
      const now = new Date().toISOString()

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

      // Fetch events data
      const [allEventsResult, upcomingEventsResult, eventsWithRSVPsResult] = await Promise.all([
        // All events in period
        supabase
          .from("events")
          .select("id, created_at, event_type")
          .eq("community_id", community.id)
          .gte("start_date", startDateISO || "1970-01-01"),

        // Upcoming events
        supabase
          .from("events")
          .select("id")
          .eq("community_id", community.id)
          .gte("start_date", now)
          .eq("status", "published"),

        // Events with RSVPs for performance analysis
        supabase
          .from("events")
          .select(`
            id,
            title,
            start_date,
            event_type,
            status,
            rsvps!left(id)
          `)
          .eq("community_id", community.id)
          .gte("start_date", startDateISO || "1970-01-01")
          .order("start_date", { ascending: false }),
      ])

      // Calculate metrics
      const totalEvents = allEventsResult.data?.length || 0
      const upcomingEvents = upcomingEventsResult.data?.length || 0

      // Calculate average attendance
      const eventsWithRSVPs = eventsWithRSVPsResult.data || []
      const totalRSVPs = eventsWithRSVPs.reduce((sum, event: any) => sum + (event.rsvps?.length || 0), 0)
      const averageAttendance = totalEvents > 0 ? Math.round(totalRSVPs / totalEvents) : 0

      // Calculate growth (simplified for MVP)
      const eventGrowth = 0

      setMetrics({
        totalEvents,
        upcomingEvents,
        averageAttendance,
        eventGrowth,
      })

      // Generate event trend data
      const trendData = generateEventTrend(allEventsResult.data || [])
      setEventTrend(trendData)

      // Process events by type
      const typeCount: Record<string, number> = { virtual: 0, in_person: 0, hybrid: 0 }
      allEventsResult.data?.forEach((event) => {
        typeCount[event.event_type as string] = (typeCount[event.event_type as string] || 0) + 1
      })

      const eventsByTypeData: EventTypeData[] = [
        { name: "Virtual", value: typeCount.virtual, color: COLORS.virtual },
        { name: "Presencial", value: typeCount.in_person, color: COLORS.in_person },
        { name: "Híbrido", value: typeCount.hybrid, color: COLORS.hybrid },
      ].filter((item) => item.value > 0)

      setEventsByType(eventsByTypeData)

      // Process event performance
      const performanceData: EventPerformance[] = eventsWithRSVPs.map((event: any) => ({
        id: event.id,
        title: event.title,
        start_date: event.start_date,
        event_type: event.event_type,
        status: event.status,
        rsvps: event.rsvps?.length || 0,
        attendance_rate: 0, // Would need check-in data to calculate actual attendance
      }))

      setEventPerformance(performanceData.slice(0, 10))
    } catch (error) {
      console.error("Error fetching events data:", error)
    } finally {
      setLoading(false)
    }
  }

  function generateEventTrend(events: any[]): EventTrendData[] {
    // Group events by creation date
    const grouped = events.reduce((acc, event) => {
      const date = new Date(event.created_at).toISOString().split("T")[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Convert to array
    return Object.entries(grouped)
      .map(([date, events]) => ({ date, events }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30) // Last 30 data points
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Eventos</h2>
          <p className="text-sm text-muted-foreground">Desempenho e tendências dos eventos</p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <ExportButton
            data={eventPerformance}
            filename="events_performance"
            disabled={loading || eventPerformance.length === 0}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total de Eventos" value={metrics.totalEvents} icon={Calendar} loading={loading} />
        <KPICard
          title="Eventos Futuros"
          value={metrics.upcomingEvents}
          icon={CalendarCheck}
          description="Eventos publicados"
          loading={loading}
        />
        <KPICard
          title="Inscrições Médias"
          value={metrics.averageAttendance}
          icon={Users}
          description="Por evento"
          loading={loading}
        />
        <KPICard
          title="Crescimento"
          value={`${metrics.eventGrowth.toFixed(1)}%`}
          icon={TrendingUp}
          description="Comparado ao período anterior"
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos Criados ao Longo do Tempo</CardTitle>
            <CardDescription>Número de eventos criados por dia</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : eventTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={eventTrend}>
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
                  <Line type="monotone" dataKey="events" stroke="#3b82f6" strokeWidth={2} name="Eventos" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Events by Type Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos por Tipo</CardTitle>
            <CardDescription>Distribuição de eventos por tipo</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : eventsByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={eventsByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {eventsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Desempenho dos Eventos</CardTitle>
          <CardDescription>Eventos recentes e suas métricas de participação</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : eventPerformance.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Inscrições</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventPerformance.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>
                      {new Date(event.start_date).toLocaleDateString("pt-MZ", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {event.event_type === "virtual" && "Virtual"}
                        {event.event_type === "in_person" && "Presencial"}
                        {event.event_type === "hybrid" && "Híbrido"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={event.status === "published" ? "default" : "secondary"}>
                        {event.status === "published" && "Publicado"}
                        {event.status === "draft" && "Rascunho"}
                        {event.status === "cancelled" && "Cancelado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{event.rsvps}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Nenhum evento encontrado no período selecionado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

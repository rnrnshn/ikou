"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-client"
import { KPICard } from "./KPICard"
import { DateRangeFilter, DateRange, getDateFromRange } from "./DateRangeFilter"
import { ExportButton } from "./ExportButton"
import { Users, Calendar, UserCheck, DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface OverviewMetrics {
  totalMembers: number
  totalEvents: number
  totalRSVPs: number
  totalRevenue: number
  membersTrend: number
  eventsTrend: number
  rsvpsTrend: number
  revenueTrend: number
}

interface MemberGrowthData {
  date: string
  members: number
}

interface EventTypeData {
  name: string
  value: number
  color: string
}

interface TopEvent {
  id: string
  title: string
  start_date: string
  event_type: string
  rsvps: number
  tickets_sold: number
  revenue: number
}

const COLORS = {
  virtual: "#3b82f6",
  in_person: "#10b981",
  hybrid: "#8b5cf6",
}

export function OverviewDashboard() {
  const supabase = createClient()
  const [dateRange, setDateRange] = useState<DateRange>("30d")
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<OverviewMetrics>({
    totalMembers: 0,
    totalEvents: 0,
    totalRSVPs: 0,
    totalRevenue: 0,
    membersTrend: 0,
    eventsTrend: 0,
    rsvpsTrend: 0,
    revenueTrend: 0,
  })
  const [memberGrowth, setMemberGrowth] = useState<MemberGrowthData[]>([])
  const [eventsByType, setEventsByType] = useState<EventTypeData[]>([])
  const [topEvents, setTopEvents] = useState<TopEvent[]>([])

  useEffect(() => {
    fetchAnalyticsData()
  }, [dateRange])

  async function fetchAnalyticsData() {
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

      // Fetch metrics in parallel
      const [
        membersResult,
        eventsResult,
        rsvpsResult,
        ticketSalesResult,
        eventsByTypeResult,
        topEventsResult,
      ] = await Promise.all([
        // Total members
        supabase
          .from("profiles")
          .select("id, created_at", { count: "exact" })
          .eq("role", "member"),

        // Total events
        supabase
          .from("events")
          .select("id, created_at", { count: "exact" })
          .eq("community_id", community.id)
          .gte("start_date", startDateISO || "1970-01-01"),

        // Total RSVPs
        supabase
          .from("rsvps")
          .select("id, created_at", { count: "exact" })
          .gte("created_at", startDateISO || "1970-01-01"),

        // Total ticket sales revenue
        supabase
          .from("rsvps")
          .select("ticket_id, event_tickets!inner(price)")
          .gte("created_at", startDateISO || "1970-01-01")
          .not("ticket_id", "is", null),

        // Events by type
        supabase
          .from("events")
          .select("event_type")
          .eq("community_id", community.id)
          .gte("start_date", startDateISO || "1970-01-01"),

        // Top events by RSVPs
        supabase
          .from("events")
          .select(`
            id,
            title,
            start_date,
            event_type,
            rsvps!left(id)
          `)
          .eq("community_id", community.id)
          .gte("start_date", startDateISO || "1970-01-01")
          .order("start_date", { ascending: false })
          .limit(10),
      ])

      // Calculate total revenue
      const totalRevenue = ticketSalesResult.data?.reduce((sum, rsvp) => {
        const price = (rsvp as any).event_tickets?.price || 0
        return sum + parseFloat(price.toString())
      }, 0) || 0

      // Process events by type
      const typeCount: Record<string, number> = { virtual: 0, in_person: 0, hybrid: 0 }
      eventsByTypeResult.data?.forEach((event) => {
        typeCount[event.event_type as string] = (typeCount[event.event_type as string] || 0) + 1
      })

      const eventsByTypeData: EventTypeData[] = [
        { name: "Virtual", value: typeCount.virtual, color: COLORS.virtual },
        { name: "Presencial", value: typeCount.in_person, color: COLORS.in_person },
        { name: "Híbrido", value: typeCount.hybrid, color: COLORS.hybrid },
      ].filter((item) => item.value > 0)

      // Process top events
      const topEventsData: TopEvent[] = (topEventsResult.data || []).map((event: any) => ({
        id: event.id,
        title: event.title,
        start_date: event.start_date,
        event_type: event.event_type,
        rsvps: event.rsvps?.length || 0,
        tickets_sold: event.rsvps?.filter((r: any) => r.ticket_id).length || 0,
        revenue: 0, // Would need to calculate from tickets
      })).sort((a, b) => b.rsvps - a.rsvps).slice(0, 5)

      // Calculate member growth (simplified - would need more complex query for actual trend)
      const memberGrowthData: MemberGrowthData[] = generateMemberGrowthData(membersResult.data || [])

      // Calculate trends (simplified - compare to previous period)
      // For MVP, we'll show 0 trends
      setMetrics({
        totalMembers: membersResult.count || 0,
        totalEvents: eventsResult.count || 0,
        totalRSVPs: rsvpsResult.count || 0,
        totalRevenue: totalRevenue,
        membersTrend: 0,
        eventsTrend: 0,
        rsvpsTrend: 0,
        revenueTrend: 0,
      })

      setMemberGrowth(memberGrowthData)
      setEventsByType(eventsByTypeData)
      setTopEvents(topEventsData)
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  function generateMemberGrowthData(members: any[]): MemberGrowthData[] {
    // Group members by date and count cumulative
    const grouped = members.reduce((acc, member) => {
      const date = new Date(member.created_at).toISOString().split("T")[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Convert to array and calculate cumulative
    const dates = Object.keys(grouped).sort()
    let cumulative = 0
    return dates.map((date) => {
      cumulative += grouped[date]
      return { date, members: cumulative }
    }).slice(-30) // Last 30 data points
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Visão Geral</h2>
          <p className="text-sm text-muted-foreground">Resumo das principais métricas</p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <ExportButton
            data={topEvents}
            filename="overview_top_events"
            disabled={loading || topEvents.length === 0}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total de Membros"
          value={metrics.totalMembers}
          icon={Users}
          trend={metrics.membersTrend !== 0 ? {
            value: metrics.membersTrend,
            isPositive: metrics.membersTrend > 0,
          } : undefined}
          loading={loading}
        />
        <KPICard
          title="Total de Eventos"
          value={metrics.totalEvents}
          icon={Calendar}
          trend={metrics.eventsTrend !== 0 ? {
            value: metrics.eventsTrend,
            isPositive: metrics.eventsTrend > 0,
          } : undefined}
          loading={loading}
        />
        <KPICard
          title="Total de Inscrições"
          value={metrics.totalRSVPs}
          icon={UserCheck}
          trend={metrics.rsvpsTrend !== 0 ? {
            value: metrics.rsvpsTrend,
            isPositive: metrics.rsvpsTrend > 0,
          } : undefined}
          loading={loading}
        />
        <KPICard
          title="Receita Total"
          value={`${metrics.totalRevenue.toFixed(2)} MT`}
          icon={DollarSign}
          trend={metrics.revenueTrend !== 0 ? {
            value: metrics.revenueTrend,
            isPositive: metrics.revenueTrend > 0,
          } : undefined}
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Crescimento de Membros</CardTitle>
            <CardDescription>Membros acumulados ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : memberGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={memberGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString("pt-MZ", { month: "short", day: "numeric" })}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => new Date(value as string).toLocaleDateString("pt-MZ")}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="members" stroke="#3b82f6" strokeWidth={2} name="Membros" />
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

      {/* Top Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Eventos</CardTitle>
          <CardDescription>Eventos com mais inscrições no período selecionado</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : topEvents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Inscrições</TableHead>
                  <TableHead className="text-right">Ingressos Vendidos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topEvents.map((event) => (
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
                    <TableCell className="text-right">{event.rsvps}</TableCell>
                    <TableCell className="text-right">{event.tickets_sold}</TableCell>
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

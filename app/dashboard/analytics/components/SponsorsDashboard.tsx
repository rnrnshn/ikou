"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-client"
import { KPICard } from "./KPICard"
import { DateRangeFilter, DateRange, getDateFromRange } from "./DateRangeFilter"
import { ExportButton } from "./ExportButton"
import { Award, Building2, TrendingUp, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface SponsorsMetrics {
  totalSponsors: number
  uniqueSponsors: number
  averagePerEvent: number
  topTier: string
}

interface TierDistributionData {
  name: string
  value: number
  color: string
}

interface SponsorParticipation {
  sponsor_name: string
  events_count: number
  tier: string | null
}

interface EventSponsorship {
  event_title: string
  sponsors_count: number
}

const TIER_COLORS: Record<string, string> = {
  platinum: "#e5e7eb",
  gold: "#fbbf24",
  silver: "#9ca3af",
  bronze: "#cd7f32",
  partner: "#8b5cf6",
}

const TIER_LABELS: Record<string, string> = {
  platinum: "Platina",
  gold: "Ouro",
  silver: "Prata",
  bronze: "Bronze",
  partner: "Parceiro",
}

export function SponsorsDashboard() {
  const supabase = createClient()
  const [dateRange, setDateRange] = useState<DateRange>("30d")
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<SponsorsMetrics>({
    totalSponsors: 0,
    uniqueSponsors: 0,
    averagePerEvent: 0,
    topTier: "—",
  })
  const [tierDistribution, setTierDistribution] = useState<TierDistributionData[]>([])
  const [topSponsors, setTopSponsors] = useState<SponsorParticipation[]>([])
  const [eventSponsorship, setEventSponsorship] = useState<EventSponsorship[]>([])

  useEffect(() => {
    fetchSponsorsData()
  }, [dateRange])

  async function fetchSponsorsData() {
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

      // Fetch sponsors data
      const [sponsorsResult, eventsResult] = await Promise.all([
        // All sponsors for community events in period
        supabase
          .from("event_sponsors")
          .select(`
            id,
            name,
            tier,
            website_url,
            events!inner(id, title, community_id, start_date)
          `)
          .eq("events.community_id", community.id)
          .gte("events.start_date", startDateISO || "1970-01-01"),

        // Events in period
        supabase
          .from("events")
          .select("id, title")
          .eq("community_id", community.id)
          .gte("start_date", startDateISO || "1970-01-01"),
      ])

      const sponsors = sponsorsResult.data || []
      const events = eventsResult.data || []

      // Calculate metrics
      const totalSponsors = sponsors.length
      const uniqueSponsors = new Set(sponsors.map((s) => s.name)).size
      const averagePerEvent = events.length > 0 ? Math.round(totalSponsors / events.length) : 0

      // Calculate top tier (most common tier)
      const tierCount: Record<string, number> = {}
      sponsors.forEach((sponsor) => {
        const tier = sponsor.tier || "partner"
        tierCount[tier] = (tierCount[tier] || 0) + 1
      })
      const topTier = Object.entries(tierCount).sort(([, a], [, b]) => b - a)[0]?.[0] || "—"

      setMetrics({
        totalSponsors,
        uniqueSponsors,
        averagePerEvent,
        topTier: topTier !== "—" ? TIER_LABELS[topTier] || topTier : "—",
      })

      // Generate tier distribution data
      const tierDistData: TierDistributionData[] = Object.entries(tierCount)
        .map(([tier, count]) => ({
          name: TIER_LABELS[tier] || tier,
          value: count,
          color: TIER_COLORS[tier] || "#8b5cf6",
        }))
        .sort((a, b) => b.value - a.value)

      setTierDistribution(tierDistData)

      // Calculate top sponsors by participation
      const sponsorEventCount: Record<string, { count: number; tier: string | null }> = {}
      sponsors.forEach((sponsor) => {
        if (!sponsorEventCount[sponsor.name]) {
          sponsorEventCount[sponsor.name] = { count: 0, tier: sponsor.tier }
        }
        sponsorEventCount[sponsor.name].count += 1
      })

      const topSponsorsData: SponsorParticipation[] = Object.entries(sponsorEventCount)
        .map(([name, data]) => ({
          sponsor_name: name,
          events_count: data.count,
          tier: data.tier,
        }))
        .sort((a, b) => b.events_count - a.events_count)
        .slice(0, 10)

      setTopSponsors(topSponsorsData)

      // Calculate event sponsorship
      const eventSponsorCount: Record<string, { title: string; count: number }> = {}
      sponsors.forEach((sponsor: any) => {
        const eventId = sponsor.events?.id
        if (!eventId) return
        if (!eventSponsorCount[eventId]) {
          eventSponsorCount[eventId] = {
            title: sponsor.events?.title || "Evento desconhecido",
            count: 0,
          }
        }
        eventSponsorCount[eventId].count += 1
      })

      const eventSponsorshipData: EventSponsorship[] = Object.values(eventSponsorCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      setEventSponsorship(eventSponsorshipData)
    } catch (error) {
      console.error("Error fetching sponsors data:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Patrocinadores</h2>
          <p className="text-sm text-muted-foreground">Distribuição e engajamento de patrocinadores</p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <ExportButton data={topSponsors} filename="sponsors_top_participants" disabled={loading || topSponsors.length === 0} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total de Patrocínios"
          value={metrics.totalSponsors}
          icon={Award}
          description="Todos os patrocínios"
          loading={loading}
        />
        <KPICard
          title="Patrocinadores Únicos"
          value={metrics.uniqueSponsors}
          icon={Building2}
          description="Empresas distintas"
          loading={loading}
        />
        <KPICard
          title="Média por Evento"
          value={metrics.averagePerEvent}
          icon={Users}
          description="Patrocinadores por evento"
          loading={loading}
        />
        <KPICard
          title="Tier Mais Comum"
          value={metrics.topTier}
          icon={TrendingUp}
          description="Categoria predominante"
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Tier</CardTitle>
            <CardDescription>Patrocínios por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : tierDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tierDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {tierDistribution.map((entry, index) => (
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

        {/* Event Sponsorship Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Eventos com Mais Patrocínios</CardTitle>
            <CardDescription>Top 10 eventos por número de patrocinadores</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : eventSponsorship.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={eventSponsorship} layout="horizontal">
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
                  <Bar dataKey="sponsors_count" fill="#8b5cf6" name="Patrocinadores" />
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

      {/* Top Sponsors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Patrocinadores</CardTitle>
          <CardDescription>Patrocinadores com mais participação em eventos</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : topSponsors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patrocinador</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Eventos Patrocinados</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSponsors.map((sponsor, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{sponsor.sponsor_name}</TableCell>
                    <TableCell>
                      {sponsor.tier ? (
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: TIER_COLORS[sponsor.tier] || "#8b5cf6",
                            color: TIER_COLORS[sponsor.tier] || "#8b5cf6",
                          }}
                        >
                          {TIER_LABELS[sponsor.tier] || sponsor.tier}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Parceiro</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{sponsor.events_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Nenhum patrocinador encontrado no período selecionado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-client"
import { KPICard } from "./KPICard"
import { DateRangeFilter, DateRange, getDateFromRange } from "./DateRangeFilter"
import { ExportButton } from "./ExportButton"
import { Users, UserPlus, UserCheck, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface MembersMetrics {
  totalMembers: number
  newMembers: number
  activeMembers: number
  growthRate: number
}

interface GrowthData {
  date: string
  new: number
  total: number
}

interface ActivityData {
  date: string
  active: number
}

interface TopMember {
  id: string
  name: string
  email: string
  joined: string
  events_attended: number
  last_activity: string
}

export function MembersDashboard() {
  const supabase = createClient()
  const [dateRange, setDateRange] = useState<DateRange>("30d")
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<MembersMetrics>({
    totalMembers: 0,
    newMembers: 0,
    activeMembers: 0,
    growthRate: 0,
  })
  const [growthData, setGrowthData] = useState<GrowthData[]>([])
  const [activityData, setActivityData] = useState<ActivityData[]>([])
  const [topMembers, setTopMembers] = useState<TopMember[]>([])

  useEffect(() => {
    fetchMembersData()
  }, [dateRange])

  async function fetchMembersData() {
    setLoading(true)
    try {
      const startDate = getDateFromRange(dateRange)
      const startDateISO = startDate?.toISOString()

      // Fetch members data
      const [allMembersResult, newMembersResult, activeMembersResult, topMembersResult] = await Promise.all([
        // All members
        supabase.from("profiles").select("id, created_at").eq("role", "member"),

        // New members in period
        supabase
          .from("profiles")
          .select("id, created_at")
          .eq("role", "member")
          .gte("created_at", startDateISO || "1970-01-01"),

        // Active members (have RSVPs in period)
        supabase
          .from("rsvps")
          .select("user_id")
          .gte("created_at", startDateISO || "1970-01-01"),

        // Top members by event attendance
        supabase
          .from("profiles")
          .select(`
            id,
            name,
            email,
            created_at,
            rsvps!left(id, created_at)
          `)
          .eq("role", "member")
          .limit(20),
      ])

      // Calculate metrics
      const totalMembers = allMembersResult.data?.length || 0
      const newMembers = newMembersResult.data?.length || 0

      // Count unique active members
      const uniqueActiveMembers = new Set(activeMembersResult.data?.map((r) => r.user_id) || [])
      const activeMembers = uniqueActiveMembers.size

      // Calculate growth rate (new members / total members * 100)
      const growthRate = totalMembers > 0 ? (newMembers / totalMembers) * 100 : 0

      setMetrics({
        totalMembers,
        newMembers,
        activeMembers,
        growthRate,
      })

      // Generate growth chart data
      const growthChartData = generateGrowthData(newMembersResult.data || [])
      setGrowthData(growthChartData)

      // Generate activity chart data
      const activityChartData = generateActivityData(activeMembersResult.data || [])
      setActivityData(activityChartData)

      // Process top members
      const topMembersData: TopMember[] = (topMembersResult.data || [])
        .map((member: any) => ({
          id: member.id,
          name: member.name || "Sem nome",
          email: member.email,
          joined: member.created_at,
          events_attended: member.rsvps?.length || 0,
          last_activity: member.rsvps?.[0]?.created_at || member.created_at,
        }))
        .sort((a, b) => b.events_attended - a.events_attended)
        .slice(0, 10)

      setTopMembers(topMembersData)
    } catch (error) {
      console.error("Error fetching members data:", error)
    } finally {
      setLoading(false)
    }
  }

  function generateGrowthData(members: any[]): GrowthData[] {
    // Group by date and count new members per day
    const grouped = members.reduce((acc, member) => {
      const date = new Date(member.created_at).toISOString().split("T")[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Convert to array with cumulative totals
    const dates = Object.keys(grouped).sort()
    let cumulative = 0
    return dates
      .map((date) => {
        const newCount = grouped[date]
        cumulative += newCount
        return { date, new: newCount, total: cumulative }
      })
      .slice(-30) // Last 30 data points
  }

  function generateActivityData(rsvps: any[]): ActivityData[] {
    // Group RSVPs by date to show daily active users
    const grouped = rsvps.reduce((acc, rsvp) => {
      const date = new Date(rsvp.created_at).toISOString().split("T")[0]
      if (!acc[date]) acc[date] = new Set()
      acc[date].add(rsvp.user_id)
      return acc
    }, {} as Record<string, Set<string>>)

    // Convert to array
    return Object.entries(grouped)
      .map(([date, userSet]) => ({
        date,
        active: userSet.size,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30) // Last 30 data points
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Membros</h2>
          <p className="text-sm text-muted-foreground">Crescimento e engajamento de membros</p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <ExportButton data={topMembers} filename="members_top_active" disabled={loading || topMembers.length === 0} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total de Membros" value={metrics.totalMembers} icon={Users} loading={loading} />
        <KPICard
          title="Novos Membros"
          value={metrics.newMembers}
          icon={UserPlus}
          description="No período selecionado"
          loading={loading}
        />
        <KPICard
          title="Membros Ativos"
          value={metrics.activeMembers}
          icon={UserCheck}
          description="Com inscrições no período"
          loading={loading}
        />
        <KPICard
          title="Taxa de Crescimento"
          value={`${metrics.growthRate.toFixed(1)}%`}
          icon={TrendingUp}
          description="Novos membros / total"
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        {/* Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Crescimento de Membros</CardTitle>
            <CardDescription>Novos membros e total acumulado ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={growthData}>
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
                  <Line type="monotone" dataKey="new" stroke="#10b981" strokeWidth={2} name="Novos" />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Diária</CardTitle>
            <CardDescription>Membros ativos por dia (com inscrições em eventos)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : activityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={activityData}>
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
                  <Bar dataKey="active" fill="#8b5cf6" name="Membros Ativos" />
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

      {/* Top Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Membros Mais Ativos</CardTitle>
          <CardDescription>Membros com mais participação em eventos</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : topMembers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Data de Adesão</TableHead>
                  <TableHead className="text-right">Eventos Participados</TableHead>
                  <TableHead>Última Atividade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      {new Date(member.joined).toLocaleDateString("pt-MZ", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">{member.events_attended}</TableCell>
                    <TableCell>
                      {new Date(member.last_activity).toLocaleDateString("pt-MZ", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Nenhum membro encontrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

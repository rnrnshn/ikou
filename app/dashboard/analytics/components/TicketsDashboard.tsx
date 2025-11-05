"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-client"
import { KPICard } from "./KPICard"
import { DateRangeFilter, DateRange, getDateFromRange } from "./DateRangeFilter"
import { ExportButton } from "./ExportButton"
import { Ticket, DollarSign, TrendingUp, Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface TicketsMetrics {
  totalSold: number
  totalRevenue: number
  averagePrice: number
  sellThroughRate: number
}

interface SalesTrendData {
  date: string
  tickets: number
  revenue: number
}

interface TicketPerformance {
  ticket_name: string
  event_title: string
  price: number
  sold: number
  available: number
  revenue: number
}

export function TicketsDashboard() {
  const supabase = createClient()
  const [dateRange, setDateRange] = useState<DateRange>("30d")
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<TicketsMetrics>({
    totalSold: 0,
    totalRevenue: 0,
    averagePrice: 0,
    sellThroughRate: 0,
  })
  const [salesTrend, setSalesTrend] = useState<SalesTrendData[]>([])
  const [ticketPerformance, setTicketPerformance] = useState<TicketPerformance[]>([])

  useEffect(() => {
    fetchTicketsData()
  }, [dateRange])

  async function fetchTicketsData() {
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

      // Fetch tickets and sales data
      const [ticketSalesResult, allTicketsResult] = await Promise.all([
        // Ticket sales in period
        supabase
          .from("rsvps")
          .select(`
            id,
            created_at,
            ticket_id,
            event_tickets!inner(
              id,
              name,
              price,
              quantity,
              available_quantity,
              events!inner(title, community_id)
            )
          `)
          .not("ticket_id", "is", null)
          .eq("event_tickets.events.community_id", community.id)
          .gte("created_at", startDateISO || "1970-01-01"),

        // All tickets for the community
        supabase
          .from("event_tickets")
          .select(`
            id,
            name,
            price,
            quantity,
            available_quantity,
            events!inner(id, title, community_id)
          `)
          .eq("events.community_id", community.id),
      ])

      // Calculate metrics
      const totalSold = ticketSalesResult.data?.length || 0
      const totalRevenue = ticketSalesResult.data?.reduce((sum, sale: any) => {
        const price = sale.event_tickets?.price || 0
        return sum + parseFloat(price.toString())
      }, 0) || 0

      const averagePrice = totalSold > 0 ? totalRevenue / totalSold : 0

      // Calculate sell-through rate (tickets sold / total tickets)
      const totalTicketsAvailable = allTicketsResult.data?.reduce((sum, ticket: any) => {
        return sum + (ticket.quantity || 0)
      }, 0) || 0

      const sellThroughRate = totalTicketsAvailable > 0 ? (totalSold / totalTicketsAvailable) * 100 : 0

      setMetrics({
        totalSold,
        totalRevenue,
        averagePrice,
        sellThroughRate,
      })

      // Generate sales trend data
      const trendData = generateSalesTrend(ticketSalesResult.data || [])
      setSalesTrend(trendData)

      // Calculate ticket performance
      const ticketSalesCount: Record<string, number> = {}
      ticketSalesResult.data?.forEach((sale: any) => {
        const ticketId = sale.ticket_id
        ticketSalesCount[ticketId] = (ticketSalesCount[ticketId] || 0) + 1
      })

      const performanceData: TicketPerformance[] = (allTicketsResult.data || [])
        .map((ticket: any) => {
          const sold = ticketSalesCount[ticket.id] || 0
          const price = parseFloat(ticket.price?.toString() || "0")
          return {
            ticket_name: ticket.name,
            event_title: ticket.events?.title || "Evento desconhecido",
            price: price,
            sold: sold,
            available: ticket.available_quantity || 0,
            revenue: sold * price,
          }
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)

      setTicketPerformance(performanceData)
    } catch (error) {
      console.error("Error fetching tickets data:", error)
    } finally {
      setLoading(false)
    }
  }

  function generateSalesTrend(sales: any[]): SalesTrendData[] {
    // Group sales by date
    const grouped = sales.reduce((acc, sale) => {
      const date = new Date(sale.created_at).toISOString().split("T")[0]
      if (!acc[date]) {
        acc[date] = { tickets: 0, revenue: 0 }
      }
      acc[date].tickets += 1
      acc[date].revenue += parseFloat(sale.event_tickets?.price?.toString() || "0")
      return acc
    }, {} as Record<string, { tickets: number; revenue: number }>)

    // Convert to array
    return Object.entries(grouped)
      .map(([date, data]) => ({ date, tickets: data.tickets, revenue: data.revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30) // Last 30 data points
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Ingressos</h2>
          <p className="text-sm text-muted-foreground">Vendas, receita e disponibilidade</p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <ExportButton
            data={ticketPerformance}
            filename="tickets_performance"
            disabled={loading || ticketPerformance.length === 0}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Ingressos Vendidos" value={metrics.totalSold} icon={Ticket} loading={loading} />
        <KPICard
          title="Receita Total"
          value={`${metrics.totalRevenue.toFixed(2)} MT`}
          icon={DollarSign}
          loading={loading}
        />
        <KPICard
          title="Preço Médio"
          value={`${metrics.averagePrice.toFixed(2)} MT`}
          icon={TrendingUp}
          description="Por ingresso"
          loading={loading}
        />
        <KPICard
          title="Taxa de Venda"
          value={`${metrics.sellThroughRate.toFixed(1)}%`}
          icon={Package}
          description="Ingressos vendidos / total"
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        {/* Sales Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tendência de Vendas</CardTitle>
            <CardDescription>Ingressos vendidos e receita ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : salesTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("pt-MZ", { month: "short", day: "numeric" })
                    }
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip labelFormatter={(value) => new Date(value as string).toLocaleDateString("pt-MZ")} />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="tickets"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Ingressos"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Receita (MT)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ticket Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Desempenho dos Ingressos</CardTitle>
          <CardDescription>Top 10 ingressos por receita gerada</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : ticketPerformance.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingresso</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Vendidos</TableHead>
                  <TableHead className="text-right">Disponíveis</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ticketPerformance.map((ticket, index) => {
                  const totalCapacity = ticket.sold + ticket.available
                  const soldPercentage = totalCapacity > 0 ? (ticket.sold / totalCapacity) * 100 : 0
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{ticket.ticket_name}</TableCell>
                      <TableCell>{ticket.event_title}</TableCell>
                      <TableCell className="text-right">{ticket.price.toFixed(2)} MT</TableCell>
                      <TableCell className="text-right">{ticket.sold}</TableCell>
                      <TableCell className="text-right">{ticket.available}</TableCell>
                      <TableCell className="text-right">{ticket.revenue.toFixed(2)} MT</TableCell>
                      <TableCell>
                        {ticket.available === 0 ? (
                          <Badge variant="destructive">Esgotado</Badge>
                        ) : soldPercentage > 75 ? (
                          <Badge variant="default">Quase esgotado</Badge>
                        ) : (
                          <Badge variant="secondary">Disponível</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Nenhum ingresso encontrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

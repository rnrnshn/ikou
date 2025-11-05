"use client"

import { useState, useEffect } from "react"
import { Event, RSVP, CheckIn } from "@/types/models"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { QRScanner } from "@/components/QRScanner"
import { ManualCheckIn } from "./ManualCheckIn"
import { CheckInHistory } from "./CheckInHistory"
import { CheckInSuccess } from "./CheckInSuccess"
import {
  checkInByQRCode,
  getCheckInStats,
  getEventCheckIns,
  exportAttendeeList,
} from "@/lib/check-in-api"
import { Calendar, Users, UserCheck, Download } from "lucide-react"
import { useRouter } from "next/navigation"

interface CheckInInterfaceProps {
  event: Event
  organizerId: string
}

export function CheckInInterface({ event, organizerId }: CheckInInterfaceProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("scanner")
  const [stats, setStats] = useState({
    totalRSVPs: 0,
    checkedIn: 0,
    pending: 0,
    checkInRate: 0,
  })
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([])
  const [lastCheckIn, setLastCheckIn] = useState<{ checkIn: CheckIn; rsvp: RSVP } | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchStats()
    fetchRecentCheckIns()

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetchStats()
      fetchRecentCheckIns()
    }, 5000)

    return () => clearInterval(interval)
  }, [event.id])

  async function fetchStats() {
    const statsData = await getCheckInStats(event.id)
    if (statsData) {
      setStats({
        totalRSVPs: statsData.total_rsvps,
        checkedIn: statsData.checked_in_count,
        pending: statsData.no_show_count,
        checkInRate: statsData.check_in_rate,
      })
    }
  }

  async function fetchRecentCheckIns() {
    const checkIns = await getEventCheckIns(event.id)
    setRecentCheckIns(checkIns.slice(0, 5))
  }

  async function handleQRScan(qrData: string) {
    setError(null)
    const result = await checkInByQRCode(qrData, organizerId)

    if (result.success && result.checkIn && result.rsvp) {
      setLastCheckIn({ checkIn: result.checkIn, rsvp: result.rsvp })
      setShowSuccess(true)
      await fetchStats()
      await fetchRecentCheckIns()

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false)
        setLastCheckIn(null)
      }, 3000)
    } else {
      setError(result.error || "Erro ao fazer check-in")
      setTimeout(() => setError(null), 5000)
    }
  }

  async function handleManualCheckIn() {
    await fetchStats()
    await fetchRecentCheckIns()
  }

  async function handleExport(filter: "all" | "checked_in" | "no_shows") {
    setExporting(true)
    try {
      const data = await exportAttendeeList(event.id, filter)

      // Convert to CSV
      if (data.length === 0) {
        setError("Nenhum dado para exportar")
        setTimeout(() => setError(null), 3000)
        return
      }

      const headers = Object.keys(data[0])
      const csvContent = [
        headers.join(","),
        ...data.map((row) =>
          headers
            .map((header) => {
              const value = row[header]
              if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`
              }
              return value
            })
            .join(",")
        ),
      ].join("\n")

      // Download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute(
        "download",
        `participantes-${event.title.replace(/\s+/g, "-").toLowerCase()}-${filter}.csv`
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Export error:", error)
      setError("Erro ao exportar dados")
      setTimeout(() => setError(null), 3000)
    } finally {
      setExporting(false)
    }
  }

  const eventDate = new Date(event.start_date)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Check-In: {event.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {eventDate.toLocaleDateString("pt-MZ", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
            <div>
              {eventDate.toLocaleTimeString("pt-MZ", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => router.push(`/dashboard/events/${event.id}`)}>
          Voltar ao Evento
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Inscrições</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRSVPs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Check-in Realizados</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.checkedIn}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.pending}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Presença</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.checkInRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Success Message */}
      {showSuccess && lastCheckIn && (
        <CheckInSuccess checkIn={lastCheckIn.checkIn} rsvp={lastCheckIn.rsvp} />
      )}

      {/* Error Message */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-destructive font-medium text-center">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scanner">Scanner QR</TabsTrigger>
          <TabsTrigger value="manual">Check-in Manual</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scanner de QR Code</CardTitle>
              <CardDescription>
                Escaneie o QR code do ingresso do participante para fazer check-in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QRScanner onScan={handleQRScan} onError={setError} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <ManualCheckIn
            eventId={event.id}
            organizerId={organizerId}
            onCheckIn={handleManualCheckIn}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Histórico de Check-ins</CardTitle>
                  <CardDescription>Todos os check-ins realizados neste evento</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("all")}
                    disabled={exporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Todos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("checked_in")}
                    disabled={exporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Check-ins
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("no_shows")}
                    disabled={exporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Ausentes
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CheckInHistory eventId={event.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Check-ins */}
      {recentCheckIns.length > 0 && activeTab !== "history" && (
        <Card>
          <CardHeader>
            <CardTitle>Check-ins Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentCheckIns.map((checkIn: any) => (
                <div
                  key={checkIn.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">{checkIn.profiles?.name || "Nome não disponível"}</p>
                    <p className="text-sm text-muted-foreground">
                      {checkIn.profiles?.email || "Email não disponível"}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge>{checkIn.check_in_method === "qr_scan" ? "QR Code" : "Manual"}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(checkIn.checked_in_at).toLocaleTimeString("pt-MZ", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

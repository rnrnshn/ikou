"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Download, Trash2, Mail } from "lucide-react"

interface Attendee {
  id: string
  user_id: string
  status: string
  registered_at: string
  profiles?: {
    name: string
    email: string
    avatar_url: string | null
  }
}

interface Event {
  id: string
  title: string
  organizer_id: string
}

export default function EventAttendeesPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [event, setEvent] = useState<Event | null>(null)
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState("")
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    fetchEventAndAttendees()
    getCurrentUser()
  }, [])

  async function getCurrentUser() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)
    } catch (error) {
      console.error("Error getting user:", error)
    }
  }

  async function fetchEventAndAttendees() {
    try {
      // Fetch event
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", params.id)
        .single()

      if (eventError) throw eventError
      setEvent(eventData)

      // Check if current user is owner
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user && eventData.organizer_id === user.id) {
        setIsOwner(true)
      }

      // Fetch attendees
      const { data: attendeesData, error: attendeesError } = await supabase
        .from("event_attendees")
        .select("*, profiles(name, email, avatar_url)")
        .eq("event_id", params.id)
        .order("registered_at", { ascending: false })

      if (attendeesError) throw attendeesError
      setAttendees(attendeesData || [])
    } catch (error) {
      console.error("Error fetching event and attendees:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveAttendee(attendeeId: string) {
    if (!confirm("Tem certeza que deseja remover este participante?")) return

    try {
      const { error } = await supabase.from("event_attendees").delete().eq("id", attendeeId)

      if (error) throw error

      setAttendees(attendees.filter((a) => a.id !== attendeeId))
    } catch (error) {
      console.error("Error removing attendee:", error)
    }
  }

  function handleExportCSV() {
    if (attendees.length === 0) return

    const headers = ["Nome", "Email", "Status", "Data de Registro"]
    const rows = attendees.map((attendee) => [
      attendee.profiles?.name || "N/A",
      attendee.profiles?.email || "N/A",
      attendee.status,
      new Date(attendee.registered_at).toLocaleDateString("pt-MZ"),
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${event?.title || "attendees"}-participantes.csv`
    a.click()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "attending":
        return "bg-green-100 text-green-800"
      case "interested":
        return "bg-blue-100 text-blue-800"
      case "declined":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "attending":
        return "Participando"
      case "interested":
        return "Interessado"
      case "declined":
        return "Recusou"
      default:
        return status
    }
  }

  if (loading) {
    return <div className="text-center py-12">Carregando...</div>
  }

  if (!event) {
    return <div className="text-center py-12">Evento não encontrado</div>
  }

  if (!isOwner) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Você não tem permissão para ver os participantes deste evento</p>
        <Button onClick={() => router.back()}>Voltar</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Participantes do Evento</h1>
          <p className="text-muted-foreground">{event.title}</p>
        </div>
        {attendees.length > 0 && (
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total de Participantes: {attendees.length}</CardTitle>
          <CardDescription>Gerencie os participantes do seu evento</CardDescription>
        </CardHeader>
        <CardContent>
          {attendees.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">Nenhum participante registrado ainda</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Registro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendees.map((attendee) => (
                    <TableRow key={attendee.id}>
                      <TableCell className="font-medium">{attendee.profiles?.name || "Usuário"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {attendee.profiles?.email || "N/A"}
                          <button
                            onClick={() => {
                              if (attendee.profiles?.email) {
                                window.location.href = `mailto:${attendee.profiles.email}`
                              }
                            }}
                            className="text-primary hover:underline"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(attendee.status)}`}
                        >
                          {getStatusLabel(attendee.status)}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(attendee.registered_at).toLocaleDateString("pt-MZ")}</TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => handleRemoveAttendee(attendee.id)}
                          className="text-destructive hover:underline"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getEventRSVPsWithCheckInStatus } from "@/lib/check-in-api"
import { RSVP } from "@/types/models"
import { Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"

interface CheckInHistoryProps {
  eventId: string
}

export function CheckInHistory({ eventId }: CheckInHistoryProps) {
  const [rsvps, setRsvps] = useState<RSVP[]>([])
  const [filteredRsvps, setFilteredRsvps] = useState<RSVP[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "checked_in" | "pending">("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchRSVPs()
  }, [eventId])

  useEffect(() => {
    applyFilters()
  }, [rsvps, filter, searchQuery])

  async function fetchRSVPs() {
    setLoading(true)
    try {
      const data = await getEventRSVPsWithCheckInStatus(eventId)
      setRsvps(data)
    } catch (error) {
      console.error("Error fetching RSVPs:", error)
    } finally {
      setLoading(false)
    }
  }

  function applyFilters() {
    let filtered = [...rsvps]

    // Apply status filter
    if (filter === "checked_in") {
      filtered = filtered.filter((r) => r.checked_in)
    } else if (filter === "pending") {
      filtered = filtered.filter((r) => !r.checked_in)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((r: any) => {
        const name = r.profiles?.name?.toLowerCase() || ""
        const email = r.profiles?.email?.toLowerCase() || ""
        return name.includes(query) || email.includes(query)
      })
    }

    setFilteredRsvps(filtered)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const checkedInCount = rsvps.filter((r) => r.checked_in).length
  const pendingCount = rsvps.filter((r) => !r.checked_in).length

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <Badge
            variant={filter === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilter("all")}
          >
            Todos ({rsvps.length})
          </Badge>
          <Badge
            variant={filter === "checked_in" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilter("checked_in")}
          >
            Check-in ({checkedInCount})
          </Badge>
          <Badge
            variant={filter === "pending" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilter("pending")}
          >
            Pendentes ({pendingCount})
          </Badge>
        </div>

        <Input
          placeholder="Buscar por nome ou email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Table */}
      {filteredRsvps.length > 0 ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Ingresso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Inscrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRsvps.map((rsvp: any) => (
                <TableRow key={rsvp.id}>
                  <TableCell className="font-medium">
                    {rsvp.profiles?.name || "Nome não disponível"}
                  </TableCell>
                  <TableCell>{rsvp.profiles?.email || "Email não disponível"}</TableCell>
                  <TableCell>
                    {rsvp.event_tickets ? (
                      <Badge variant="outline">{rsvp.event_tickets.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Gratuito</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {rsvp.checked_in ? (
                      <Badge variant="default" className="bg-green-600">
                        <Check className="h-3 w-3 mr-1" /> Check-in
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <X className="h-3 w-3 mr-1" /> Pendente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(rsvp.created_at).toLocaleDateString("pt-MZ", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery ? `Nenhum resultado encontrado para "${searchQuery}"` : "Nenhuma inscrição encontrada"}
        </div>
      )}
    </div>
  )
}

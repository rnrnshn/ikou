"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Check, User } from "lucide-react"
import { searchRSVPs, checkInManually } from "@/lib/check-in-api"
import { RSVP } from "@/types/models"

interface ManualCheckInProps {
  eventId: string
  organizerId: string
  onCheckIn: () => void
}

export function ManualCheckIn({ eventId, organizerId, onCheckIn }: ManualCheckInProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<RSVP[]>([])
  const [searching, setSearching] = useState(false)
  const [checkingIn, setCheckingIn] = useState<string | null>(null)

  async function handleSearch() {
    if (query.trim().length < 2) return

    setSearching(true)
    try {
      const rsvps = await searchRSVPs(eventId, query.trim())
      setResults(rsvps)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setSearching(false)
    }
  }

  async function handleCheckIn(rsvpId: string) {
    setCheckingIn(rsvpId)
    try {
      const result = await checkInManually(rsvpId, eventId, organizerId)

      if (result.success) {
        // Remove from results and notify parent
        setResults(results.filter((r) => r.id !== rsvpId))
        onCheckIn()
      } else {
        alert(result.error || "Erro ao fazer check-in")
      }
    } catch (error) {
      console.error("Check-in error:", error)
      alert("Erro ao fazer check-in")
    } finally {
      setCheckingIn(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Check-in Manual</CardTitle>
        <CardDescription>Busque por nome ou email do participante</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <Input
            placeholder="Digite o nome ou email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={searching || query.trim().length < 2}>
            <Search className="h-4 w-4 mr-2" />
            {searching ? "Buscando..." : "Buscar"}
          </Button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{results.length} resultado(s) encontrado(s)</p>
            {results.map((rsvp: any) => (
              <div
                key={rsvp.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{rsvp.profiles?.name || "Nome não disponível"}</p>
                    <p className="text-sm text-muted-foreground">
                      {rsvp.profiles?.email || "Email não disponível"}
                    </p>
                    {rsvp.event_tickets && (
                      <Badge variant="outline" className="mt-1">
                        {rsvp.event_tickets.name}
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  {rsvp.checked_in ? (
                    <Badge variant="default">
                      <Check className="h-3 w-3 mr-1" /> Já fez check-in
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleCheckIn(rsvp.id)}
                      disabled={checkingIn === rsvp.id}
                    >
                      {checkingIn === rsvp.id ? "Processando..." : "Fazer Check-in"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!searching && results.length === 0 && query.trim().length >= 2 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum participante encontrado com "{query}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

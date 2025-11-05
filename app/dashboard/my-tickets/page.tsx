import { createServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { getUserTickets } from "@/lib/check-in-api"
import { TicketCard } from "./components/TicketCard"
import { Ticket } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function MyTicketsPage() {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const tickets = await getUserTickets(user.id)

  // Separate upcoming and past events
  const now = new Date()
  const upcomingTickets = tickets.filter((ticket) => new Date(ticket.events?.start_date || "") >= now)
  const pastTickets = tickets.filter((ticket) => new Date(ticket.events?.start_date || "") < now)

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Ticket className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Meus Ingressos</h1>
        </div>
        <p className="text-muted-foreground">
          Todos os seus ingressos e confirmações de eventos
        </p>
      </div>

      {/* Upcoming Events */}
      {upcomingTickets.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Eventos Futuros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingTickets.map((ticket) => (
              <TicketCard key={ticket.id} rsvp={ticket} />
            ))}
          </div>
        </div>
      )}

      {/* Past Events */}
      {pastTickets.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Eventos Passados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastTickets.map((ticket) => (
              <TicketCard key={ticket.id} rsvp={ticket} isPast />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {tickets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Ticket className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhum ingresso encontrado</h3>
          <p className="text-muted-foreground mb-6">
            Você ainda não se inscreveu em nenhum evento.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Explorar Eventos
          </a>
        </div>
      )}
    </div>
  )
}

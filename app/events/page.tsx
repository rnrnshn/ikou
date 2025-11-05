import { createServerClient } from "@/lib/supabase-server"
import { EventsGrid } from "./components/EventsGrid"
import { EventFilters } from "./components/EventFilters"
import { Search } from "lucide-react"

export const dynamic = "force-dynamic"

interface EventsPageProps {
  searchParams: Promise<{
    search?: string
    category?: string
    city?: string
    type?: string
    date?: string
  }>
}

export default async function PublicEventsPage(props: EventsPageProps) {
  const searchParams = await props.searchParams
  const supabase = createServerClient()

  // Build query
  let query = supabase
    .from("events")
    .select(`
      *,
      communities(id, name, category, city),
      event_tickets(id, name, price, available_quantity)
    `)
    .eq("status", "published")
    .gte("start_date", new Date().toISOString())
    .order("start_date", { ascending: true })

  // Apply filters
  if (searchParams.search) {
    query = query.or(`title.ilike.%${searchParams.search}%,description.ilike.%${searchParams.search}%`)
  }

  if (searchParams.type && searchParams.type !== "all") {
    query = query.eq("event_type", searchParams.type)
  }

  if (searchParams.city && searchParams.city !== "all") {
    query = query.eq("city", searchParams.city)
  }

  const { data: events, error } = await query

  if (error) {
    console.error("Error fetching events:", error)
  }

  const eventsList = events || []

  // Get unique cities for filter
  const cities = [...new Set(eventsList.map((e: any) => e.city).filter(Boolean))]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Descubra Eventos em Moçambique
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-8">
              Encontre meetups, workshops, conferências e mais na sua cidade
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <form action="/events" method="get">
                <input
                  type="search"
                  name="search"
                  placeholder="Buscar eventos..."
                  defaultValue={searchParams.search}
                  className="w-full pl-12 pr-4 py-4 rounded-lg text-foreground bg-background border-0 focus:ring-2 focus:ring-primary"
                />
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Events */}
      <div className="container py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full md:w-64 shrink-0">
            <EventFilters
              cities={cities}
              selectedCity={searchParams.city}
              selectedType={searchParams.type}
            />
          </aside>

          {/* Events Grid */}
          <main className="flex-1">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">
                {eventsList.length} {eventsList.length === 1 ? "Evento" : "Eventos"} Disponíveis
              </h2>
              {searchParams.search && (
                <p className="text-muted-foreground mt-1">
                  Resultados para "{searchParams.search}"
                </p>
              )}
            </div>

            {eventsList.length > 0 ? (
              <EventsGrid events={eventsList} />
            ) : (
              <div className="text-center py-16">
                <p className="text-xl text-muted-foreground mb-4">
                  Nenhum evento encontrado
                </p>
                <p className="text-muted-foreground">
                  Tente ajustar seus filtros ou buscar por outros termos
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

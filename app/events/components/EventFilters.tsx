"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useRouter, useSearchParams } from "next/navigation"

interface EventFiltersProps {
  cities: string[]
  selectedCity?: string
  selectedType?: string
}

export function EventFilters({ cities, selectedCity, selectedType }: EventFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())

    if (value === "all") {
      params.delete(key)
    } else {
      params.set(key, value)
    }

    router.push(`/events?${params.toString()}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Type Filter */}
        <div>
          <h3 className="font-medium mb-3">Tipo de Evento</h3>
          <RadioGroup
            value={selectedType || "all"}
            onValueChange={(value) => updateFilter("type", value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="type-all" />
              <Label htmlFor="type-all" className="cursor-pointer">
                Todos
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="in_person" id="type-in-person" />
              <Label htmlFor="type-in-person" className="cursor-pointer">
                Presencial
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="virtual" id="type-virtual" />
              <Label htmlFor="type-virtual" className="cursor-pointer">
                Virtual
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hybrid" id="type-hybrid" />
              <Label htmlFor="type-hybrid" className="cursor-pointer">
                Híbrido
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* City Filter */}
        {cities.length > 0 && (
          <div>
            <h3 className="font-medium mb-3">Cidade</h3>
            <RadioGroup
              value={selectedCity || "all"}
              onValueChange={(value) => updateFilter("city", value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="city-all" />
                <Label htmlFor="city-all" className="cursor-pointer">
                  Todas
                </Label>
              </div>
              {cities.map((city) => (
                <div key={city} className="flex items-center space-x-2">
                  <RadioGroupItem value={city} id={`city-${city}`} />
                  <Label htmlFor={`city-${city}`} className="cursor-pointer">
                    {city}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        {/* Clear Filters */}
        {(selectedCity || selectedType) && (
          <button
            onClick={() => router.push("/events")}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Limpar filtros
          </button>
        )}
      </CardContent>
    </Card>
  )
}

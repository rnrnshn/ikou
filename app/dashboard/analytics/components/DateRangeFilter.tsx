"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type DateRange = "7d" | "30d" | "90d" | "1y" | "all"

interface DateRangeFilterProps {
  value: DateRange
  onChange: (value: DateRange) => void
  showCustom?: boolean
}

const DATE_RANGE_OPTIONS = [
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "1y", label: "Último ano" },
  { value: "all", label: "Todo o período" },
]

export function DateRangeFilter({ value, onChange, showCustom = false }: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={(val) => onChange(val as DateRange)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Selecione o período" />
        </SelectTrigger>
        <SelectContent>
          {DATE_RANGE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showCustom && (
        <Button variant="outline" size="sm">
          Personalizar
        </Button>
      )}
    </div>
  )
}

// Helper function to get date from range
export function getDateFromRange(range: DateRange): Date | null {
  const now = new Date()
  switch (range) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    case "1y":
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    case "all":
      return null
    default:
      return null
  }
}

"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useState } from "react"

interface ExportButtonProps {
  data: any[]
  filename: string
  disabled?: boolean
}

export function ExportButton({ data, filename, disabled }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (!data || data.length === 0) {
      return
    }

    setExporting(true)

    try {
      // Convert data to CSV
      const headers = Object.keys(data[0])
      const csvContent = [
        headers.join(","),
        ...data.map((row) =>
          headers
            .map((header) => {
              const value = row[header]
              // Escape values containing commas or quotes
              if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`
              }
              return value
            })
            .join(",")
        ),
      ].join("\n")

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)

      link.setAttribute("href", url)
      link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error exporting CSV:", error)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={disabled || exporting || !data || data.length === 0}>
      <Download className="h-4 w-4 mr-2" />
      {exporting ? "Exportando..." : "Exportar CSV"}
    </Button>
  )
}

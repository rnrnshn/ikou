"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OverviewDashboard } from "./components/OverviewDashboard"
import { MembersDashboard } from "./components/MembersDashboard"
import { EventsDashboard } from "./components/EventsDashboard"
import { RegistrationsDashboard } from "./components/RegistrationsDashboard"
import { TicketsDashboard } from "./components/TicketsDashboard"
import { SponsorsDashboard } from "./components/SponsorsDashboard"
import { BarChart3 } from "lucide-react"

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Analytics</h1>
        </div>
        <p className="text-muted-foreground">
          Acompanhe métricas e insights da sua comunidade e eventos
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="members">Membros</TabsTrigger>
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="registrations">Inscrições</TabsTrigger>
          <TabsTrigger value="tickets">Ingressos</TabsTrigger>
          <TabsTrigger value="sponsors">Patrocinadores</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewDashboard />
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <MembersDashboard />
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <EventsDashboard />
        </TabsContent>

        <TabsContent value="registrations" className="space-y-6">
          <RegistrationsDashboard />
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          <TicketsDashboard />
        </TabsContent>

        <TabsContent value="sponsors" className="space-y-6">
          <SponsorsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}

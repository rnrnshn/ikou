"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, Plus, DollarSign, TrendingUp } from "lucide-react"

export default function SponsorsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Patrocinadores</h1>
          <p className="text-muted-foreground">Gerencie patrocínios e parcerias da sua comunidade</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Patrocinador
        </Button>
      </div>

      {/* Sponsor Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patrocinadores Ativos</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Nenhum patrocinador cadastrado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 MT</div>
            <p className="text-xs text-muted-foreground">Este ano</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">Desde o último ano</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Sponsors */}
      <Card>
        <CardHeader>
          <CardTitle>Patrocinadores Ativos</CardTitle>
          <CardDescription>Empresas e organizações que apoiam sua comunidade</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhum patrocinador cadastrado</p>
            <p className="text-sm mb-4">Adicione patrocinadores para financiar eventos e atividades</p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Primeiro Patrocinador
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sponsor Tiers */}
      <Card>
        <CardHeader>
          <CardTitle>Níveis de Patrocínio</CardTitle>
          <CardDescription>Defina diferentes níveis de patrocínio com benefícios específicos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                name: "Bronze",
                price: "5,000 MT",
                benefits: ["Logo no site", "Menção em eventos", "1 post nas redes sociais"],
              },
              {
                name: "Prata",
                price: "15,000 MT",
                benefits: ["Logo no site", "Stand em eventos", "3 posts nas redes sociais", "Email aos membros"],
              },
              {
                name: "Ouro",
                price: "30,000 MT",
                benefits: [
                  "Logo em destaque",
                  "Stand premium",
                  "Posts ilimitados",
                  "Campanha de email",
                  "Palestra em evento",
                ],
              },
            ].map((tier, i) => (
              <Card key={i} className="hover:border-primary cursor-pointer transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  <CardDescription className="text-2xl font-bold text-foreground">{tier.price}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {tier.benefits.map((benefit, j) => (
                      <li key={j} className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

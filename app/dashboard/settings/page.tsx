"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { User, Bell, Lock, CreditCard } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Definições</h1>
        <p className="text-muted-foreground">Gerencie as configurações da sua conta e comunidade</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil
          </CardTitle>
          <CardDescription>Atualize as informações do seu perfil</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input id="name" placeholder="João Silva" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="joao@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Biografia</Label>
            <Textarea id="bio" placeholder="Conte-nos sobre você..." rows={3} />
          </div>
          <Button>Salvar Alterações</Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
          <CardDescription>Gerencie suas preferências de notificação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notif">Notificações por Email</Label>
              <p className="text-sm text-muted-foreground">Receba atualizações sobre novos membros e eventos</p>
            </div>
            <Switch id="email-notif" />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="new-members">Novos Membros</Label>
              <p className="text-sm text-muted-foreground">Notificar quando alguém se juntar à comunidade</p>
            </div>
            <Switch id="new-members" />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="event-rsvps">RSVPs de Eventos</Label>
              <p className="text-sm text-muted-foreground">Notificar quando alguém confirmar presença em um evento</p>
            </div>
            <Switch id="event-rsvps" />
          </div>
          <Button>Salvar Preferências</Button>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Segurança
          </CardTitle>
          <CardDescription>Gerencie sua senha e configurações de segurança</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Senha Atual</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova Senha</Label>
            <Input id="new-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
            <Input id="confirm-password" type="password" />
          </div>
          <Button>Alterar Senha</Button>
        </CardContent>
      </Card>

      {/* Billing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Plano e Faturamento
          </CardTitle>
          <CardDescription>Gerencie sua assinatura e método de pagamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold">Plano Gratuito</p>
                <p className="text-sm text-muted-foreground">Até 100 membros</p>
              </div>
              <span className="text-2xl font-bold">0 MT</span>
            </div>
            <p className="text-xs text-muted-foreground">Seu plano atual</p>
          </div>
          <Button variant="outline">Fazer Upgrade</Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
          <CardDescription>Ações irreversíveis relacionadas à sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Desativar Conta</p>
              <p className="text-sm text-muted-foreground">Desative temporariamente sua conta</p>
            </div>
            <Button variant="outline">Desativar</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Excluir Conta</p>
              <p className="text-sm text-muted-foreground">Excluir permanentemente sua conta e todos os dados</p>
            </div>
            <Button variant="destructive">Excluir</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

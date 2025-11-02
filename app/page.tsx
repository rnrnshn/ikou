import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Ikou</h1>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">Encontre Eventos na Sua Comunidade</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
            Conecte-se com sua comunidade, descubra novos eventos e faça amigos em Moçambique
          </p>
          <Link href="/register">
            <Button size="lg" className="mb-4">
              Começar Agora
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Comunidades</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Junte-se a comunidades locais e conexe com pessoas que compartilham interesses
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Descubra e participe em eventos interessantes nas suas comunidades</CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-primary">Conexões</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Faça amigos, expanda sua rede e crie memórias com sua comunidade</CardDescription>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

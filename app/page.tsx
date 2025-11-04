"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function Home() {
  const router = useRouter()
  const supabase = createClient()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
        setUserRole(profile?.role || null)
      }
    } catch (error) {
      console.error("Error checking user:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUserRole(null)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Image src="/ikou.svg" alt="Ikou" width={120} height={43} className="h-8 w-auto" priority />
          </Link>
          <div className="flex gap-4">
            {loading ? null : userRole ? (
              <>
                {userRole === "organizer" && (
                  <Link href="/dashboard">
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                )}
                <Button variant="ghost" onClick={handleLogout}>
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
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
          <Link href="/auth/register">
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

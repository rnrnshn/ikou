import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Bem-vindo ao Ikou!</CardTitle>
          <CardDescription>Sua conta foi criada com sucesso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              Sua conta está pronta para usar. Você pode agora explorar comunidades, descobrir eventos e conectar-se com
              sua comunidade.
            </p>
            <p>
              Se recebeu um email de confirmação, você pode clicar no link para ativar a verificação de email
              (opcional).
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/dashboard" className="block">
              <Button className="w-full" size="lg">
                Ir para Dashboard
              </Button>
            </Link>
            <Link href="/" className="block">
              <Button variant="outline" className="w-full bg-transparent" size="lg">
                Voltar para Início
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

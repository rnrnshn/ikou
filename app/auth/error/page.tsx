import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-red-200">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-2xl">Erro de Autenticação</CardTitle>
          <CardDescription>Algo deu errado ao processar sua solicitação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>Verifique se:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Seu email está correto</li>
              <li>Sua senha está correta</li>
              <li>Você tem uma conexão com a internet</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link href="/auth/login" className="block">
              <Button className="w-full" size="lg">
                Tentar Novamente
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

"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AlertCircle, CheckCircle, Users, Briefcase } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema, type RegisterFormData } from "@/lib/validations"

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "member",
    },
  })

  const selectedRole = watch("role")

  const onSubmit = async (data: RegisterFormData) => {
    setError(null)
    const supabase = createClient()

    try {
      // Sign up with user metadata - the database trigger will create the profile
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/verify-email`,
          data: {
            name: data.name,
            role: data.role,
          },
        },
      })

      if (signUpError) throw signUpError

      // Check if email confirmation is required
      if (signUpData.user && !signUpData.session) {
        // Email confirmation is enabled - show message
        setError("Por favor, verifique seu email para confirmar sua conta antes de fazer login.")
        return
      }

      // Success - user is logged in or email confirmation is disabled
      setSuccess(true)
      setTimeout(() => {
        // Redirect based on role
        const redirectTo = data.role === "organizer" ? "/dashboard" : "/"
        router.push(redirectTo)
      }, 1500)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred"
      setError(message)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <h2 className="text-xl font-semibold">Conta criada com sucesso!</h2>
              <p className="text-center text-sm text-muted-foreground">Redirecionando...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <Link href="/" className="inline-block mb-4">
              <Image src="/ikou.svg" alt="Ikou" width={150} height={54} className="mx-auto" priority />
            </Link>
            <CardTitle className="text-2xl">Criar Conta</CardTitle>
            <CardDescription>Junte-se à nossa comunidade de eventos</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="João Silva"
                  {...register("name")}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  {...register("email")}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label>Tipo de Conta</Label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Member Card */}
                  <button
                    type="button"
                    onClick={() => setValue("role", "member")}
                    disabled={isSubmitting}
                    className={cn(
                      "relative flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all hover:bg-accent",
                      selectedRole === "member"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/20",
                      isSubmitting && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Users className="h-5 w-5 shrink-0" />
                      <span className="font-semibold">Membro</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Participe de eventos e siga comunidades
                    </p>
                    {selectedRole === "member" && (
                      <div className="absolute top-2 right-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </button>

                  {/* Organizer Card */}
                  <button
                    type="button"
                    onClick={() => setValue("role", "organizer")}
                    disabled={isSubmitting}
                    className={cn(
                      "relative flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all hover:bg-accent",
                      selectedRole === "organizer"
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/20",
                      isSubmitting && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Briefcase className="h-5 w-5 shrink-0" />
                      <span className="font-semibold">Organizador</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Crie e gerencie eventos e comunidades
                    </p>
                    {selectedRole === "organizer" && (
                      <div className="absolute top-2 right-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </button>
                </div>
                {errors.role && (
                  <p className="text-xs text-destructive">{errors.role.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {selectedRole === "member"
                    ? "Como membro, você pode descobrir eventos e participar de comunidades"
                    : "Como organizador, você terá acesso ao painel de gerenciamento"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  disabled={isSubmitting}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
                {!errors.password && (
                  <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  disabled={isSubmitting}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting} size="lg">
                {isSubmitting ? "Criando conta..." : "Criar Conta"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Ou</span>
                </div>
              </div>

              <div className="text-center text-sm">
                Já tem uma conta?{" "}
                <Link href="/auth/login" className="font-semibold text-primary hover:underline">
                  Entrar
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Ao criar uma conta, você concorda com nossos Termos de Serviço e Política de Privacidade
        </p>
      </div>
    </div>
  )
}

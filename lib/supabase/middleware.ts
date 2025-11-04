import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user profile to check role
  let userRole = null
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    userRole = profile?.role
  }

  const isAuthPage = request.nextUrl.pathname.startsWith("/auth")
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard")
  const isHomePage = request.nextUrl.pathname === "/"

  // If not logged in and trying to access dashboard, redirect to login
  if (!user && isDashboard) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // If logged in as member trying to access dashboard, block access
  if (user && userRole === "member" && isDashboard) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // If logged in as organizer trying to access public event pages, block access
  // Allow only: /, /auth/*, /dashboard/*
  if (user && userRole === "organizer" && !isDashboard && !isAuthPage && !isHomePage) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // If logged in and trying to access auth pages (except reset password), redirect based on role
  if (
    user &&
    isAuthPage &&
    !request.nextUrl.pathname.includes("/auth/reset-password") &&
    !request.nextUrl.pathname.includes("/auth/forgot-password")
  ) {
    if (userRole === "organizer") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    } else {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return supabaseResponse
}

import { createClient } from "@/lib/supabase/server"

export async function getSession() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getSession()
  return { session: data?.session, error }
}

export async function getUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  return { user: data?.user, error }
}

export async function getUserProfile() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (!user) return { profile: null, error: "Not authenticated" }

  const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return { profile, error: profileError }
}

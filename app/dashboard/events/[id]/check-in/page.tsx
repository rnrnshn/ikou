import { createServerClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { CheckInInterface } from "./components/CheckInInterface"

export const dynamic = "force-dynamic"

interface CheckInPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function CheckInPage(props: CheckInPageProps) {
  const params = await props.params
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch event details
  const { data: event, error } = await supabase
    .from("events")
    .select(`
      *,
      communities!inner(
        id,
        name,
        organizer_id
      )
    `)
    .eq("id", params.id)
    .single()

  if (error || !event) {
    redirect("/dashboard/events")
  }

  // Check if user is the organizer
  if (event.communities.organizer_id !== user.id) {
    redirect("/dashboard/events")
  }

  return (
    <div className="container py-8">
      <CheckInInterface event={event} organizerId={user.id} />
    </div>
  )
}

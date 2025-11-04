"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Users, UserMinus, Shield, User as UserIcon } from "lucide-react"

interface Profile {
  name: string
  email: string
}

interface Member {
  id: string
  user_id: string
  role: string
  joined_at: string
  profiles: Profile
}

export default function MembersPage() {
  const supabase = createClient()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [communityId, setCommunityId] = useState<string | null>(null)
  const [removingMember, setRemovingMember] = useState<string | null>(null)

  useEffect(() => {
    fetchCommunityAndMembers()
  }, [])

  async function fetchCommunityAndMembers() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Get organizer's community
      const { data: community } = await supabase
        .from("communities")
        .select("id")
        .eq("organizer_id", user.id)
        .single()

      if (!community) {
        setLoading(false)
        return
      }

      setCommunityId(community.id)

      // Fetch members
      const { data: membersData, error } = await supabase
        .from("community_members")
        .select(
          `
          id,
          user_id,
          role,
          joined_at,
          profiles!inner (
            name,
            email
          )
        `
        )
        .eq("community_id", community.id)
        .order("joined_at", { ascending: false })

      if (error) throw error

      setMembers((membersData as any) || [])
    } catch (error) {
      console.error("Error fetching members:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm("Tem certeza que deseja remover este membro da comunidade?")) {
      setRemovingMember(null)
      return
    }

    try {
      const { error } = await supabase.from("community_members").delete().eq("id", memberId)

      if (error) throw error

      // Update local state
      setMembers(members.filter((m) => m.id !== memberId))
      setRemovingMember(null)
    } catch (error) {
      console.error("Error removing member:", error)
    }
  }

  async function handleUpdateRole(memberId: string, newRole: string) {
    try {
      const { error } = await supabase.from("community_members").update({ role: newRole }).eq("id", memberId)

      if (error) throw error

      // Update local state
      setMembers(members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)))
    } catch (error) {
      console.error("Error updating role:", error)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Carregando membros...</div>
  }

  if (!communityId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Membros</h1>
          <p className="text-muted-foreground">Você precisa criar uma comunidade primeiro</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Membros da Comunidade</h1>
          <p className="text-muted-foreground">
            Total de {members.length} {members.length === 1 ? "membro" : "membros"}
          </p>
        </div>
      </div>

      {members.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum membro ainda</p>
            <p className="text-sm text-muted-foreground mt-2">
              Membros aparecerão aqui quando se juntarem à sua comunidade
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {members.map((member) => (
            <Card key={member.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{member.profiles.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.profiles.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Juntou-se em {new Date(member.joined_at).toLocaleDateString("pt-MZ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {member.role === "moderator" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-secondary">
                      <Shield className="h-3 w-3" />
                      Moderador
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium border">
                      Membro
                    </span>
                  )}

                  <select
                    value={member.role || "member"}
                    onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                    className="text-sm border rounded px-2 py-1 bg-background"
                  >
                    <option value="member">Membro</option>
                    <option value="moderator">Moderador</option>
                  </select>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

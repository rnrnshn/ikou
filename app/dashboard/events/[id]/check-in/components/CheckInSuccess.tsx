import { CheckIn, RSVP } from "@/types/models"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"

interface CheckInSuccessProps {
  checkIn: CheckIn
  rsvp: RSVP
}

export function CheckInSuccess({ checkIn, rsvp }: CheckInSuccessProps) {
  const user = (checkIn as any).profiles
  const ticket = (rsvp as any).event_tickets

  return (
    <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-1">
              Check-in realizado com sucesso!
            </h3>
            <div className="space-y-1">
              <p className="text-sm text-green-800 dark:text-green-200">
                <span className="font-medium">Nome:</span> {user?.name || "Nome não disponível"}
              </p>
              <p className="text-sm text-green-800 dark:text-green-200">
                <span className="font-medium">Email:</span> {user?.email || "Email não disponível"}
              </p>
              {ticket && (
                <p className="text-sm text-green-800 dark:text-green-200">
                  <span className="font-medium">Ingresso:</span>{" "}
                  <Badge variant="outline" className="ml-1">
                    {ticket.name}
                  </Badge>
                </p>
              )}
              <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                {new Date(checkIn.checked_in_at).toLocaleString("pt-MZ")}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

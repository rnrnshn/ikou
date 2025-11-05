import { Check } from "lucide-react"
import type { EventType } from "@/types/models"
import { getVisibleSteps } from "../types"

interface WizardProgressProps {
  currentStep: number
  eventType: EventType | null
}

export function WizardProgress({ currentStep, eventType }: WizardProgressProps) {
  const visibleSteps = getVisibleSteps(eventType)
  const currentIndex = visibleSteps.findIndex((step) => step.number === currentStep)

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {visibleSteps.map((step, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex
          const isUpcoming = index > currentIndex

          return (
            <div key={step.number} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                    ${
                      isCompleted
                        ? "bg-primary border-primary text-primary-foreground"
                        : isCurrent
                          ? "border-primary text-primary bg-background"
                          : "border-border text-muted-foreground bg-background"
                    }
                  `}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : <span className="text-sm font-medium">{index + 1}</span>}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`text-xs font-medium ${
                      isCurrent ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.name}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {index < visibleSteps.length - 1 && (
                <div
                  className={`
                    flex-1 h-0.5 mx-2 transition-all
                    ${isCompleted ? "bg-primary" : "bg-border"}
                  `}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

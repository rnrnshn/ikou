import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Save } from "lucide-react"
import type { EventType } from "@/types/models"
import { getNextStepNumber, getPrevStepNumber } from "../types"

interface WizardNavigationProps {
  currentStep: number
  eventType: EventType | null
  isFirstStep: boolean
  isLastStep: boolean
  isLoading: boolean
  isSaving: boolean
  onBack: () => void
  onNext: () => void
  onSaveDraft: () => void
  onPublish: () => void
}

export function WizardNavigation({
  currentStep,
  eventType,
  isFirstStep,
  isLastStep,
  isLoading,
  isSaving,
  onBack,
  onNext,
  onSaveDraft,
  onPublish,
}: WizardNavigationProps) {
  const canGoBack = getPrevStepNumber(currentStep, eventType) !== null
  const canGoNext = getNextStepNumber(currentStep, eventType) !== null

  return (
    <div className="flex items-center justify-between pt-6 border-t">
      {/* Left: Back Button */}
      <div>
        {canGoBack && (
          <Button type="button" variant="outline" onClick={onBack} disabled={isLoading || isSaving}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        )}
      </div>

      {/* Right: Save Draft, Next/Publish Buttons */}
      <div className="flex gap-3">
        {/* Save Draft Button (show on all steps except last) */}
        {!isLastStep && (
          <Button type="button" variant="outline" onClick={onSaveDraft} disabled={isLoading || isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar Rascunho"}
          </Button>
        )}

        {/* Next or Publish Button */}
        {isLastStep ? (
          <>
            {/* Save Draft on last step */}
            <Button type="button" variant="outline" onClick={onSaveDraft} disabled={isLoading || isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Salvando..." : "Salvar Rascunho"}
            </Button>

            {/* Publish Button */}
            <Button type="button" onClick={onPublish} disabled={isLoading || isSaving}>
              {isLoading ? "Publicando..." : "Publicar Evento"}
            </Button>
          </>
        ) : (
          canGoNext && (
            <Button type="button" onClick={onNext} disabled={isLoading || isSaving}>
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )
        )}
      </div>
    </div>
  )
}

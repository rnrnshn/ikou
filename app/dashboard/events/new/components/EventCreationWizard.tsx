"use client"

import { useReducer, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { WizardProgress } from "./WizardProgress"
import { WizardNavigation } from "./WizardNavigation"
import { EventTypeSelector } from "./steps/EventTypeSelector"
import { GeneralInfoForm } from "./steps/GeneralInfoForm"
import { ScheduleAgendaForm } from "./steps/ScheduleAgendaForm"
import { LocationForm } from "./steps/LocationForm"
import { VirtualPlatformForm } from "./steps/VirtualPlatformForm"
import { EventTrackingForm } from "./steps/EventTrackingForm"
import { SpeakersForm } from "./steps/SpeakersForm"
import { SponsorsForm } from "./steps/SponsorsForm"
import { TicketsForm } from "./steps/TicketsForm"
import { EventReview } from "./steps/EventReview"
import { wizardReducer, initialState } from "../reducer"
import { getVisibleSteps, getPrevStepNumber, getNextStepNumber } from "../types"
import type { EventType, AgendaItemInput, SpeakerInput, SponsorInput, TicketInput } from "@/types/models"
import { createEvent, saveDraft } from "../api"

interface EventCreationWizardProps {
  communityId: string
  organizerId: string
}

export function EventCreationWizard({ communityId, organizerId }: EventCreationWizardProps) {
  const router = useRouter()
  const [state, dispatch] = useReducer(wizardReducer, initialState)

  // Image preview states
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [speakerImagePreviews, setSpeakerImagePreviews] = useState<Record<number, string>>({})
  const [sponsorLogoPreviews, setSponsorLogoPreviews] = useState<Record<number, string>>({})

  const visibleSteps = getVisibleSteps(state.formData.event_type)
  const isFirstStep = state.currentStep === 1
  const isLastStep = state.currentStep === 10

  // ==========================================
  // Helper Functions
  // ==========================================

  const createImagePreview = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
  }, [])

  // ==========================================
  // Navigation Handlers
  // ==========================================

  const handleNext = () => {
    // TODO: Add validation before advancing
    dispatch({ type: "NEXT_STEP" })
    window.scrollTo(0, 0)
  }

  const handleBack = () => {
    dispatch({ type: "PREV_STEP" })
    window.scrollTo(0, 0)
  }

  const handleSaveDraft = async () => {
    dispatch({ type: "SET_SAVING", payload: true })
    try {
      await saveDraft(state.formData, communityId, organizerId)
      // TODO: Show success message
      alert("Rascunho salvo com sucesso!")
    } catch (error) {
      console.error("Error saving draft:", error)
      alert("Erro ao salvar rascunho")
    } finally {
      dispatch({ type: "SET_SAVING", payload: false })
    }
  }

  const handlePublish = async () => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      const event = await createEvent(state.formData, communityId, organizerId)
      // TODO: Show success message
      router.push(`/dashboard/events/${event.id}`)
    } catch (error) {
      console.error("Error publishing event:", error)
      alert("Erro ao publicar evento")
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  // ==========================================
  // Step-specific Handlers
  // ==========================================

  // Step 1: Event Type
  const handleEventTypeChange = (type: EventType) => {
    dispatch({ type: "SET_EVENT_TYPE", payload: type })
  }

  // Step 2: General Info
  const handleImageChange = async (file: File) => {
    const preview = await createImagePreview(file)
    setImagePreview(preview)
    dispatch({ type: "UPDATE_FORM", payload: { imageFile: file } })
  }

  const handleImageRemove = () => {
    setImagePreview(null)
    dispatch({ type: "UPDATE_FORM", payload: { imageFile: null, image_url: null } })
  }

  // Step 3: Agenda
  const handleAddAgendaItem = () => {
    dispatch({
      type: "ADD_AGENDA_ITEM",
      payload: { title: "", description: "", start_time: "", end_time: "" },
    })
  }

  const handleAgendaItemChange = (index: number, field: keyof AgendaItemInput, value: string) => {
    const updatedItem = { ...state.formData.agenda_items[index], [field]: value }
    dispatch({ type: "UPDATE_AGENDA_ITEM", payload: { index, item: updatedItem } })
  }

  // Step 7: Speakers
  const handleAddSpeaker = () => {
    dispatch({ type: "ADD_SPEAKER", payload: { name: "", title: "", bio: "" } })
  }

  const handleSpeakerChange = async (index: number, field: keyof SpeakerInput, value: string | File) => {
    if (field === "imageFile" && value instanceof File) {
      const preview = await createImagePreview(value)
      setSpeakerImagePreviews((prev) => ({ ...prev, [index]: preview }))
    }
    if (field === "imageFile" && value === "") {
      setSpeakerImagePreviews((prev) => {
        const updated = { ...prev }
        delete updated[index]
        return updated
      })
    }
    const updatedSpeaker = { ...state.formData.speakers[index], [field]: value }
    dispatch({ type: "UPDATE_SPEAKER", payload: { index, speaker: updatedSpeaker } })
  }

  const getSpeakerImagePreview = (index: number) => speakerImagePreviews[index] || null

  // Step 8: Sponsors
  const handleAddSponsor = () => {
    dispatch({ type: "ADD_SPONSOR", payload: { name: "" } })
  }

  const handleSponsorChange = async (index: number, field: keyof SponsorInput, value: string | File) => {
    if (field === "logoFile" && value instanceof File) {
      const preview = await createImagePreview(value)
      setSponsorLogoPreviews((prev) => ({ ...prev, [index]: preview }))
    }
    if (field === "logoFile" && value === "") {
      setSponsorLogoPreviews((prev) => {
        const updated = { ...prev }
        delete updated[index]
        return updated
      })
    }
    const updatedSponsor = { ...state.formData.sponsors[index], [field]: value }
    dispatch({ type: "UPDATE_SPONSOR", payload: { index, sponsor: updatedSponsor } })
  }

  const getSponsorLogoPreview = (index: number) => sponsorLogoPreviews[index] || null

  // Step 9: Tickets
  const handleAddTicket = () => {
    dispatch({ type: "ADD_TICKET", payload: { name: "", price: 0 } })
  }

  const handleTicketChange = (index: number, field: keyof TicketInput, value: string | number) => {
    const updatedTicket = { ...state.formData.tickets[index], [field]: value }
    dispatch({ type: "UPDATE_TICKET", payload: { index, ticket: updatedTicket } })
  }

  // ==========================================
  // Render Current Step
  // ==========================================

  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return <EventTypeSelector value={state.formData.event_type} onChange={handleEventTypeChange} />

      case 2:
        return (
          <GeneralInfoForm
            title={state.formData.title}
            description={state.formData.description}
            imagePreview={imagePreview}
            isHidden={state.formData.is_hidden}
            onTitleChange={(value) => dispatch({ type: "UPDATE_FORM", payload: { title: value } })}
            onDescriptionChange={(value) => dispatch({ type: "UPDATE_FORM", payload: { description: value } })}
            onImageChange={handleImageChange}
            onImageRemove={handleImageRemove}
            onHiddenChange={(checked) => dispatch({ type: "UPDATE_FORM", payload: { is_hidden: checked } })}
          />
        )

      case 3:
        return (
          <ScheduleAgendaForm
            startDate={state.formData.start_date}
            startTime={state.formData.start_time}
            endDate={state.formData.end_date}
            endTime={state.formData.end_time}
            timezone={state.formData.timezone}
            agendaItems={state.formData.agenda_items}
            onStartDateChange={(value) => dispatch({ type: "UPDATE_FORM", payload: { start_date: value } })}
            onStartTimeChange={(value) => dispatch({ type: "UPDATE_FORM", payload: { start_time: value } })}
            onEndDateChange={(value) => dispatch({ type: "UPDATE_FORM", payload: { end_date: value } })}
            onEndTimeChange={(value) => dispatch({ type: "UPDATE_FORM", payload: { end_time: value } })}
            onTimezoneChange={(value) => dispatch({ type: "UPDATE_FORM", payload: { timezone: value } })}
            onAddAgendaItem={handleAddAgendaItem}
            onRemoveAgendaItem={(index) => dispatch({ type: "REMOVE_AGENDA_ITEM", payload: index })}
            onAgendaItemChange={handleAgendaItemChange}
          />
        )

      case 4:
        return (
          <LocationForm
            venueName={state.formData.venue_name}
            address={state.formData.address}
            city={state.formData.city}
            showMap={state.formData.show_map}
            onVenueNameChange={(value) => dispatch({ type: "UPDATE_FORM", payload: { venue_name: value } })}
            onAddressChange={(value) => dispatch({ type: "UPDATE_FORM", payload: { address: value } })}
            onCityChange={(value) => dispatch({ type: "UPDATE_FORM", payload: { city: value } })}
            onShowMapChange={(checked) => dispatch({ type: "UPDATE_FORM", payload: { show_map: checked } })}
          />
        )

      case 5:
        return (
          <VirtualPlatformForm
            externalUrl={state.formData.external_url}
            virtualInstructions={state.formData.virtual_instructions}
            onExternalUrlChange={(value) => dispatch({ type: "UPDATE_FORM", payload: { external_url: value } })}
            onVirtualInstructionsChange={(value) => dispatch({ type: "UPDATE_FORM", payload: { virtual_instructions: value } })}
          />
        )

      case 6:
        return (
          <EventTrackingForm
            facebookPixelId={state.formData.facebook_pixel_id}
            onFacebookPixelIdChange={(value) => dispatch({ type: "UPDATE_FORM", payload: { facebook_pixel_id: value } })}
          />
        )

      case 7:
        return (
          <SpeakersForm
            speakers={state.formData.speakers}
            onAddSpeaker={handleAddSpeaker}
            onRemoveSpeaker={(index) => dispatch({ type: "REMOVE_SPEAKER", payload: index })}
            onSpeakerChange={handleSpeakerChange}
            getSpeakerImagePreview={getSpeakerImagePreview}
          />
        )

      case 8:
        return (
          <SponsorsForm
            sponsors={state.formData.sponsors}
            onAddSponsor={handleAddSponsor}
            onRemoveSponsor={(index) => dispatch({ type: "REMOVE_SPONSOR", payload: index })}
            onSponsorChange={handleSponsorChange}
            getSponsorLogoPreview={getSponsorLogoPreview}
          />
        )

      case 9:
        return (
          <TicketsForm
            tickets={state.formData.tickets}
            onAddTicket={handleAddTicket}
            onRemoveTicket={(index) => dispatch({ type: "REMOVE_TICKET", payload: index })}
            onTicketChange={handleTicketChange}
          />
        )

      case 10:
        return <EventReview formData={state.formData} imagePreview={imagePreview} />

      default:
        return null
    }
  }

  // ==========================================
  // Main Render
  // ==========================================

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <WizardProgress currentStep={state.currentStep} eventType={state.formData.event_type} />

      <Card>
        <CardContent className="p-6 md:p-8">{renderStep()}</CardContent>
      </Card>

      <div className="mt-6">
        <WizardNavigation
          currentStep={state.currentStep}
          eventType={state.formData.event_type}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          isLoading={state.isLoading}
          isSaving={state.isSaving}
          onBack={handleBack}
          onNext={handleNext}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
        />
      </div>
    </div>
  )
}

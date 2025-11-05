import type { AgendaItemInput, EventType, SpeakerInput, SponsorInput, TicketInput } from "@/types/models"

// ==========================================
// Wizard Form Data
// ==========================================

export interface EventFormData {
  // Step 1: Event Type
  event_type: EventType | null

  // Step 2: General Info
  title: string
  description: string
  image_url: string | null
  imageFile: File | null
  tags: string[]
  is_hidden: boolean

  // Step 3: Schedule & Agenda
  start_date: string
  start_time: string
  end_date: string
  end_time: string
  timezone: string
  agenda_items: AgendaItemInput[]

  // Step 4: Location (conditional for in_person & hybrid)
  venue_name: string
  address: string
  city: string
  show_map: boolean

  // Step 5: Virtual Platform (conditional for virtual & hybrid)
  external_url: string
  virtual_instructions: string

  // Step 6: Event Tracking
  facebook_pixel_id: string

  // Step 7: Speakers
  speakers: SpeakerInput[]

  // Step 8: Sponsors
  sponsors: SponsorInput[]

  // Step 9: Tickets
  tickets: TicketInput[]

  // Meta
  status: "draft" | "published"
}

// ==========================================
// Wizard State
// ==========================================

export interface WizardState {
  currentStep: number
  formData: EventFormData
  errors: Record<string, string>
  isLoading: boolean
  isSaving: boolean
}

// ==========================================
// Wizard Actions
// ==========================================

export type WizardAction =
  | { type: "SET_STEP"; payload: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "UPDATE_FORM"; payload: Partial<EventFormData> }
  | { type: "SET_EVENT_TYPE"; payload: EventType }
  | { type: "ADD_AGENDA_ITEM"; payload: AgendaItemInput }
  | { type: "REMOVE_AGENDA_ITEM"; payload: number }
  | { type: "UPDATE_AGENDA_ITEM"; payload: { index: number; item: AgendaItemInput } }
  | { type: "ADD_SPEAKER"; payload: SpeakerInput }
  | { type: "REMOVE_SPEAKER"; payload: number }
  | { type: "UPDATE_SPEAKER"; payload: { index: number; speaker: SpeakerInput } }
  | { type: "ADD_SPONSOR"; payload: SponsorInput }
  | { type: "REMOVE_SPONSOR"; payload: number }
  | { type: "UPDATE_SPONSOR"; payload: { index: number; sponsor: SponsorInput } }
  | { type: "ADD_TICKET"; payload: TicketInput }
  | { type: "REMOVE_TICKET"; payload: number }
  | { type: "UPDATE_TICKET"; payload: { index: number; ticket: TicketInput } }
  | { type: "SET_ERROR"; payload: { field: string; message: string } }
  | { type: "CLEAR_ERRORS" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_SAVING"; payload: boolean }
  | { type: "RESET_FORM" }

// ==========================================
// Step Configuration
// ==========================================

export interface StepConfig {
  number: number
  name: string
  required: boolean
  visible: (eventType: EventType | null) => boolean
}

export const STEPS: StepConfig[] = [
  { number: 1, name: "Tipo de Evento", required: true, visible: () => true },
  { number: 2, name: "Informações Gerais", required: true, visible: () => true },
  { number: 3, name: "Horário e Agenda", required: true, visible: () => true },
  {
    number: 4,
    name: "Localização",
    required: true,
    visible: (type) => type === "in_person" || type === "hybrid",
  },
  {
    number: 5,
    name: "Plataforma Virtual",
    required: true,
    visible: (type) => type === "virtual" || type === "hybrid",
  },
  { number: 6, name: "Rastreamento", required: false, visible: () => true },
  { number: 7, name: "Palestrantes", required: false, visible: () => true },
  { number: 8, name: "Patrocinadores", required: false, visible: () => true },
  { number: 9, name: "Ingressos", required: false, visible: () => true },
  { number: 10, name: "Revisar e Publicar", required: true, visible: () => true },
]

// ==========================================
// Helper Functions
// ==========================================

export function getVisibleSteps(eventType: EventType | null): StepConfig[] {
  return STEPS.filter((step) => step.visible(eventType))
}

export function getStepByNumber(stepNumber: number, eventType: EventType | null): StepConfig | undefined {
  const visibleSteps = getVisibleSteps(eventType)
  return visibleSteps.find((step) => step.number === stepNumber)
}

export function getTotalSteps(eventType: EventType | null): number {
  return getVisibleSteps(eventType).length
}

export function getNextStepNumber(currentStep: number, eventType: EventType | null): number | null {
  const visibleSteps = getVisibleSteps(eventType)
  const currentIndex = visibleSteps.findIndex((s) => s.number === currentStep)
  if (currentIndex === -1 || currentIndex === visibleSteps.length - 1) return null
  return visibleSteps[currentIndex + 1].number
}

export function getPrevStepNumber(currentStep: number, eventType: EventType | null): number | null {
  const visibleSteps = getVisibleSteps(eventType)
  const currentIndex = visibleSteps.findIndex((s) => s.number === currentStep)
  if (currentIndex <= 0) return null
  return visibleSteps[currentIndex - 1].number
}

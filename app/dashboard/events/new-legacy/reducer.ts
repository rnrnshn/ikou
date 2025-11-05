import type { WizardAction, WizardState } from "./types"
import { getNextStepNumber, getPrevStepNumber } from "./types"

// ==========================================
// Initial State
// ==========================================

export const initialFormData = {
  // Step 1
  event_type: null,

  // Step 2
  title: "",
  description: "",
  image_url: null,
  imageFile: null,
  tags: [],
  is_hidden: false,

  // Step 3
  start_date: "",
  start_time: "",
  end_date: "",
  end_time: "",
  timezone: "Africa/Maputo",
  agenda_items: [],

  // Step 4
  venue_name: "",
  address: "",
  city: "",
  show_map: true,

  // Step 5
  external_url: "",
  virtual_instructions: "",

  // Step 6
  facebook_pixel_id: "",

  // Step 7
  speakers: [],

  // Step 8
  sponsors: [],

  // Step 9
  tickets: [],

  // Meta
  status: "draft" as const,
}

export const initialState: WizardState = {
  currentStep: 1,
  formData: initialFormData,
  errors: {},
  isLoading: false,
  isSaving: false,
}

// ==========================================
// Reducer
// ==========================================

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_STEP":
      return {
        ...state,
        currentStep: action.payload,
      }

    case "NEXT_STEP": {
      const nextStep = getNextStepNumber(state.currentStep, state.formData.event_type)
      if (nextStep === null) return state
      return {
        ...state,
        currentStep: nextStep,
      }
    }

    case "PREV_STEP": {
      const prevStep = getPrevStepNumber(state.currentStep, state.formData.event_type)
      if (prevStep === null) return state
      return {
        ...state,
        currentStep: prevStep,
      }
    }

    case "UPDATE_FORM":
      return {
        ...state,
        formData: {
          ...state.formData,
          ...action.payload,
        },
      }

    case "SET_EVENT_TYPE":
      return {
        ...state,
        formData: {
          ...state.formData,
          event_type: action.payload,
        },
      }

    case "ADD_AGENDA_ITEM":
      return {
        ...state,
        formData: {
          ...state.formData,
          agenda_items: [...state.formData.agenda_items, action.payload],
        },
      }

    case "REMOVE_AGENDA_ITEM":
      return {
        ...state,
        formData: {
          ...state.formData,
          agenda_items: state.formData.agenda_items.filter((_, index) => index !== action.payload),
        },
      }

    case "UPDATE_AGENDA_ITEM":
      return {
        ...state,
        formData: {
          ...state.formData,
          agenda_items: state.formData.agenda_items.map((item, index) =>
            index === action.payload.index ? action.payload.item : item
          ),
        },
      }

    case "ADD_SPEAKER":
      return {
        ...state,
        formData: {
          ...state.formData,
          speakers: [...state.formData.speakers, action.payload],
        },
      }

    case "REMOVE_SPEAKER":
      return {
        ...state,
        formData: {
          ...state.formData,
          speakers: state.formData.speakers.filter((_, index) => index !== action.payload),
        },
      }

    case "UPDATE_SPEAKER":
      return {
        ...state,
        formData: {
          ...state.formData,
          speakers: state.formData.speakers.map((speaker, index) =>
            index === action.payload.index ? action.payload.speaker : speaker
          ),
        },
      }

    case "ADD_SPONSOR":
      return {
        ...state,
        formData: {
          ...state.formData,
          sponsors: [...state.formData.sponsors, action.payload],
        },
      }

    case "REMOVE_SPONSOR":
      return {
        ...state,
        formData: {
          ...state.formData,
          sponsors: state.formData.sponsors.filter((_, index) => index !== action.payload),
        },
      }

    case "UPDATE_SPONSOR":
      return {
        ...state,
        formData: {
          ...state.formData,
          sponsors: state.formData.sponsors.map((sponsor, index) =>
            index === action.payload.index ? action.payload.sponsor : sponsor
          ),
        },
      }

    case "ADD_TICKET":
      return {
        ...state,
        formData: {
          ...state.formData,
          tickets: [...state.formData.tickets, action.payload],
        },
      }

    case "REMOVE_TICKET":
      return {
        ...state,
        formData: {
          ...state.formData,
          tickets: state.formData.tickets.filter((_, index) => index !== action.payload),
        },
      }

    case "UPDATE_TICKET":
      return {
        ...state,
        formData: {
          ...state.formData,
          tickets: state.formData.tickets.map((ticket, index) =>
            index === action.payload.index ? action.payload.ticket : ticket
          ),
        },
      }

    case "SET_ERROR":
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.field]: action.payload.message,
        },
      }

    case "CLEAR_ERRORS":
      return {
        ...state,
        errors: {},
      }

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      }

    case "SET_SAVING":
      return {
        ...state,
        isSaving: action.payload,
      }

    case "RESET_FORM":
      return initialState

    default:
      return state
  }
}

import { z } from "zod"

// =============================================================================
// AUTH SCHEMAS
// =============================================================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Email inválido"),
  password: z
    .string()
    .min(1, "Senha é obrigatória")
    .min(6, "Senha deve ter pelo menos 6 caracteres"),
})

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, "Nome é obrigatório")
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Email inválido"),
  password: z
    .string()
    .min(1, "Senha é obrigatória")
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .max(100, "Senha deve ter no máximo 100 caracteres"),
  confirmPassword: z
    .string()
    .min(1, "Confirmação de senha é obrigatória"),
  role: z
    .enum(["member", "organizer"], {
      required_error: "Selecione um tipo de conta",
    }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não correspondem",
  path: ["confirmPassword"],
})

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email é obrigatório")
    .email("Email inválido"),
})

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(1, "Senha é obrigatória")
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .max(100, "Senha deve ter no máximo 100 caracteres"),
  confirmPassword: z
    .string()
    .min(1, "Confirmação de senha é obrigatória"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não correspondem",
  path: ["confirmPassword"],
})

// =============================================================================
// COMMUNITY SCHEMAS
// =============================================================================

export const createCommunitySchema = z.object({
  name: z
    .string()
    .min(1, "Nome da comunidade é obrigatório")
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  description: z
    .string()
    .min(1, "Descrição é obrigatória")
    .min(10, "Descrição deve ter pelo menos 10 caracteres")
    .max(1000, "Descrição deve ter no máximo 1000 caracteres"),
  category: z
    .enum(["Tech", "Business", "Arts", "Sports", "Education", "Social", "Other"], {
      required_error: "Selecione uma categoria",
    }),
  city: z
    .string()
    .min(1, "Cidade é obrigatória")
    .min(2, "Cidade deve ter pelo menos 2 caracteres")
    .max(100, "Cidade deve ter no máximo 100 caracteres"),
  image_url: z
    .string()
    .url("URL da imagem inválida")
    .optional()
    .or(z.literal("")),
})

export const editCommunitySchema = createCommunitySchema

// =============================================================================
// EVENT SCHEMAS
// =============================================================================

export const createEventSchema = z.object({
  title: z
    .string()
    .min(1, "Título do evento é obrigatório")
    .min(3, "Título deve ter pelo menos 3 caracteres")
    .max(200, "Título deve ter no máximo 200 caracteres"),
  description: z
    .string()
    .min(1, "Descrição é obrigatória")
    .min(10, "Descrição deve ter pelo menos 10 caracteres")
    .max(2000, "Descrição deve ter no máximo 2000 caracteres"),
  community_id: z
    .string()
    .uuid("Selecione uma comunidade válida")
    .min(1, "Comunidade é obrigatória"),
  start_date: z
    .string()
    .min(1, "Data de início é obrigatória")
    .refine((date) => {
      const selectedDate = new Date(date)
      const now = new Date()
      return selectedDate > now
    }, "Data de início deve ser no futuro"),
  end_date: z
    .string()
    .min(1, "Data de término é obrigatória"),
  location: z
    .string()
    .min(1, "Local é obrigatório")
    .min(3, "Local deve ter pelo menos 3 caracteres")
    .max(200, "Local deve ter no máximo 200 caracteres"),
  is_online: z
    .boolean()
    .optional()
    .default(false),
  max_attendees: z
    .number()
    .int("Número de participantes deve ser inteiro")
    .positive("Número de participantes deve ser positivo")
    .max(10000, "Número máximo de participantes é 10.000")
    .optional()
    .nullable(),
  image_url: z
    .string()
    .url("URL da imagem inválida")
    .optional()
    .or(z.literal("")),
}).refine((data) => {
  const startDate = new Date(data.start_date)
  const endDate = new Date(data.end_date)
  return endDate > startDate
}, {
  message: "Data de término deve ser após a data de início",
  path: ["end_date"],
})

export const editEventSchema = z.object({
  title: z
    .string()
    .min(1, "Título do evento é obrigatório")
    .min(3, "Título deve ter pelo menos 3 caracteres")
    .max(200, "Título deve ter no máximo 200 caracteres"),
  description: z
    .string()
    .min(1, "Descrição é obrigatória")
    .min(10, "Descrição deve ter pelo menos 10 caracteres")
    .max(2000, "Descrição deve ter no máximo 2000 caracteres"),
  community_id: z
    .string()
    .uuid("Selecione uma comunidade válida")
    .min(1, "Comunidade é obrigatória"),
  start_date: z
    .string()
    .min(1, "Data de início é obrigatória"),
  end_date: z
    .string()
    .min(1, "Data de término é obrigatória"),
  location: z
    .string()
    .min(1, "Local é obrigatório")
    .min(3, "Local deve ter pelo menos 3 caracteres")
    .max(200, "Local deve ter no máximo 200 caracteres"),
  is_online: z
    .boolean()
    .optional()
    .default(false),
  max_attendees: z
    .number()
    .int("Número de participantes deve ser inteiro")
    .positive("Número de participantes deve ser positivo")
    .max(10000, "Número máximo de participantes é 10.000")
    .optional()
    .nullable(),
  image_url: z
    .string()
    .url("URL da imagem inválida")
    .optional()
    .or(z.literal("")),
  status: z
    .enum(["upcoming", "past", "cancelled"])
    .optional(),
}).refine((data) => {
  const startDate = new Date(data.start_date)
  const endDate = new Date(data.end_date)
  return endDate > startDate
}, {
  message: "Data de término deve ser após a data de início",
  path: ["end_date"],
})

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type CreateCommunityFormData = z.infer<typeof createCommunitySchema>
export type EditCommunityFormData = z.infer<typeof editCommunitySchema>
export type CreateEventFormData = z.infer<typeof createEventSchema>
export type EditEventFormData = z.infer<typeof editEventSchema>

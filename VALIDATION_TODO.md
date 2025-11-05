# Form Validation Integration TODO

## ✅ Completed
- [x] Login form (`/app/auth/login/page.tsx`) - Uses `loginSchema`

## 📋 Remaining Forms

### Auth Forms
- [ ] **Register form** (`/app/auth/register/page.tsx`)
  - Schema: `registerSchema`
  - Fields: name, email, password, confirmPassword, role
  - Current: Manual validation with basic checks
  - Migration: Replace useState with react-hook-form + zodResolver

- [ ] **Forgot Password form** (`/app/auth/forgot-password/page.tsx`)
  - Schema: `forgotPasswordSchema`
  - Fields: email
  - Current: Basic HTML5 validation
  - Migration: Add react-hook-form + zodResolver

- [ ] **Reset Password form** (`/app/auth/reset-password/page.tsx`)
  - Schema: `resetPasswordSchema`
  - Fields: password, confirmPassword
  - Current: Manual password matching validation
  - Migration: Replace manual validation with Zod schema

### Dashboard Forms

- [ ] **Create Community form** (`/app/dashboard/communities/new/page.tsx`)
  - Schema: `createCommunitySchema`
  - Fields: name, description, category, city, image_url
  - Current: Manual state management
  - Migration: Add react-hook-form + zodResolver + proper validation

- [ ] **Edit Community form** (`/app/dashboard/communities/[id]/edit/page.tsx`)
  - Schema: `editCommunitySchema` (same as create)
  - Fields: name, description, category, city, image_url
  - Current: Manual state management
  - Migration: Pre-populate form with existing data using react-hook-form

- [ ] **Create Event form** (`/app/dashboard/events/new/page.tsx`)
  - Schema: `createEventSchema`
  - Fields: title, description, community_id, start_date, end_date, location, is_online, max_attendees, image_url
  - Current: Manual state management
  - Note: Includes date validation (start < end, future dates only)
  - Migration: Add react-hook-form + zodResolver + date validation

- [ ] **Edit Event form** (`/app/dashboard/events/[id]/edit/page.tsx`)
  - Schema: `editEventSchema`
  - Fields: Same as create + status field
  - Current: Manual state management
  - Note: Date validation should allow past dates for existing events
  - Migration: Pre-populate form with existing data

## Migration Pattern

For each form, follow this pattern:

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { [schemaName], type [TypeName] } from "@/lib/validations"

// In component:
const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
} = useForm<TypeName>({
  resolver: zodResolver(schemaName),
  defaultValues: { /* for edit forms */ }
})

const onSubmit = async (data: TypeName) => {
  // Handle form submission
}

// In JSX:
<Input {...register("fieldName")} disabled={isSubmitting} />
{errors.fieldName && (
  <p className="text-xs text-destructive">{errors.fieldName.message}</p>
)}
```

## Benefits

✅ Type-safe form data
✅ Consistent validation rules
✅ Better error messages in Portuguese
✅ Reduced boilerplate code
✅ Prevents invalid submissions
✅ Better UX with instant field validation

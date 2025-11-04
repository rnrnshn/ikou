# Ikou - Community Events Platform for Mozambique

## 📋 Project Overview

**Ikou** is a community events platform designed for Mozambique. It enables community organizers to manage events and communities, while allowing members to discover, follow communities, and RSVP to events.

The platform is built as a full-stack Next.js application with:
- **Dashboard MVP** (Phase 1) - Event and community management for organizers ✅ IN PROGRESS
- **Public Website** (Phase 2) - Event discovery and RSVP for members 🔄 TODO
- **Polish & Features** (Phase 3) - Email notifications, mobile optimization 🔄 TODO

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16+ (App Router) |
| **Language** | TypeScript |
| **UI Framework** | React 19 |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **Email** | Resend (Phase 3) |
| **Forms** | react-hook-form + Zod |
| **Icons** | lucide-react |
| **Deployment** | Vercel |

---

## 🎨 Design System

### Colors
- **Primary**: `#FF5A7E` (Coral Pink - from logo)
- **Foreground**: `#15171F` (Dark)
- **Background**: `#FFFFFF` / `#F9FAFB` (Light)
- **Success**: `#10B981` (Green)
- **Warning**: `#F59E0B` (Amber)
- **Error**: `#EF4444` (Red)

### Typography
- **Fonts**: Geist (sans), Geist Mono (mono)
- **Headings**: Bold, 24px-48px
- **Body**: Regular, 14px-16px
- **Language**: Portuguese (pt-MZ)

---

## 📁 Project Structure

\`\`\`
ikou/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Global styles
│   ├── dashboard/                  # Dashboard MVP ⭐
│   │   ├── layout.tsx              # Dashboard shell
│   │   ├── page.tsx                # Dashboard home (stats)
│   │   ├── communities/            # Communities management
│   │   │   ├── page.tsx            # List communities
│   │   │   ├── new/page.tsx        # Create community
│   │   │   └── [id]/page.tsx       # Community details
│   │   └── events/                 # Events management
│   │       ├── page.tsx            # List events
│   │       ├── new/page.tsx        # Create event
│   │       └── [id]/
│   │           ├── page.tsx        # Event details
│   │           └── attendees/page.tsx  # View attendees
│   │
│   ├── (public)/                   # Public website (Phase 2) 🔄 TODO
│   ├── (auth)/                     # Authentication (Phase 1) 🔄 TODO
│   └── api/                        # API routes (Phase 2) 🔄 TODO
│
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── dashboard/                  # Dashboard-specific components
│   ├── events/                     # Event components
│   └── communities/                # Community components
│
├── lib/
│   ├── supabase-client.ts          # Client-side Supabase
│   ├── supabase-server.ts          # Server-side Supabase
│   └── utils.ts                    # Utility functions
│
├── types/
│   └── models.ts                   # TypeScript types
│
├── scripts/
│   └── 01-init-schema.sql          # Database schema (needs fixing)
│
└── public/
    └── ikou.svg                    # Brand logo
\`\`\`

---

## ✅ What's Been Built (Phase 1)

### Database Schema
- ✅ `profiles` table - User accounts with roles
- ✅ `communities` table - Community metadata
- ✅ `community_members` table - Community membership
- ✅ `events` table - Event details
- ✅ `event_attendees` table - RSVP tracking
- ✅ Row Level Security (RLS) policies for data protection

### Dashboard Pages
- ✅ Dashboard home (`/dashboard`) - Shows stats and recent activity
- ✅ Communities list (`/dashboard/communities`) - Browse your communities
- ✅ Create community (`/dashboard/communities/new`) - Form to create new community
- ✅ Community details (`/dashboard/communities/[id]`) - View/edit community
- ✅ Events list (`/dashboard/events`) - Browse your events
- ✅ Create event (`/dashboard/events/new`) - Form to create new event
- ✅ Event details (`/dashboard/events/[id]`) - View/edit event
- ✅ Attendees list (`/dashboard/events/[id]/attendees`) - View event attendees

### Features
- ✅ Dashboard navigation sidebar
- ✅ Responsive layout (desktop & mobile)
- ✅ Real-time stats from database
- ✅ Create, read, update communities
- ✅ Create, read, update events
- ✅ View event attendees with CSV export
- ✅ Supabase integration

---

## 🔄 What's In Progress / Issues

### Current Blocker
- ✅ **Database Schema - FIXED**: Duplicate tables cleaned up successfully
  - **Status**: ✅ Schema verified and working correctly
  - **Details**: Removed incorrect tables (`users`, `event_attendees`, `community_members`)
  - **Result**: Clean schema with correct tables (`profiles`, `communities`, `events`, `rsvps`, `community_followers`)

### Authentication (Phase 1) - NEXT PRIORITY
- 🔄 Login page (`/auth/login`) - NOT BUILT
- 🔄 Signup page (`/auth/signup`) - NOT BUILT
- 🔄 Protected routes middleware - NOT BUILT
- 🔄 Session management - NOT BUILT

### Dashboard Polish (Phase 1)
- 🔄 Loading states - Skeleton screens needed
- 🔄 Error handling - Better error messages
- 🔄 Form validation - Zod schemas needed
- 🔄 Confirmation dialogs - For destructive actions
- 🔄 Search & filter - On list pages

---

## 📋 What's TODO

### Phase 2: Public Website (HIGH PRIORITY)
After Phase 1 is complete, build:

- [ ] Public home page with event discovery
- [ ] Event detail pages (SSR for SEO)
- [ ] Community pages (SSR for SEO)
- [ ] Browse events page with filters
- [ ] Browse communities page with filters
- [ ] RSVP functionality (for members)
- [ ] Follow communities (for members)
- [ ] Social sharing buttons
- [ ] Add to calendar export (.ics)

**Pages to build:**
- `/` - Home page with hero + featured events
- `/events` - Browse all events
- `/events/[id]` - Event details (SSR)
- `/communities` - Browse all communities
- `/communities/[id]` - Community details (SSR)
- `/my-events` - User's RSVPd events (protected)
- `/my-communities` - User's followed communities (protected)

### Phase 1 Completion: Authentication (HIGH PRIORITY)
- [ ] Login page with email/password
- [ ] Signup page with role selection (Member/Organizer)
- [ ] Middleware to protect dashboard routes
- [ ] Session management
- [ ] Logout functionality
- [ ] Redirect logic (organizers → dashboard, members → home)

### Phase 3: Email & Polish (MEDIUM PRIORITY)
- [ ] Email notifications via Resend
  - [ ] Welcome email after signup
  - [ ] Event reminder emails
  - [ ] RSVP confirmation emails
  - [ ] Event cancelled notifications
- [ ] Mobile optimization
- [ ] Loading states (skeleton screens)
- [ ] Better error handling
- [ ] Confirmation dialogs
- [ ] Search & filter on list pages
- [ ] Dark mode support

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Vercel account (for Supabase integration)
- Supabase project (connected via v0)

### Setup

1. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Set up Supabase database**
   - Connect Supabase integration in v0
   - Run SQL migration script from `scripts/01-init-schema.sql`
   - **⚠️ Current issue**: Need to use corrected schema script

3. **Start development server**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Open in browser**
   \`\`\`
   http://localhost:3000
   \`\`\`

### Development Workflow
- Dashboard pages: Build in `/app/dashboard/`
- Components: Build in `/components/`
- Styles: Use Tailwind CSS classes
- Database queries: Use Supabase client from `lib/supabase-*`

---

## 📊 Database Schema

### Tables

#### `profiles`
\`\`\`sql
- id (UUID, primary key)
- user_id (UUID, Supabase Auth)
- name (text)
- email (text, unique)
- role (text: 'member', 'organizer', 'admin')
- city (text)
- created_at (timestamp)
\`\`\`

#### `communities`
\`\`\`sql
- id (UUID, primary key)
- name (text)
- description (text)
- category (text)
- city (text)
- image_url (text, nullable)
- organizer_id (UUID, foreign key → profiles)
- created_at (timestamp)
\`\`\`

#### `community_members`
\`\`\`sql
- id (UUID, primary key)
- community_id (UUID, foreign key)
- user_id (UUID, foreign key)
- joined_at (timestamp)
\`\`\`

#### `events`
\`\`\`sql
- id (UUID, primary key)
- title (text)
- description (text)
- community_id (UUID, foreign key)
- organizer_id (UUID, foreign key)
- date (timestamp)
- duration (integer, hours)
- venue_name (text)
- address (text)
- city (text)
- is_online (boolean)
- max_attendees (integer, nullable)
- image_url (text, nullable)
- status (text: 'upcoming', 'past', 'cancelled')
- created_at (timestamp)
\`\`\`

#### `event_attendees`
\`\`\`sql
- id (UUID, primary key)
- event_id (UUID, foreign key)
- user_id (UUID, foreign key)
- status (text: 'attending', 'interested', 'declined')
- registered_at (timestamp)
\`\`\`

---

## 🔐 Security

### Row Level Security (RLS)
- Users can only view communities they created
- Users can only see their own RSVPs
- Community organizers can only modify their own communities
- Event organizers can only modify their own events

### Authentication
- All protected routes require user session
- Organizers have access to `/dashboard/*`
- Members have access to `/my-*` routes
- Public routes accessible without auth

---

## 🎯 Next Steps (IMMEDIATE)

### 1. ✅ Fix Database Schema - COMPLETED
   - ✅ Run corrected SQL migration that uses `organizer_id` instead of `created_by`
   - ✅ Verify all tables created successfully
   - ✅ Clean up duplicate tables from wrong schema

### 2. Build Authentication (Phase 1) - CURRENT PRIORITY
   - Create login page
   - Create signup page
   - Add middleware to protect dashboard
   - Implement session management

### 3. Polish Dashboard (Phase 1)
   - Add loading states (skeleton screens)
   - Add error handling & messages
   - Add form validation (Zod)
   - Add confirmation dialogs for delete actions
   - Test all CRUD operations

### 4. Build Public Website (Phase 2)
   - Home page with event discovery
   - Event detail pages (SSR)
   - RSVP functionality
   - Community following

### 5. Email & Notifications (Phase 3)
   - Set up Resend
   - Email templates
   - Automated reminders

---

## 📝 Notes

- All dates should display in Portuguese locale (pt-MZ)
- Brand color (coral pink) should be used consistently
- Mobile-first responsive design approach
- Test with real Supabase data before deploying
- Use environment variables from Supabase integration

---

## 📞 Support

For issues or questions:
1. Check error logs in browser console
2. Verify Supabase connection and schema
3. Ensure all required environment variables are set
4. Test in incognito mode to rule out cache issues

---

**Last Updated**: November 2, 2025
**Current Phase**: Phase 1 (Dashboard MVP) - In Progress ⭐
**Status**: ✅ Database Schema Fixed - Ready for Authentication Build

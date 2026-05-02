# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Confiax Visita** is a responsive web app for ConFiaX Seguros to manage and track sales visit activity to real estate partner companies (imobiliárias). The PRD is at `prd.md` (written in Portuguese).

Two user roles:
- **Vendedor** (salesperson) — mobile-first; schedules visits, does check-in/checkout with photo, evaluates visits
- **Admin** (manager) — desktop/mobile; manages users, views all data, exports KPI reports

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (React) |
| Auth / DB / Storage | Supabase (PostgreSQL + Auth + Storage) |
| Hosting | Vercel |

## Commands

```bash
npm run dev        # start local dev server (Turbopack)
npm run build      # production build
npm run lint       # ESLint
npx tsc --noEmit   # TypeScript type check
```

Copy `.env.local.example` to `.env.local` and fill in the values before running. Environment variables required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (server-side only, used in API routes).

## Architecture

### Routing & Role-Based Access

| Route | Role | Purpose |
|---|---|---|
| `/login` | All | Authentication |
| `/dashboard` | Vendedor | Visit agenda and history |
| `/visitas/agendar` | Vendedor | Schedule a new visit |
| `/visitas/[id]/checkin` | Vendedor | Check-in with mandatory photo upload |
| `/visitas/[id]/checkout` | Vendedor | Checkout with mandatory evaluation |
| `/admin` | Admin | KPI dashboard |
| `/admin/usuarios` | Admin | User management |
| `/admin/visitas` | Admin | Full visit history with filters |
| `/admin/relatorios` | Admin | CSV/PDF report export |

Session and role are managed via Supabase Auth. Route guards live in `src/proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts`). They redirect unauthenticated users to `/login` and enforce role checks (vendedor cannot access `/admin/*`).

User creation by admins goes through `src/app/api/admin/usuarios/route.ts`, which uses `SUPABASE_SERVICE_ROLE_KEY` via `createAdminClient()` from `src/lib/supabase/server.ts`.

### Database Schema (Supabase / PostgreSQL)

**`users`** — extends Supabase auth.users
- `id` uuid PK, `name` text, `email` text, `role` enum(`vendedor`,`admin`), `active` boolean, `created_at` timestamp

**`imobiliarias`** — pre-seeded directly in Supabase (no app UI in v1)
- `id` uuid PK, `name` text, `address` text, `contact` text, `created_at` timestamp

**`visitas`**
- `id` uuid PK
- `user_id` uuid → users, `imobiliaria_id` uuid → imobiliarias
- `scheduled_at` timestamp, `checkin_at` timestamp, `checkout_at` timestamp
- `duration_minutes` integer (computed on checkout)
- `photo_url` text (Supabase Storage URL)
- `rating` integer 1–5, `notes` text
- `status` enum(`agendada`, `em_andamento`, `concluida`)
- `created_at` timestamp

Row-Level Security (RLS): vendedores may only SELECT/UPDATE their own `visitas` rows; admins have full access.

### Key Business Rules

- Photo upload is mandatory to complete check-in
- Rating (1–5) + notes are mandatory to complete checkout
- `duration_minutes` is calculated automatically at checkout (`checkout_at - checkin_at`)
- No minimum visit duration enforced
- Inactive users (`active = false`) must be blocked at login
- Imobiliárias are managed directly in Supabase — there is no app UI for this in v1

### Visual Identity

- Primary color: `#00AEEF` (ConFiaX blue)
- Font: Inter (or similar modern sans-serif)
- Logo: present in header and login screen (`logo.png` in repo root)

## Out of Scope (v1)

Geolocation, push notifications, calendar integrations, offline mode, imobiliária management UI, subcriteria ratings, per-imobiliária KPIs.

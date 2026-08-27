# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Confiax Visita** is a responsive web app for ConfiaX Seguros to manage and track sales visit activity to real estate partner companies (imobiliárias). The PRD is at `prd.md` (written in Portuguese).

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
npm run lint       # ESLint — currently broken (package.json still calls the removed `next lint`; Next 16 dropped it). Use `npx tsc --noEmit` + `npm run build` to validate changes instead.
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
| `/visitas/[id]/checkout` | Vendedor | Checkout with mandatory evaluation + optional contact registration |
| `/historico` | Vendedor | Full visit history with imobiliária and date filters |
| `/contatos` | Vendedor | Contact list per imobiliária — full CRUD |
| `/acoes` | Vendedor | Action items ("Ações") board — create/edit, comment, change status |
| `/admin` | Admin | KPI dashboard |
| `/admin/usuarios` | Admin | User management |
| `/admin/visitas` | Admin | Full visit history with filters |
| `/admin/contatos` | Admin | Full contact list with imobiliária filter — create, edit, delete |
| `/admin/acoes` | Admin | Full action-item board with filters, sorting, pagination — create (on behalf of any colaborador), edit title/description/due date, change status, comment |
| `/admin/relatorios` | Admin | CSV/PDF report export (visits + contacts) |

Session and role are managed via Supabase Auth. Route guards live in `src/proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts`). They redirect unauthenticated users to `/login` and enforce role checks (vendedor cannot access `/admin/*`).

User creation by admins goes through `src/app/api/admin/usuarios/route.ts`, which uses `SUPABASE_SERVICE_ROLE_KEY` via `createAdminClient()` from `src/lib/supabase/server.ts`.

### Database Schema (Supabase / PostgreSQL)

No SQL migrations are tracked in this repo (no `supabase/migrations` folder) — every table, enum, RLS policy, and trigger for every table (not just `imobiliarias`) is applied by hand in the Supabase Dashboard SQL Editor. When a task requires a schema change, give the user the exact SQL to run there rather than adding a migration file.

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

**`contatos`** — contacts registered during or after visits
- `id` uuid PK
- `imobiliaria_id` uuid → imobiliarias, `created_by` uuid → users
- `visita_id` uuid → visitas (nullable — contacts can be added outside a visit)
- `name` text, `email` text, `role` text, `phone` text
- `created_at` timestamp, `updated_at` timestamp

Row-Level Security (RLS): vendedores may SELECT all contatos (to see each other's contacts per imobiliária), INSERT their own, UPDATE their own; admins have full access including DELETE.

**`acoes`** — action items ("Plano de Ação"), registered during checkout or freely from `/acoes`
- `id` uuid PK
- `imobiliaria_id` uuid → imobiliarias (**nullable** — unlike `contatos`, an ação can exist without a company), `visita_id` uuid → visitas (nullable), `created_by` uuid → users
- `title` text, `description` text, `due_date` date
- `status` enum(`aberto`, `em_andamento`, `concluido`, `cancelado`) — plus a derived (non-persisted) `atrasado` state computed by `getEffectiveAcaoStatus()` in `src/lib/utils.ts` when `due_date` has passed and status is still `aberto`/`em_andamento`, mirroring `getEffectiveStatus()` for visitas
- `created_at`, `updated_at` timestamp

**`acao_comentarios`** — comment thread on an ação
- `id` uuid PK, `acao_id` uuid → acoes (cascade delete), `created_by` uuid → users, `comment` text, `created_at` timestamp

RLS: like contatos, all authenticated users may SELECT all ações/comentários (shared board, visible to everyone). INSERT: vendedores insert with `created_by = auth.uid()`; admins may additionally insert with `created_by` set to **any** user (lets an admin log an ação on behalf of a colaborador — see `AcoesAdminTable.tsx`'s "Nova Ação" modal). UPDATE: any authenticated user may update status/fields (deliberately more permissive than contatos' "update own only", since ações have no `assigned_to` and are meant as a shared to-do board) — **except** `title`/`description`/`due_date`, which a DB trigger (`enforce_acao_locked_fields`) blocks for non-admins, so only an admin can edit those three fields after creation (vendedores see them locked/disabled in the UI too). DELETE on both tables: admin only.

### Key Business Rules

- Photo upload is mandatory to complete check-in
- Rating (1–5) + notes are mandatory to complete checkout
- `duration_minutes` is calculated automatically at checkout (`checkout_at - checkin_at`)
- No minimum visit duration enforced
- Inactive users (`active = false`) must be blocked at login
- Imobiliárias are managed directly in Supabase — there is no app UI for this in v1
- Contacts (`contatos`) can be registered during checkout (linked to the visit) or anytime from `/contatos`
- Phone numbers must always be displayed and entered with the Brazilian mask `(XX) XXXXX-XXXX` / `(XX) XXXX-XXXX` — use `formatPhone` from `src/lib/utils.ts` for both input masking (`onChange`) and display
- Check-in photos are compressed client-side before upload — use `compressImage` from `src/lib/utils.ts` (resizes to max 1600px, re-encodes as JPEG) for any new photo upload flow, to reduce failures on weak mobile connections. Uploads to Supabase Storage should retry on transient failure (see `uploadPhotoWithRetry` in `src/app/(vendedor)/visitas/[id]/checkin/page.tsx` as the reference pattern) and log the real Supabase error via `console.error` rather than only showing a generic message
- Ações (`acoes`) can be registered during checkout (linked to the visit, same optional inline-form pattern as contacts) or anytime from `/acoes`; unlike contacts, imobiliária is optional and the section is shown even on captação (prospecting) visits
- Only an admin can edit an ação's título/descrição/data de finalização once created (enforced both in the UI — fields disabled for vendedores in `AcoesVendedorClient.tsx` — and in the DB via the `enforce_acao_locked_fields` trigger); any vendedor may still change status and add comments
- An admin creating an ação from `/admin/acoes` picks a "Colaborador" (any active user) to set as `created_by`, so ações can be logged on a salesperson's behalf

### Shared Components

| Component | File | Notes |
|---|---|---|
| `VisitaCard` | `src/components/VisitaCard.tsx` | Shows scheduled/in-progress visit; renders check-in or checkout CTA |
| `StarRating` | `src/components/StarRating.tsx` | 1–5 star picker; `role="group"`, `aria-label` and `aria-pressed` per star |
| `LogoutButton` | `src/components/LogoutButton.tsx` | Accepts optional `className` |
| `Combobox` | `src/components/Combobox.tsx` | Searchable select. **Always use instead of `<select>` for large lists** (imobiliárias, etc.) — in filters, forms, and any future pages. Accepts `{ value: string; label: string }[]`. For filters, `value=""` = no filter applied. |
| `AdminNav` | `src/components/AdminNav.tsx` | Two named exports: `AdminDesktopNav` (horizontal links, `hidden md:flex`) and `AdminBottomNav` (fixed bottom bar, `md:hidden`). Both use `usePathname()` for active state. Add to every admin page; pair with `pb-24 md:pb-X` on `<main>`. Nav items: Admin, Visitas, Usuários, Contatos, Ações, Relatórios. |
| `VendedorBottomNav` | `src/components/VendedorBottomNav.tsx` | Fixed bottom nav for vendedor pages. Four items: Início (`/dashboard`), Histórico (`/historico`), Contatos (`/contatos`), Ações (`/acoes`). Add to every vendedor page; pair with `pb-28` on `<main>`. |
| `SuccessToast` | `src/components/SuccessToast.tsx` | Client component. Reads a URL query param (`param` prop), shows toast, clears param via `history.replaceState`. Wrap in `<Suspense>`. Usage: redirect to `/dashboard?agendado=1`, render `<SuccessToast param="agendado" message="..." />` in dashboard. |
| `HistoricoList` | `src/components/HistoricoList.tsx` | Server component. Shows up to 5 completed visits; always renders a link to `/historico`. |
| `HistoricoFiltros` | `src/components/HistoricoFiltros.tsx` | Client component. Receives all `visitas` and `imobiliarias` from server; filters client-side by imobiliária id and date range. Used in `/historico`. |
| `ContatosVendedorClient` | `src/components/ContatosVendedorClient.tsx` | Client component for `/contatos`. Full-screen form overlay (checkout pattern) for create/edit. |
| `AcoesVendedorClient` | `src/components/AcoesVendedorClient.tsx` | Client component for `/acoes`. Same full-screen overlay pattern as `ContatosVendedorClient`; título/descrição/due_date are disabled once an ação exists (admin-only edit), plus a comments section (list + add) inside the edit overlay. |
| `AcoesAdminTable` | `src/components/AcoesAdminTable.tsx` | Client component for `/admin/acoes` — the supervisor board. Mirrors `VisitasAdminTable.tsx` (sortable columns, filters via `useMemo`, client-side pagination `PAGE_SIZE=50`). Also owns the "Nova Ação" creation modal (title/description/due_date/imobiliária + a "Colaborador" `<select>` that sets `created_by` on behalf of any active user). |
| `AcaoDetailModal` | `src/components/AcaoDetailModal.tsx` | Detail/edit modal opened from `AcoesAdminTable`. Mirrors `VisitaDetailModal.tsx`'s layout, but adds an admin-only edit mode for título/descrição/due_date, a status `<select>`, and a comments section (list + add) — the first comment-thread UI in the app. |

### Visual Identity

- Primary color: `#00AEEF` (ConFiaX blue)
- Font: Inter (or similar modern sans-serif)
- Logo: present in header and login screen (`logo.png` in repo root)

## Out of Scope (v1)

Geolocation, push notifications, calendar integrations, offline mode, imobiliária management UI, subcriteria ratings, per-imobiliária KPIs.

## UI Patterns

- **Mobile-first forms** with multiple fields: use full-screen overlay (fixed inset-0, bg-brand-bg, sticky app bar with "← Voltar", flex-1 overflow-y-auto content). See `ContatosVendedorClient.tsx` and checkout page as reference.
- **Vendedor pages** always include `<VendedorBottomNav />` and `pb-28` on `<main>`.
- **Admin pages** always include `<AdminBottomNav />` and `pb-24 md:pb-6` on `<main>`.

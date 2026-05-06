# FuelOS Codebase Handover

This document is a practical handover for incoming developers/partners.

## 1) Product in one paragraph

FuelOS is a race-fueling companion for endurance athletes (running, cycling, triathlon). Users build a fueling plan before an event, follow guidance during the race, then complete a debrief to improve future plans. The app combines profile-based personalization, race planning, live race execution, and post-race memory, with optional integrations (Strava, Garmin, Wahoo) to import activity context.

## 2) Architecture at a glance

- **Frontend:** Next.js App Router + React + TypeScript
- **Backend:** Next.js Route Handlers (`app/api/**`)
- **Database:** PostgreSQL via Prisma
- **Authentication:** Auth.js (NextAuth v5 beta) + Prisma adapter, database sessions
- **Styling:** Tailwind CSS v4
- **Offline/local persistence:** `localStorage` + `localforage` (offline intake queue)
- **Map/route rendering:** MapLibre stack (`maplibre-gl`, `react-map-gl`)

Primary references:
- `package.json`
- `auth.ts`
- `prisma/schema.prisma`
- `app/api/*`

## 3) Repository map (where things live)

- `app/`: App Router pages and API routes
  - User pages: `app/race`, `app/prep`, `app/profil`, `app/history`, `app/races`, `app/mes-plans-courses`
  - APIs: `app/api/user/*`, `app/api/integrations/*`, `app/api/meteo/route.ts`
- `lib/`: shared domain logic (integrations, guards, parsing, services, offline queue)
- `hooks/`: React hooks and profile-related logic
- `prisma/`: schema + migrations
- `public/`: static assets and PWA resources
- `types/`: shared TypeScript domain types
- Root auth/middleware: `auth.ts`, `middleware.ts`

## 4) Local setup and run

### Prerequisites

- Node.js (current LTS recommended)
- PostgreSQL instance

### Install and run

```bash
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

App runs on `http://localhost:3000`.

### Build/quality commands

```bash
npm run lint
npm run build
npm run start
```

## 5) Environment variables checklist

No `.env.example` is currently provided. Based on code usage, define at least:

### Required for core app

- `DATABASE_URL`
- `AUTH_SECRET` (or `NEXTAUTH_SECRET`)

### Auth providers (optional, can be enabled independently)

- Google login:
  - `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET`
  - (legacy aliases are supported in code)
- Email magic link (Resend):
  - `AUTH_RESEND_KEY` (or `RESEND_API_KEY`)
  - Optional sender: `AUTH_EMAIL_FROM`

### Integrations (optional)

- Strava:
  - `STRAVA_CLIENT_ID`
  - `STRAVA_CLIENT_SECRET`
  - `STRAVA_VERIFY_TOKEN` (webhook verification)
- Garmin:
  - `GARMIN_CONSUMER_KEY`
  - `GARMIN_CONSUMER_SECRET`

### App URL resolution

- `NEXT_PUBLIC_APP_URL` or `NEXTAUTH_URL` or `AUTH_URL` (depending on environment)

## 6) Critical user flows (end-to-end)

### Flow A: Plan lifecycle

1. User creates or loads a race plan from plans area.
2. Active plan is tracked locally and can be synced to user plan APIs.
3. Race mode consumes this active plan for live execution.

Main touchpoints:
- UI: `app/mes-plans-courses/*`, `app/race/page.tsx`
- API: `app/api/user/plans/*`

### Flow B: Live race execution

1. User starts race session.
2. Planned intakes are followed/updated in real time.
3. Actions can be queued offline and synced later.

Main touchpoints:
- UI context/state: `app/contexts/RaceContext.tsx`
- Offline queue: `lib/offline/intakeOfflineQueue.ts`
- API: `app/api/user/race-events/*`

### Flow C: Prep and debrief loop

1. User prepares via checklists/protocol in prep page.
2. State is persisted locally and synced to backend.
3. Post-race debrief is stored and reused for next races.

Main touchpoints:
- UI: `app/prep/page.tsx`, `app/history/*`
- API: `app/api/user/prep-state/route.ts`, `app/api/user/debriefs/route.ts`

## 7) Data model overview

Core entities in `prisma/schema.prisma`:

- Auth/session: `User`, `Account`, `Session`, `VerificationToken`
- Planning/history: `PlanSnapshot`, `RaceDebrief`, `RaceEvent`
- Live mode: `RaceSession`, `PlannedIntake`, `IntakeAction`
- User data: `StoredAthleteProfile`, `PrepState`, `CustomProductList`
- Integrations/cache: `ProviderToken`, `CachedActivity`, `StravaConnection`

## 8) Integrations and external boundaries

- **Strava/Garmin/Wahoo OAuth** in `app/api/integrations/*` + `lib/integrations/*`
- **Meteo data** via Open-Meteo endpoint proxy in `app/api/meteo/route.ts`
- **Price endpoints** exist in `app/api/prices/route.ts` (provider-specific base URLs)

## 9) Current status and known risks

- **No automated tests/CI discovered** in repository.
- **Auth route guard drift risk:** `middleware.ts` currently allows fewer signed-in page prefixes than `lib/authRequiredRoutes.ts` suggests (e.g. `/prep`, `/history`, `/races`).
- **Webhook follow-up not completed:** Strava webhook route contains TODO for background processing.
- **Potential config drift:** duplicate-style helpers/files exist (for example Prisma helper duplication and multiple manifest files).
- **Local-first sync complexity:** some flows persist locally and sync best-effort, so conflict handling should be watched.

## 10) Deployment and operations

- Project is structured for standard Next.js deployment (Vercel-friendly).
- Ensure production env vars are present before deploy:
  - `DATABASE_URL`
  - `AUTH_SECRET`
  - provider secrets for any enabled integrations/auth methods
- Run migration deploy command during release:
  - `npm run db:deploy`

## 11) Suggested onboarding checklist (first 2 hours)

1. Install deps and run app locally.
2. Configure minimal env (`DATABASE_URL`, `AUTH_SECRET`) and run migrations.
3. Validate auth entrypoint and reach plans/race screens.
4. Walk one full journey: create/load a plan -> race mode -> save outcome.
5. Confirm integrations page loads and provider status endpoint works.
6. Run lint/build to establish baseline.

## 12) Contribution conventions (recommended)

Current repo has linting and strict TypeScript but limited process docs. Recommended baseline:

- Keep changes scoped per feature and API boundary.
- Run `npm run lint` and `npm run build` before merge.
- Add tests as soon as test runner strategy is chosen.
- Track route-guard alignment whenever account routes are added/changed.

---

If you share this handover externally, attach:
- environment variable values via secure channel,
- one demo account,
- and a short list of priority fixes/features for the next sprint.

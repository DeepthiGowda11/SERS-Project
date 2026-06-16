# SERS — System for Emotional Response and Analysis

A classroom emotion monitoring platform that tracks student emotional states in real time, provides teacher coaching suggestions, and alerts parents when prolonged distress is detected.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/sers-dashboard run dev` — run the frontend (port 24012)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui components + Wouter routing + React Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/` — Drizzle table definitions (classrooms, students, sessions, emotion-records, parent-notifications)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/sers-dashboard/src/pages/` — React page components
- `artifacts/sers-dashboard/src/components/Layout.tsx` — sidebar navigation

## Architecture decisions

- Contract-first OpenAPI spec: codegen produces React Query hooks and Zod schemas so frontend/backend types are always in sync.
- Coaching suggestions are served from a static in-memory list (no DB table needed) for zero-latency response.
- Alert levels (green/yellow/red) are stored alongside each emotion record so dashboards can aggregate without re-classifying.
- Sessions track active/inactive state with `isActive` boolean + optional `endTime` so teachers can start/end classroom monitoring periods.
- Dashboard endpoint computes per-student latest emotion on the fly by querying the most recent record per student in the current session.

## Product

- **Overview** — system-wide stats (total classrooms, students, active sessions, today's emotion records, alert distribution)
- **Classrooms** — create and manage classrooms; click through to live emotion dashboard per classroom
- **Live Dashboard** — per-classroom view showing every student's current emotion state (green/yellow/red), session start/end control
- **Student Trends** — emotion history with frequency bar chart and recent record log per student
- **Sessions** — session history per classroom with emotion record drill-down
- **Parent Notifications** — send and log parent alerts for prolonged distress
- **Coaching** — browse 17 evidence-based intervention suggestions filterable by emotion type

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run codegen after every OpenAPI spec change: `pnpm --filter @workspace/api-spec run codegen`
- DB schema push is dev-only; production schema is managed via Replit Publish flow
- The coaching suggestions route returns static data — no DB table, no migration needed
- Alert levels must be one of: `green`, `yellow`, `red`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

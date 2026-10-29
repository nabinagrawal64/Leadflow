# LeadFlow CRM — Frontend

React + Vite single-page app for the VyorAI SDE intern assignment. It talks to the LeadFlow REST API (`/api/v1`) over JSON with a bearer token.

> **Status:** complete and working end to end. The browser walkthrough in [TEST_CHECKLIST.md](./TEST_CHECKLIST.md) was run against the real backend and a real database.

## Stack

| Concern | Choice |
| --- | --- |
| Build / framework | React 19 + Vite |
| Routing | React Router (protected + public-only routes) |
| HTTP | Axios (one instance, token interceptor, 401 handler) |
| Styling | Tailwind CSS v4 with CSS-variable design tokens; light and dark themes (toggle in the header, follows the OS by default, remembered per browser) |
| Type | Bricolage Grotesque (headings) + Instrument Sans (body), self-hosted via `@fontsource`, so no external font requests |
| Icons | lucide-react |

## Prerequisites

- Node.js 20+ and npm
- The LeadFlow API running (default `http://localhost:5000/api/v1`)

## Setup

```bash
cd frontend
cp .env.example .env     # then edit if your API runs elsewhere
npm install
npm run dev              # http://localhost:5173
```

### Environment variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_API_URL` | Base URL of the REST API, no trailing slash | `http://localhost:5000/api/v1` |
| `VITE_DEV_PROXY` | Optional dev-only proxy target for `/api` | unset |

Only non-secret values belong in `VITE_*` variables — they are bundled into the browser build.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint with oxlint |

## Screens (assignment section 7)

| Route | Screen | Notes |
| --- | --- | --- |
| `/login`, `/register` | Auth | Client + server validation, loading and error feedback, show/hide password |
| `/dashboard` | Dashboard | Metric cards from `GET /dashboard/summary`, pipeline breakdown from real leads, next pending follow-ups, links to Leads |
| `/leads` | Leads | Debounced search (name/company), stage filter, inline stage dropdown, edit/delete with confirm, empty/loading/error states. Search and filter live in the URL |
| `/leads/new` | New lead | Validated create form |
| `/leads/:id` | Lead details | View/edit (`?edit=1`), stage stepper, delete, add follow-up, complete follow-up |
| `/follow-ups` | Follow-ups | All / Pending / Completed tabs, lead link, due date, overdue flag, mark complete, schedule new |

## Design

The look is built around the pipeline itself. Each of the six stages has one colour, used consistently for the dashboard chevrons, the stage chips, the header strip and the login artwork. On a lead's page the same chevrons become the stage control: click a stage to move the lead (saved immediately). Follow-ups use calendar-style date tiles so the due day is the first thing you see, and overdue items turn red. On phones the top navigation becomes a bottom tab bar.

## Architecture

```
src/
  lib/          api.js (axios + endpoints + error parsing), constants, format helpers, useAsync
  context/      AuthContext (session + token), ToastContext, ThemeContext
  components/
    ui/         Button, Field (Input/Select), Badge, Alert, Modal, ConfirmDialog, States (loading/empty/error)
    layout/     AppLayout (top nav, mobile tab bar), RouteGuards, Logo, ThemeToggle
    LeadForm, FollowUpModal, FollowUpRow, DateTile, StageChevrons
  pages/        AuthPage, DashboardPage, LeadsPage, LeadDetailPage (+ NewLeadPage), FollowUpsPage, NotFoundPage
```

Design choices worth knowing:

- **Token handling:** the JWT lives in `localStorage` and is sent as `Authorization: Bearer`. On load the app verifies it with `GET /auth/me`; any later `401` clears the session and redirects to login. `localStorage` is simple but readable by injected scripts; an httpOnly cookie would be the hardening step for production.
- **No hardcoded metrics:** every number on the dashboard comes from the API.
- **Stale-response safety:** `useAsync` ignores out-of-order responses, so fast typing in search never shows old results.
- **Accessibility:** labelled controls, visible focus rings, `role="alert"` on errors, keyboard-closable dialogs, `prefers-reduced-motion` respected.
- **Time:** the API sends ISO UTC timestamps; the UI shows them in the viewer's local timezone and sends `dueAt` as an ISO string.

## API contract the frontend uses

Base path `/api/v1`. Success: `{ "success": true, "message": "...", "data": ... }`. Error: `{ "success": false, "message": "...", "errors": [{ "field": "email", "message": "..." }] }` (`path` or `param` also accepted as the field key).

| Method | Endpoint | Frontend sends | Frontend reads from `data` |
| --- | --- | --- | --- |
| POST | `/auth/register` | `{ name, email, password }` | `{ token, user: { _id, name, email } }` |
| POST | `/auth/login` | `{ email, password }` | `{ token, user }` |
| GET | `/auth/me` | — | `{ user }` (or the user object) |
| GET | `/leads` | `?search=&stage=` | array of leads |
| POST | `/leads` | lead fields (optional empties omitted) | created lead with `_id` |
| GET | `/leads/:id` | — | lead (`createdAt` used) |
| PATCH | `/leads/:id` | changed fields; cleared optionals sent as `null` | updated lead |
| DELETE | `/leads/:id` | — | — |
| GET | `/activities` | `?status=&leadId=` | array; `leadId` populated as `{ _id, name, company }` (a bare id also works) |
| POST | `/activities` | `{ leadId, title, type, dueAt }` | created activity |
| PATCH | `/activities/:id` | `{ status: "Completed" }` | updated activity (`completedAt` shown if present) |
| GET | `/dashboard/summary` | — | `{ totalLeads, activeLeads, wonLeads, pendingFollowUps, overdueFollowUps }` |

Lead fields: `name`, `company`, `email`, `phone`, `source`, `serviceInterest`, `budget`, `stage`.
Stages: New, Contacted, Qualified, Proposal Sent, Won, Lost. Activity types: Call, Email, Meeting, Task.

## Known limitations

- No pagination or sorting on the leads table (optional in the assignment).
- No automated unit tests; verification so far is a scripted browser walkthrough.
- Token stored in `localStorage` (see note above).

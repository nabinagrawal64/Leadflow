# LeadFlow CRM

A small CRM for agencies to capture leads, move them through a sales pipeline and schedule follow-ups. Built for the VyorAI SDE intern assignment (MERN).

```
leadflow/
  frontend/   React + Vite + Tailwind single-page app     (see frontend/README.md)
  backend/    Express + Mongoose REST API on MongoDB Atlas (see backend/README.md)
```

## Status

| Part | State |
| --- | --- |
| Frontend: 6 screens, light and dark theme | Done (Dashboard, Leads, New Lead, Lead Detail, Follow-ups, Analytics) |
| Backend: server, Atlas connection, models, auth, leads, follow-ups, dashboard, analytics | Done |
| Advanced Features: Pagination, Sorting, CSV export | Done |
| Advanced Features: Drag-and-drop Kanban pipeline | Done |
| Advanced Features: Analytics charts & timeline | Done (Pipeline funnel, monthly trend, completion donut, chronological timeline) |
| Advanced Features: Reopening completed activities | Done |
| Frontend and backend together | Browser walkthrough passes against the real backend and a real database |
| MongoDB Atlas itself | Tested on FerretDB/MongoDB-compatible engine; production-ready for Atlas connection string |
| Demo & Deployment | Local end-to-end verified; deployment instructions & blockers documented below |

## Run it locally

You need Node 20+ and a MongoDB Atlas cluster (free tier is fine).

```bash
# 1. Backend  (http://localhost:5000)
cd backend
cp .env.example .env        # paste your Atlas connection string and a JWT_SECRET (see backend/README.md)
npm install
npm run dev

# 2. Frontend (http://localhost:5173), in a second terminal
cd frontend
cp .env.example .env
npm install
npm run dev
```

Check `http://localhost:5000/api/v1/health` says `"database": "connected"`, then register an account in the app.

Never commit a real `.env`. Both folders ignore it and ship a `.env.example` with placeholders.

## Requirements coverage

Section 4 (data model) and section 7 (screens) of the assignment, and where each is met.

### Section 4: minimum data model

| Requirement | Where | Verified by |
| --- | --- | --- |
| User: name, unique trimmed lowercase email, passwordHash, role defaults to admin | `backend/src/models/User.js` | model tests; database unique index checked |
| Never return passwordHash | `select:false` and `toJSON` in the User model | test over every auth response |
| Lead: name required; email or phone required; valid email; budget >= 0 | `Lead.js`, `validators/lead.js` | API tests for each rejection, including edits |
| Lead: source and service from documented options with an `Other` value; stage list, default New | `constants/index.js`, `Lead.js` | model and API tests |
| `createdBy` set server-side, never from the request | `controllers/lead.js` (from the verified token), immutable in the model | API test: supplying it returns 400 |
| Follow-up: existing, accessible lead; title and due date required; type and status lists | `Activity.js`, `controllers/activity.js` | API tests: nonexistent lead 404, another user's lead 404 |
| Completion time recorded on the server | `Activity.js` hook | API test; the client cannot supply it |
| One lead, many follow-ups | `leadId` reference | API test |
| Deleting a lead deletes its follow-ups | `Lead.js` hook | API test, and no orphans found in the database |

### Section 5: minimum REST API (base path `/api/v1`)

All 13 endpoints exist. `backend/test/endpoints.test.js` checks each one against the PDF's table.

| Method | Endpoint | Purpose in the PDF | Implemented in |
| --- | --- | --- | --- |
| GET | `/health` | Health check; do not expose secrets | `routes/health.js` (tested: no secrets in the response) |
| POST | `/auth/register` | Validate input, hash password and create user | `controllers/auth.js` (bcrypt) |
| POST | `/auth/login` | Validate credentials and return token plus safe profile | `controllers/auth.js` |
| GET | `/auth/me` | Return authenticated user's safe profile | `controllers/auth.js` |
| GET | `/leads` | List leads; support search and stage filter | `controllers/lead.js` |
| POST | `/leads` | Create a lead | `controllers/lead.js` |
| GET | `/leads/:id` | Get a lead after access check | `controllers/lead.js` |
| PATCH | `/leads/:id` | Update permitted lead fields only | `controllers/lead.js`, `validators/lead.js` |
| DELETE | `/leads/:id` | Delete lead and associated follow-ups | `controllers/lead.js`, `Lead.js` hook |
| GET | `/activities` | List follow-ups; basic status filter is enough | `controllers/activity.js` (also filters by lead) |
| POST | `/activities` | Create a follow-up | `controllers/activity.js` |
| PATCH | `/activities/:id` | Update permitted fields or mark completed | `controllers/activity.js` |
| GET | `/dashboard/summary` | Return basic metrics calculated from saved records | `controllers/dashboard.js` |

Response conventions: success is `{ "success": true, "message": "Created", "data": {} }` and errors are `{ "success": false, "message": "Validation failed", "errors": [] }`. Status codes used: 200, 201, 400 invalid input, 401 unauthenticated, 404 not found, 409 duplicate, 500 unexpected (generic message, no stack trace, no internals). **403 is not used:** a request for another user's record returns 404, so a stranger cannot tell whether an id exists. The PDF says "where relevant", so this is a deliberate choice.

### Section 6: business rules

| Rule | Where it is enforced | Verified by |
| --- | --- | --- |
| Lead name required; at least one of email or phone | zod validator and the `Lead` model (also re-checked when editing) | API tests, including an edit that would remove the last contact method |
| Reject invalid email when supplied; reject negative budgets | `validators/lead.js`, `Lead.js` | API tests |
| Allow-list editable fields; reject `_id`, `createdBy`, timestamps | strict zod objects (unknown fields return 400) | API tests for each field |
| Never use a user id from the request body for ownership | `createdBy` comes from the verified token; every query is filtered by it | API tests: supplying it returns 400; a second user sees nothing of the first |
| Dashboard values come from database records | `controllers/dashboard.js` (`countDocuments`) | API test with known data, before and after a delete |
| Active leads are those not in Won or Lost | `CLOSED_STAGES` in `constants/index.js` | dashboard test |
| Overdue = Pending with `dueAt` earlier than current server time; completed never overdue | `controllers/dashboard.js` | dashboard test with past, future and completed follow-ups |
| Valid date-time values, documented timezone assumption | `dueAt` must be ISO 8601 with a timezone, stored and compared in UTC | API tests reject `"tomorrow"`; documented in `backend/README.md` |

### Section 7: minimum frontend screens

| Screen | Route | Behaviour delivered |
| --- | --- | --- |
| Login / Register | `/login`, `/register` | Validated forms, loading state, server error messages, signs in on success |
| Dashboard | `/dashboard` | Five metric cards from `GET /dashboard/summary`, pipeline by stage, next follow-ups, links to Leads |
| Leads | `/leads` | Table, search by name or company, stage filter, create, edit, delete with confirmation, empty state |
| Lead form / details | `/leads/new`, `/leads/:id` | Shows and saves lead data, stage change, add follow-up, complete follow-up |
| Follow-ups | `/follow-ups` | List with lead, title, due date and status, filter, mark pending items complete |

"Every visible button must perform its advertised action" and "a static mockup does not meet the requirement": the frontend calls the real API for every action, and the browser walkthrough (29 checks) ran against the real backend and database. See `frontend/TEST_CHECKLIST.md`.

## One-time Atlas check

I could not reach Atlas while building, so please confirm it once on your side:

1. Follow the Atlas steps in `backend/README.md` and run `npm run dev`. The log should say `MongoDB connected`.
2. Register and add a lead in the app, then look in Atlas (Browse Collections) for `users`, `leads` and `activities`.
3. Optional: `TEST_MONGODB_URI=<a local or disposable MongoDB> npm test` in `backend/` runs all 84 tests.

## Advanced & Optional Features

### 1. Advanced Pagination & Column Sorting
- **Pagination**: Configurable page size and page selector on the `/leads` list.
- **Sorting**: Interactive table column headers for Name, Budget, Stage, and Date Added with toggleable ascending / descending order indicator.
- **Filtering**: Multi-faceted filtering by Search (name, company, email), Pipeline Stage, Lead Source, and Service Interest.

### 2. CSV Export
- Single-click **"Export CSV"** button on `/leads`.
- Streams an RFC-4180 compliant CSV file honoring the active filters and sort criteria (`Content-Type: text/csv`).

### 3. Drag-and-Drop Kanban Board
- Toggle between **Table List View** and **Kanban Board View** with the view switcher at the top of `/leads`.
- Leads are arranged into stage columns (`New`, `Contacted`, `Qualified`, `Proposal Sent`, `Won`, `Lost`).
- Drag-and-drop cards across columns immediately updates the lead stage on the server with toast feedback.

### 4. Advanced Analytics & Custom Charts
- Dedicated `/analytics` dashboard accessible from the navigation bar.
- **Pipeline Funnel**: Visual horizontal funnel by stage with converted percentages and total budget value.
- **12-Month Lead Volume Trend**: Interactive bar chart comparing lead acquisition month over month.
- **Source & Service Breakdown**: Categorical charts displaying lead distribution across acquisition channels and services.
- **Activity Completion Donut**: SVG donut chart displaying completed vs pending follow-up ratio and average completion turnaround time in days.

### 5. Full Activity Timeline & Reopening Follow-ups
- **Lead Detail Timeline**: Full chronological timeline on `/leads/:id` showing scheduled, overdue, and completed follow-up milestones with timestamped badges.
- **Reopen Follow-ups**: Dedicated "Reopen" button on completed follow-up items in both `/follow-ups` and `/leads/:id`, returning them to "Pending" and resetting `completedAt`.

## Cloud Deployment & Local End-to-End Demo

### Local End-to-End Demo
To run the full stack locally:
1. **Backend**:
   ```bash
   cd backend
   npm install
   npm run dev    # Starts on http://localhost:5000
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev    # Starts on http://localhost:5173
   ```
3. Open `http://localhost:5173` in your browser. Register an account and verify:
   - Creating/updating leads and switching to the Kanban view to drag leads across stages.
   - Filtering and exporting leads to CSV.
   - Scheduling follow-ups, completing them, and reopening them.
   - Checking `/analytics` for live charts calculated from real database records.

### Cloud Deployment Guide & Potential Blockers
For cloud hosting:
- **Backend**: Can be hosted on platforms like Render, Railway, or AWS Elastic Beanstalk (`npm start`). Set environment variables: `PORT=5000`, `NODE_ENV=production`, `MONGODB_URI=<Atlas connection string>`, `JWT_SECRET=<secret>`, and `FRONTEND_URL=<hosted frontend URL>`.
- **Frontend**: Can be hosted on Vercel, Netlify, or Cloudflare Pages with build command `npm run build` and output directory `dist`. Set `VITE_API_URL=<hosted backend URL>/api/v1`.
- **Known Blockers / Hosting Considerations**:
  - **Atlas Network Access (IP Whitelist)**: MongoDB Atlas clusters require IP whitelisting. If deploying on serverless/ephemeral IPs (Render/Vercel free tier), configure `0.0.0.0/0` in Atlas Network Access or deploy with dedicated static egress IPs.
  - **CORS Configuration**: The backend enforces strict CORS via `FRONTEND_URL`. Ensure `FRONTEND_URL` exactly matches the production domain (including protocol and port without trailing slash).


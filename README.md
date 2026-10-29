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
| Frontend: 5 screens, light and dark theme | Done |
| Backend: server, Atlas connection, models, auth, leads, follow-ups, dashboard | Done |
| Frontend and backend together | Browser walkthrough passes against the real backend and a real database |
| MongoDB Atlas itself | **Not yet run.** Everything was tested on FerretDB (MongoDB-compatible). Do the one-time Atlas check below |
| Demo video, deployment | Not done |

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

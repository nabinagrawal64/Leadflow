# LeadFlow CRM: Backend

Express 5 + Mongoose 9 REST API on MongoDB Atlas. JWT authentication, bcrypt password hashing, zod validation, and per-user record access checks.

## Prerequisites

- Node.js 20+ and npm
- A MongoDB Atlas cluster

## Connect MongoDB Atlas (one-time)

1. In Atlas, create a free **M0** cluster.
2. **Database Access** > add a database user with a password. Use letters and numbers, or URL-encode any special characters.
3. **Network Access** > add your current IP address. (`0.0.0.0/0` allows any IP and is fine for local testing only.)
4. **Database** > **Connect** > **Drivers** > copy the connection string.
5. Put it in `.env` as `MONGODB_URI`, replacing the placeholders and adding the database name `leadflow` before the `?`:

```
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.abcde.mongodb.net/leadflow?retryWrites=true&w=majority
```

Mongoose creates the `leadflow` database, its collections and indexes the first time the server runs.

## Setup

```bash
cd backend
cp .env.example .env     # fill in MONGODB_URI and JWT_SECRET
npm install
npm run dev              # auto-restarts on change, reads .env
```

Generate a `JWT_SECRET`: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

Check it: `curl http://localhost:5000/api/v1/health`

```json
{ "success": true, "message": "OK", "data": { "status": "up", "database": "connected", "uptimeSeconds": 3 } }
```

If the database is down it answers `503` with `"database": "disconnected"`.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | yes | Atlas connection string |
| `JWT_SECRET` | yes | Signs login tokens. At least 32 characters |
| `JWT_EXPIRES_IN` | no (`1d`) | Token lifetime |
| `PORT` | no (`5000`) | Port to listen on |
| `CLIENT_ORIGIN` | no (`http://localhost:5173`) | The one browser origin allowed by CORS |
| `BCRYPT_ROUNDS` | no (`12`) | bcrypt cost, 4 to 15 |
| `NODE_ENV` | no | `production` hides stack traces in logs |

The server checks these at startup and refuses to start with a clear message if they are wrong. It never prints the connection string or secret.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start with auto-restart, loading `.env` |
| `npm start` | Start for production (the host provides the environment) |
| `npm test` | Run the tests. The 59 database tests are skipped unless `TEST_MONGODB_URI` is set |

## API

Base path `/api/v1`. JSON in and out. Protected routes need `Authorization: Bearer <token>`.

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | no | Liveness and database state |
| POST | `/auth/register` | no | Validate, hash the password, create the user, return `{ token, user }` |
| POST | `/auth/login` | no | Validate credentials, return `{ token, user }` |
| GET | `/auth/me` | yes | The signed-in user's safe profile |
| GET | `/leads?search=&stage=` | yes | List own leads, newest first. Search matches name or company |
| POST | `/leads` | yes | Create a lead |
| GET | `/leads/:id` | yes | Get one lead |
| PATCH | `/leads/:id` | yes | Update permitted fields (`null` clears an optional field) |
| DELETE | `/leads/:id` | yes | Delete the lead **and its follow-ups** |
| GET | `/activities?status=&leadId=` | yes | List follow-ups (lead name and company included), soonest first |
| POST | `/activities` | yes | Create a follow-up for one of your leads |
| PATCH | `/activities/:id` | yes | Edit, or mark complete with `{ "status": "Completed" }` |
| GET | `/dashboard/summary` | yes | `totalLeads`, `activeLeads`, `wonLeads`, `pendingFollowUps`, `overdueFollowUps` |

Responses: `{ "success": true, "message": "...", "data": ... }` and `{ "success": false, "message": "...", "errors": [{ "field": "...", "message": "..." }] }`. Status codes: 200, 201, 400 invalid input, 401 missing/invalid/expired token or bad credentials, 404 not found (including another user's record), 409 duplicate email, 413 body too large, 500 unexpected (generic message, no stack trace).

### Rules the API enforces

- **Ownership:** `createdBy` is set from the verified token, never from the request. Every lead and follow-up query is filtered by it. Another user's record returns `404`, the same as a missing one, so ids cannot be probed. (The assignment lists 403 "where relevant"; 404 was chosen deliberately to avoid revealing that a record exists.)
- **Allow-listed fields:** unknown fields, and any attempt to send `_id`, `createdBy` or timestamps, are rejected with `400`.
- **Lead rules:** name required; at least one of email or phone (re-checked on edits against the merged record); valid email; budget `>= 0`; stage, source and service from fixed lists; stage defaults to New.
- **Follow-up rules:** the lead must exist and belong to you; title and due date required; a follow-up cannot be moved to another lead; `completedAt` is recorded by the server and cannot be supplied.
- **Dashboard:** counted from saved records. Active means not Won or Lost. Overdue means Pending with `dueAt` before the server's current time. Completed follow-ups are never overdue.
- **Time:** `dueAt` must be an ISO 8601 timestamp with a timezone (for example `2026-11-02T09:30:00.000Z`). Everything is stored and compared in UTC; the frontend shows it in the viewer's local timezone.
- **Passwords and tokens:** bcrypt hashes only. Login returns the same message for an unknown email and a wrong password. JWTs are signed HS256, the algorithm is pinned on verify, and expiry is checked. Passwords are limited to 8 to 72 characters (bcrypt ignores bytes past 72).
- **Search** is escaped, so user input is always treated as text, never as a regular expression.

## Structure

```
src/
  server.js          entry: validate env, connect DB, listen, shut down cleanly
  app.js             builds the Express app (helmet, CORS, JSON parsing, routes, errors)
  config/            env.js (validation), db.js (Atlas connection and friendly errors)
  constants/         allowed stages, sources, services, activity types (mirrors the frontend)
  models/            User.js, Lead.js, Activity.js
  validators/        zod schemas for each request body, query and id
  middleware/        auth.js (JWT), validate.js, errorHandler.js
  controllers/       auth, lead, activity, dashboard
  routes/            one router per resource, mounted in index.js
  utils/             token.js, response.js
test/                models.test.js, app.test.js, api.test.js, endpoints.test.js
```

## Data model

Follows section 4 of the assignment.

**User**: `name`, `email` (required, unique, trimmed, lowercase), `passwordHash` (required, `select: false`, removed from JSON), `role` (defaults to `admin`), timestamps.

**Lead**: `name` (required), `company`, `email`, `phone` (at least one of email or phone), `source`, `serviceInterest`, `budget` (>= 0), `stage` (New, Contacted, Qualified, Proposal Sent, Won, Lost; default New), `createdBy` (required, immutable), timestamps.

**Activity** (follow-up): `leadId` (must reference one of your leads), `title`, `type` (Call, Email, Meeting, Task), `status` (Pending, Completed), `dueAt`, `completedAt` (server-set), `createdBy`, timestamps.

Indexes: unique `User.email`; `Lead` by `createdBy + stage + createdAt`; `Activity` by `createdBy + status + dueAt` and by `leadId`.

Deleting a lead removes its follow-ups. This works through `findOneAndDelete` (what the API uses) and `document.deleteOne()`. A raw `Lead.deleteMany()` would skip it, so don't use that for leads.

## Testing

`npm test` runs 84 tests:

- **25 without a database:** model validation rules, app shell (503 health when the DB is down, JSON 404s, malformed JSON, CORS, security headers), and an unexpected exception becoming a generic 500.
- **59 with a database:**
  - `api.test.js` (39) follows the assignment's section 9 checklist: register, duplicate email, login (valid, wrong password, unknown email), missing/forged/expired/`alg:none` tokens; lead create/view/edit/search/filter/delete and every rejection rule; follow-up create/complete and invalid or nonexistent lead; dashboard counts against known data; cross-user access (read, edit, delete, create-on-another's-lead); unique email enforced by the database; cascade delete; no password hash or stack trace in any response.
  - `endpoints.test.js` (20) is a contract test of section 5: each of the 13 endpoints in the PDF's table exists, protected ones return 401 without a token, a full walkthrough of all 13 returns the documented success codes and `{ success, message, data }` shape, and the 400, 401, 404 and 409 error codes use the `{ success, message, errors }` shape. `/health` is checked for leaked secrets.

```bash
TEST_MONGODB_URI=mongodb://127.0.0.1:27017 npm test
```

The database tests create a throwaway database named `leadflow_test_<random>` and drop it afterwards. Point them at a local or disposable MongoDB, not at data you care about.

**What was verified, and where:** all 63 pass against FerretDB 1.24 (a MongoDB-compatible server that speaks MongoDB 7.0 protocol), because no local MongoDB or Atlas credentials were available while building. That exercises the real driver, indexes, queries and cascade behaviour, but it is **not MongoDB Atlas itself**. Before relying on it, run `npm run dev` with your Atlas `MONGODB_URI` and check `/health` shows `"database": "connected"`, and optionally run the database tests against a local `mongod` or a separate Atlas test cluster.

## Known limitations

- No login rate limiting or account lockout.
- No pagination on `GET /leads` or `GET /activities` (optional in the assignment).
- No refresh tokens: when the 1-day token expires the user logs in again.
- Updates use load-then-`save()` rather than atomic updates, so two simultaneous edits of the same lead are last-write-wins.

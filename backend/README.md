# LeadFlow CRM: Backend

Express 5 + Mongoose 9 REST API on MongoDB Atlas. This milestone delivers the server, the database connection and the three data models. The REST endpoints (auth, leads, activities, dashboard) come next.

## Prerequisites

- Node.js 20+ and npm
- A MongoDB Atlas cluster

## Connect MongoDB Atlas (one-time)

1. In Atlas, create a free **M0** cluster.
2. **Database Access** > add a database user with a password. Use letters and numbers, or URL-encode any special characters in the password.
3. **Network Access** > add your current IP address. (`0.0.0.0/0` allows any IP and is fine for local testing only.)
4. **Database** > **Connect** > **Drivers** > copy the connection string.
5. Put it in `.env` as `MONGODB_URI`, replacing the placeholders and adding the database name `leadflow` before the `?`:

```
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.abcde.mongodb.net/leadflow?retryWrites=true&w=majority
```

Mongoose creates the `leadflow` database and its collections the first time the server runs.

## Setup

```bash
cd backend
cp .env.example .env     # fill in MONGODB_URI (and JWT_SECRET for the next milestone)
npm install
npm run dev              # auto-restarts on change, reads .env
```

Check it: `curl http://localhost:5000/api/v1/health`

```json
{ "success": true, "message": "OK", "data": { "status": "up", "database": "connected", "uptimeSeconds": 3 } }
```

If the database is down it answers `503` with `"database": "disconnected"` instead of pretending to be healthy.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | yes | Atlas connection string |
| `PORT` | no (5000) | Port to listen on |
| `NODE_ENV` | no | `production` hides stack traces in logs |
| `CLIENT_ORIGIN` | no (`http://localhost:5173`) | The one browser origin allowed by CORS |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | next milestone | Token signing for authentication |

The server checks these at startup and refuses to start with a clear message if they are wrong. It never prints the connection string, because that contains your password.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start with auto-restart, loading `.env` |
| `npm start` | Start for production (the host provides the environment) |
| `npm test` | Run the tests (no database needed) |

## Structure

```
src/
  server.js          entry: validate env, connect DB, listen, shut down cleanly
  app.js             builds the Express app (helmet, CORS, JSON parsing, routes, errors)
  config/            env.js (validation), db.js (Atlas connection and friendly errors)
  constants/         allowed stages, sources, services, activity types (mirrors the frontend)
  models/            User.js, Lead.js, Activity.js
  middleware/        errorHandler.js (standard error shape, ApiError, 404)
  routes/            index.js, health.js
test/                models.test.js, app.test.js
```

## Data model

Follows section 4 of the assignment.

**User**: `name`, `email` (required, unique, trimmed, lowercase), `passwordHash` (required, `select: false` and removed from JSON, so it cannot leak into a response), `role` (defaults to `admin`), timestamps.

**Lead**: `name` (required), `company`, `email`, `phone` (at least one of email or phone is required), `source`, `serviceInterest`, `budget` (>= 0), `stage` (New, Contacted, Qualified, Proposal Sent, Won, Lost; default New), `createdBy` (required, **immutable**, set by the server from the logged-in user), timestamps. Deleting a lead also deletes its follow-ups.

**Activity** (follow-up): `leadId` (required), `title`, `type` (Call, Email, Meeting, Task), `status` (Pending, Completed), `dueAt` (required, UTC), `completedAt` (set by the server when completed, cleared if reopened), `createdBy`, timestamps.

Indexes: unique `User.email`; `Lead` by `createdBy + stage + createdAt`; `Activity` by `createdBy + status + dueAt` and by `leadId`.

Standard error shape for every failure: `{ "success": false, "message": "...", "errors": [] }`. Validation errors map to `400`, duplicate keys to `409`, and unexpected errors to a generic `500` with no stack trace.

## Testing status

`npm test` runs 23 tests, all passing:

- **Models (18):** required fields, email and budget rules, the email-or-phone rule, stage/source/service allow-lists, `createdBy` immutability, `passwordHash` never serialised, unique email index, `completedAt` handling.
- **App shell (5):** health returns 503 when the DB is down, JSON 404s, malformed JSON gives 400 with no stack trace, CORS only grants the configured origin, security headers.

Also checked by hand: the server exits with a clear message for a missing or placeholder `MONGODB_URI`, a bad `PORT`, an unreachable database and an unresolvable Atlas host.

**Not verified yet:** a real connection to Atlas (no credentials or database were available while building this), the unique-email index and the delete-lead-deletes-follow-ups behaviour against a live database, and the health route returning `200` when connected. Run `npm run dev` with your own `MONGODB_URI` and confirm the health check shows `"database": "connected"`.

## Notes for the next milestone

- `Lead` checks "email or phone" on `save()`/`validate()`. An update controller must load the lead, apply the allowed fields, and call `save()` (or validate the merged result), because a bare `findByIdAndUpdate` skips this rule.
- Same for `Activity.completedAt`: use `save()` so the status/`completedAt` hook runs.
- Always set `createdBy` from the authenticated user, never from the request body, and filter every query by it.

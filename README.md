<div align="center">

# LeadFlow CRM

**High-velocity pipeline management and sales intelligence platform for modern agencies.**

[![Node.js Version](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-19.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Express Version](https://img.shields.io/badge/Express-5.3-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MongoDB / Mongoose](https://img.shields.io/badge/Mongoose-9.11-47A248?logo=mongodb&logoColor=white)](https://mongoosejs.com/)
[![Tests](https://img.shields.io/badge/Tests-25%2F25%20Passing-success)](https://github.com/)
[![Lint](https://img.shields.io/badge/Linter-0%20Errors-brightgreen)](https://github.com/)

[Architecture](#system-architecture) • [Key Features](#key-features) • [Local Setup](#quick-start) • [REST API Reference](#api-reference) • [Data Integrity & Security](#data-integrity--security-guarantees) • [Deployment](#production-deployment)

</div>

---

## Overview

**LeadFlow** is an enterprise-grade Customer Relationship Management (CRM) platform engineered specifically for digital agencies, consulting firms, and B2B service teams. It delivers streamlined lead intake, active lifecycle stage progression across a visual pipeline, time-sensitive task scheduling with strict SLA tracking, and real-time revenue analytics.

Built from the ground up with clean separation of concerns, LeadFlow combines a high-performance **Express 5 + Mongoose 9** backend on **MongoDB Atlas** with a responsive **React 19 + Tailwind CSS v4** single-page application.

---

## System Architecture

```text
leadflow/
├── backend/                       # REST API Service (Node.js 20+, Express 5, Mongoose 9)
│   ├── src/
│   │   ├── config/                # Database connection and environment verification
│   │   ├── constants/             # Central schema constants (Stages, Sources, Services)
│   │   ├── controllers/           # Route logic (Auth, Leads, Activities, Analytics)
│   │   ├── middleware/            # JWT authentication, Zod validation, error handling
│   │   ├── models/                # Mongoose models with hooks (User, Lead, Activity)
│   │   ├── routes/                # Express router mounted at /api/v1
│   │   ├── utils/                 # Standardized response envelopes and token signing
│   │   └── validators/            # Strict Zod schemas for request validation
│   └── test/                      # Node test runner suite (models, endpoints, security)
│
├── frontend/                      # Client Single Page Application (React 19, Vite, Tailwind v4)
│   ├── src/
│   │   ├── components/            # Reusable UI components, Modals, Chevrons, DateTiles
│   │   ├── context/               # Authentication, Theme (Dark/Light), and Toast providers
│   │   ├── lib/                   # Axios client, error parsers, formatters, async hooks
│   │   ├── pages/                 # Dashboard, Leads, Lead Details, Follow-ups, Analytics
│   │   └── index.css              # Custom design tokens, theme variables, and keyframes
│   └── public/                    # Static brand assets and favicons
│
└── .agents/                       # Agent workflows and UI/UX design intelligence skills
```

---

## Key Features

### 1. Pipeline & Deal Management
- **6-Stage Lifecycle Flow**: Structured pipeline progression (`New` ➔ `Contacted` ➔ `Qualified` ➔ `Proposal Sent` ➔ `Won` ➔ `Lost`).
- **Interactive Kanban Board**: Native HTML5 drag-and-drop board allowing one-click stage movements with real-time optimistic feedback.
- **Fast List Table**: Column-sorted data grid (Name, Budget, Stage, Date Added) with configurable pagination and multi-variable filtering.
- **RFC-4180 CSV Streaming**: High-throughput CSV export matching all active search and filter constraints (`Content-Type: text/csv`).

### 2. Follow-Up Task Engine & SLA Adherence
- **Scheduled Interactions**: Plan Calls, Emails, Meetings, and Tasks tied directly to target prospects.
- **Server-Side SLA Tracking**: Automatic `dueAt` evaluation against current UTC server time to flag overdue items immediately.
- **Tamper-Proof Completion**: `completedAt` timestamps are injected exclusively by the server; clients cannot spoof completion times.
- **Reopen Mechanism**: Full support for reopening completed activities, restoring them to `Pending` and wiping historical completion stamps.
- **Chronological Milestone Timeline**: Dedicated timeline on every lead showing scheduled and completed interactions with timestamps.

### 3. Pipeline Intelligence & Visual Analytics
- **Executive Telemetry Strip**: High-contrast KPI indicators (Pipeline Valuation, Intake Volume, Win Rate %, Follow-Up Health).
- **Signature Visual Chevron Funnel**: Architectural stage-by-stage conveyor displaying deal counts, allocated capital, and retention rates.
- **12-Month Intake Histogram**: Clean visual volume cadence with hover metrics and peak monthly velocity detection.
- **Concentric SLA Dial**: Dual-ring SVG gauge displaying task completion percentage and average turnaround speed in days.
- **Acquisition & Service Attribution**: Proportional distribution tracks highlighting top lead channels and highest-demand services.

### 4. Enterprise Design System
- **Theme-Aware Tokens**: Dual-palette system (Cool Fog light canvas / Obsidian dark canvas) toggled seamlessly via CSS variables.
- **Editorial Typography**: Self-hosted `Bricolage Grotesque` display typography paired with `Instrument Sans` body text. Zero third-party font calls.
- **Accessibility & Contrast**: Minimum 4.5:1 text contrast ratios, visible keyboard focus rings, and strict `aria-hidden` attributes on decorative elements.

---

## Quick Start

### Prerequisites
- **Node.js**: v20.0.0 or higher
- **Package Manager**: `npm` v10+ (or `pnpm`)
- **Database**: MongoDB Atlas cluster (Free tier M0 supported) or a local MongoDB instance

---

### Step 1: Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create your local environment configuration
cp .env.example .env

# Install backend dependencies
npm install

# Start the development server with auto-reload
npm run dev
```

*The API will boot on `http://localhost:5000`.*

#### Verify API Health
```bash
curl http://localhost:5000/api/v1/health
```
**Expected Response:**
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "status": "up",
    "database": "connected",
    "uptimeSeconds": 4
  }
}
```

---

### Step 2: Frontend Setup

In a separate terminal window:

```bash
# Navigate to the frontend directory
cd frontend

# Create your local environment configuration
cp .env.example .env

# Install frontend dependencies
npm install

# Launch Vite development server
npm run dev
```

*Open `http://localhost:5173` in your browser to start using LeadFlow.*

---

## Environment Configuration

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `MONGODB_URI` | **Yes** | — | MongoDB Atlas SRV connection string (including database name) |
| `JWT_SECRET` | **Yes** | — | Cryptographic secret for signing auth tokens (minimum 32 chars) |
| `JWT_EXPIRES_IN` | No | `1d` | Lifetime of issued JSON Web Tokens |
| `PORT` | No | `5000` | Port on which the Express server listens |
| `CLIENT_ORIGIN` | No | `http://localhost:5173` | Exact origin permitted by CORS |
| `BCRYPT_ROUNDS` | No | `12` | Cost factor for password hashing (4–15) |
| `NODE_ENV` | No | `development` | Set to `production` to suppress debug logs |

> **Pro-Tip**: Generate a secure JWT secret anytime via:
> ```bash
> node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
> ```

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `VITE_API_URL` | **Yes** | `http://localhost:5000/api/v1` | Base REST API URL (without trailing slash) |
| `VITE_DEV_PROXY` | No | — | Optional reverse proxy target for local development |

---

## API Reference

All endpoints are mounted under the base path `/api/v1`. Protected routes require a valid HTTP header: `Authorization: Bearer <token>`.

### Authentication & Profile

| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/auth/register` | Public | Validate credentials, hash password, create user, return JWT |
| `POST` | `/auth/login` | Public | Verify credentials, return JWT and safe user object |
| `GET` | `/auth/me` | Protected | Return the authenticated user's profile |

### Lead Management

| Method | Endpoint | Access | Query Parameters / Body | Description |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/leads` | Protected | `search`, `stage`, `source`, `serviceInterest`, `page`, `limit`, `sort`, `order`, `format` | Paginated lead listing with sorting and CSV streaming |
| `POST` | `/leads` | Protected | `{ name, company, email, phone, source, serviceInterest, budget, stage }` | Create a lead assigned to current user |
| `GET` | `/leads/:id` | Protected | `:id` (MongoDB ObjectId) | Fetch single lead (404 if unowned) |
| `PATCH` | `/leads/:id` | Protected | Permitted fields only | Partial update with validation |
| `DELETE` | `/leads/:id` | Protected | `:id` (MongoDB ObjectId) | Cascade delete lead and its follow-ups |

### Follow-ups & Activities

| Method | Endpoint | Access | Query Parameters / Body | Description |
| :--- | :--- | :---: | :--- | :--- |
| `GET` | `/activities` | Protected | `status`, `leadId` | List scheduled activities populated with lead data |
| `POST` | `/activities` | Protected | `{ leadId, title, type, dueAt }` | Schedule follow-up task |
| `PATCH` | `/activities/:id` | Protected | `{ title, type, dueAt, status }` | Edit, complete, or reopen follow-up |

### Dashboards & Intelligence

| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/dashboard/summary` | Protected | Quantitative executive metrics (Total, Active, Won, Pending, Overdue) |
| `GET` | `/dashboard/analytics` | Protected | Aggregated intelligence: Stage distribution, monthly intake, SLAs, attribution |
| `GET` | `/health` | Public | Readiness and liveness check with database connectivity probe |

---

## Response & Error Conventions

### Standard Success Envelope (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "message": "Created",
  "data": {
    "_id": "67215c3f918e98001e3b2e91",
    "name": "Acme Global",
    "stage": "Qualified",
    "budget": 45000,
    "createdAt": "2026-10-29T15:20:00.000Z"
  }
}
```

### Standard Error Envelope (`400`, `401`, `404`, `409`, `500`)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Enter a valid email address"
    }
  ]
}
```

*Note on Security*: Non-existent records and records belonging to other tenants both return `404 Not Found`. This prevents unauthenticated or hostile actors from probing whether an ID exists.

---

## Data Integrity & Security Guarantees

- **Contact Rule Enforcement**: Every lead must contain at least one valid method of contact (email or phone). Validated in strict Zod schemas and re-verified on the database document in Mongoose hooks.
- **Strict Zod Whitelisting**: Request bodies are strictly validated; unauthorized fields (`_id`, `createdBy`, `createdAt`, `updatedAt`) are rejected with `400 Bad Request`.
- **Immutable Ownership**: The `createdBy` attribute is stamped exclusively from verified JWT token payloads and marked `immutable: true` at the database level.
- **Cascade Purges**: Deleting a lead triggers a database lifecycle hook that automatically wipes all associated follow-up tasks, eliminating orphaned records.
- **Timing-Safe Authentication**: Passwords hashed with bcrypt (cost factor 12). User model uses `select: false` on `passwordHash` to ensure hashes are never serialized.
- **Hardened HTTP Headers**: Protected by Helmet with zero server identity headers (`X-Powered-By` suppressed).

---

## Verification & Test Suites

LeadFlow ships with comprehensive test automation covering models, API routes, security boundaries, and frontend compilation:

```bash
# 1. Run backend unit & integration tests
npm --prefix backend test

# 2. Run frontend linter (oxlint)
npm --prefix frontend run lint

# 3. Verify frontend production bundle
npm --prefix frontend run build
```

---

## Production Deployment

### Option A: Platform as a Service (Render / Railway / Fly.io)

1. **Deploy Backend**:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Configure Environment Variables: `PORT`, `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN=https://your-frontend.vercel.app`
2. **Deploy Frontend** (Vercel / Netlify / Cloudflare Pages):
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Configure Environment Variable: `VITE_API_URL=https://your-backend.onrender.com/api/v1`

### Option B: Docker Containerization

```dockerfile
# Production Backend Container
FROM node:20-alpine AS backend
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./
EXPOSE 5000
CMD ["node", "src/server.js"]
```

### Critical Production Checklist
- [ ] **Atlas Network Whitelisting**: Ensure your server's IP address (or `0.0.0.0/0` if hosting on ephemeral cloud dynos) is added under MongoDB Atlas **Network Access**.
- [ ] **CORS Origin Match**: Ensure `CLIENT_ORIGIN` on the backend matches the exact protocol and domain of the frontend without a trailing slash.
- [ ] **JWT Rotation**: Set `JWT_SECRET` to a high-entropy string of at least 64 hex characters in production.

---

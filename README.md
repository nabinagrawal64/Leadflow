# LeadFlow CRM

A small CRM for agencies to capture leads, move them through a sales pipeline and schedule follow-ups. Built for the VyorAI SDE intern assignment (MERN).

```
leadflow/
  frontend/   React + Vite + Tailwind single-page app      (complete, see frontend/README.md)
  backend/    Express + Mongoose API on MongoDB Atlas      (server, DB connection and models done; routes next)
```

## Status

| Part | State |
| --- | --- |
| Frontend: 5 screens, light/dark theme | Done. Tested against a mock of the API, not yet the real backend |
| Backend: Express server, Atlas connection, env validation | Done |
| Backend: `User`, `Lead`, `Activity` models | Done, validation covered by tests |
| Backend: auth, leads, activities, dashboard routes | **Next** |
| Frontend and backend tested together | Not yet |

## Run it locally

You need Node 20+ and a MongoDB Atlas cluster (free tier is fine).

```bash
# 1. Backend  (http://localhost:5000)
cd backend
cp .env.example .env        # then paste your Atlas connection string (see backend/README.md)
npm install
npm run dev

# 2. Frontend (http://localhost:5173), in a second terminal
cd frontend
cp .env.example .env
npm install
npm run dev
```

Never commit a real `.env`. Both folders ignore it and ship a `.env.example` with placeholders.

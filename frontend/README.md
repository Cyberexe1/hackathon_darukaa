# Darukaa.Earth — Frontend

React + TypeScript + Vite dashboard for the Darukaa.Earth environmental
intelligence platform. See the [repository root README](../README.md)
for full architecture, database schema, and deployment documentation.

## Setup

```powershell
npm ci
Copy-Item .env.example .env.local
# Edit .env.local: VITE_API_URL, VITE_MAPBOX_TOKEN
npm run dev
```

## Scripts

| Command                | Description                                          |
| ---------------------- | ---------------------------------------------------- |
| `npm run dev`          | Start the Vite dev server                            |
| `npm run build`        | Type-check (`tsc -b`) and produce a production build |
| `npm run lint`         | ESLint                                               |
| `npm run format`       | Prettier — write                                     |
| `npm run format:check` | Prettier — check only (used in CI)                   |
| `npm run preview`      | Preview the production build locally                 |

## Environment variables

| Variable            | Description                                                      |
| ------------------- | ---------------------------------------------------------------- |
| `VITE_API_URL`      | Base URL of the FastAPI backend (`http://localhost:8000` in dev) |
| `VITE_MAPBOX_TOKEN` | Mapbox GL JS public access token                                 |

Both are safe to expose to the browser — no secret/server-only values
ever live in this project's environment.

## Deployment

Deployed to Vercel — see `vercel.json` and the root README's Deployment
section.

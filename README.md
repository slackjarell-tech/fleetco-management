# Fleet Pulse Command

Standalone fleet management portal for **Fleetco Management** — deployed at [fleetcomanagement.org](https://fleetcomanagement.org).

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** and **[DEPLOYMENT-IONOS.md](./DEPLOYMENT-IONOS.md)** for connecting **fleetcomanagement.org** (IONOS).

## Prerequisites

- Node.js 18+

## Setup

```bash
npm install
npm run dev
```

This starts:

- **Frontend** at http://localhost:5173
- **API server** at http://localhost:3001

## Default login

| Email | Password |
|-------|----------|
| `admin@fleetco.com` | `admin123` |

The admin user has the `executive` role with full portal access.

## Project structure

```
src/          React frontend (Vite + Tailwind + shadcn/ui)
server/       Express API, SQLite database, server-side functions
server/data/  SQLite database (created on first run)
server/uploads/  Uploaded files
```

## Environment variables (optional)

Create `.env` in the project root:

```
JWT_SECRET=your-production-secret
PORT=3001
APP_ORIGIN=http://localhost:5173
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run frontend + API together |
| `npm run dev:client` | Frontend only |
| `npm run dev:server` | API only |
| `npm run build` | Production frontend build |
| `npm run preview` | Preview production build |

## Notes

- OTP codes are printed to the server console in development.
- Google OAuth and Stripe checkout redirect to email registration in standalone mode.
- LLM features return stub responses unless you configure an external AI provider.

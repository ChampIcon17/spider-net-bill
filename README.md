# SPIDER — Wi‑Fi billing (frontend + backend)

React (Vite) dashboard that talks to a **NestJS** API (`backend/`). Plans, devices, M-Pesa payments, and sessions are loaded from the API via React Query hooks—not client-side mock billing services.

**GitHub**: https://github.com/WILSON-MWANGI-WAMBUI/spider-net-bill

## Local development

### Prerequisites

- Node.js 22 LTS (or use the repo’s portable Node on Windows—see [docs/WINDOWS_NODE_NPM_FIX.md](docs/WINDOWS_NODE_NPM_FIX.md))
- PostgreSQL and Redis for the backend (see `backend/.env.example`)

### Environment

**Frontend** — copy `.env.local.example` to `.env.local` (do not commit `.env.local`):

```env
VITE_API_URL=http://localhost:3000
```

**Backend** — copy `backend/.env.example` to `backend/.env` (do not commit `backend/.env`). Set `DATABASE_URL`, `REDIS_URL`, JWT secrets, M-Pesa Daraja keys, and `FRONTEND_URL=http://localhost:5173`.

### Install and run

```sh
git clone https://github.com/WILSON-MWANGI-WAMBUI/spider-net-bill.git
cd spider-net-bill
npm ci
npm run backend:install
```

Terminal 1 — API:

```sh
npm run backend:dev
```

Terminal 2 — UI:

```sh
npm run dev
```

On Windows, if `npm`/`node` PATH is broken, dot-source `scripts/session-path.ps1` or use `npm run dev:win` and `npm run backend:dev:win` (see Windows doc).

### Quality checks

```sh
npm run lint
npm run typecheck
npm run backend:lint
```

## Stack

- **Frontend**: Vite, TypeScript, React, shadcn-ui, Tailwind CSS, TanStack Query, Zustand
- **Backend**: NestJS, Prisma, PostgreSQL, Redis, M-Pesa Daraja

## Optional: Lovable

[Lovable project](https://lovable.dev/projects/89009f76-9e6e-4318-9d3a-693f06c8d70a) — deploy/publish from Lovable if you use that workflow.

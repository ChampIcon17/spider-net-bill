# SPIDER — Wi‑Fi billing

React (Vite) frontend and NestJS API for plans, devices, M-Pesa payments, and sessions.

https://github.com/WILSON-MWANGI-WAMBUI/spider-net-bill

## Prerequisites

- Node.js 22 LTS
- PostgreSQL and Redis
- [Safaricom Daraja](https://developer.safaricom.co.ke) credentials (sandbox or production)

Windows PATH issues: [docs/WINDOWS_NODE_NPM_FIX.md](docs/WINDOWS_NODE_NPM_FIX.md)

## Setup

```sh
git clone https://github.com/WILSON-MWANGI-WAMBUI/spider-net-bill.git
cd spider-net-bill
npm ci
npm run backend:install
```

**Frontend** — `.env.local.example` → `.env.local`:

```env
VITE_API_URL=http://localhost:3000
```

**Backend** — `backend/.env.example` → `backend/.env`, `backend/.env.mpesa.example` → `backend/.env.mpesa`. Do not commit `.env` or `.env.mpesa`.

| File | Variables |
|------|-----------|
| `backend/.env` | `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL` |
| `backend/.env.mpesa` | `MPESA_*`, `DARAJA_*` |

Set `FRONTEND_URL` to your Vite origin (default `http://localhost:8080`). M-Pesa callback: `https://<host>/api/v1/payments/webhook`.

## Run

```sh
npm run backend:dev   # API :3000
npm run dev           # UI :8080
```

Windows: `npm run backend:dev:win` / `npm run dev:win` if `npm` is not on PATH.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run lint` | Frontend ESLint |
| `npm run typecheck` | Frontend TypeScript |
| `npm run build` | Frontend production build |
| `npm run backend:lint` | Backend ESLint |

## Stack

Vite · React · TypeScript · TanStack Query · Zustand · shadcn-ui · Tailwind · NestJS · Prisma · PostgreSQL · Redis · M-Pesa Daraja

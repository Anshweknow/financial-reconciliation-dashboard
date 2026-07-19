# Financial Reconciliation Dashboard

A full-stack SaaS-style dashboard for importing order and payment ledgers, running deterministic reconciliation, and reviewing exceptions with business-oriented AI-style explanations.

## Features
- JWT authentication with registration, login, protected routes, and logout.
- CSV imports for `orders.csv` and `payments.csv` with backend validation and upload progress in the UI.
- Deterministic reconciliation engine for exact matches, missing orders/payments, amount mismatches, partial refunds, pending payments, and failed payments.
- Executive dashboard with KPI cards, status pie chart, discrepancy bar chart, and order/payment trends.
- Professional reconciliation table with search, sorting, pagination, status badges, CSV export, and explanation drawer.
- Settings area with profile details, password-change placeholder, and dark-mode toggle.
- Deployment-ready configuration for Vercel, Render, and Neon PostgreSQL.

## Architecture
The backend is an Express + TypeScript API backed by Prisma and PostgreSQL. The frontend is a Vite React TypeScript application using React Router, TanStack Query, TanStack Table, Axios, Recharts, React Hook Form, Zod, Lucide icons, Sonner toasts, and Tailwind/shadcn-inspired components.

## Folder Structure
```
backend/   Express API, Prisma schema, services, controllers, middleware
frontend/  Vite React dashboard, routes, reusable UI components, API client
orders.csv Sample orders ledger
payments.csv Sample payments ledger
```

## Tech Stack
- Backend: Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT, bcrypt, Zod, Multer, csv-parser.
- Frontend: React, Vite, TypeScript, Tailwind CSS, shadcn-style primitives, React Router, TanStack Query/Table, Axios, Recharts, React Hook Form, Zod, Lucide React, Sonner.
- Deployment: Vercel frontend, Render backend, Neon PostgreSQL database.

## Database Design
Prisma models include `User`, `Order`, `Payment`, and `ReconciliationResult`. Orders and payments are scoped to users, normalized by order reference, and indexed for fast reconciliation lookups. Results store expected amount, actual amount, difference, status, currency, and JSON details for audit context.

## API Endpoints
- `GET /api/health` health check.
- `POST /api/auth/register` create a user and return a JWT.
- `POST /api/auth/login` authenticate and return a JWT.
- `POST /api/uploads/orders` upload `orders.csv` for the authenticated user.
- `POST /api/uploads/payments` upload `payments.csv` for the authenticated user.
- `POST /api/reconciliation/run` run deterministic reconciliation.
- `GET /api/reconciliation/results` list reconciliation results, with optional `status` and `search` query parameters.
- `POST /api/reconciliation/results/:id/explain` explain an already-computed result.
- `GET /api/dashboard/stats` return dashboard KPIs and chart data.

## Authentication
Passwords are hashed with bcrypt. Successful register/login returns a signed JWT. The frontend stores the token in local storage, attaches it as a bearer token through an Axios interceptor, and protects dashboard routes.

## Reconciliation Logic
The reconciliation service groups payments by normalized order reference. It compares order net amounts to settled charge totals net of refunds, applies a small tolerance, and emits explicit statuses for missing records, failed/pending payments, partial refunds, and amount mismatches. AI never performs reconciliation; it only explains statuses already produced by the engine.

## AI Integration
The explanation endpoint accepts a reconciliation result ID and returns: likely cause, business impact, suggested action, and confidence. The response is based on the stored reconciliation result and does not mutate or recompute records.

## Setup Instructions
1. Install dependencies: `npm install`.
2. Configure `backend/.env` from `backend/.env.example`.
3. Configure `frontend/.env` from `frontend/.env.example`.
4. Generate Prisma client: `npm run prisma:generate -w backend`.
5. Run database migrations: `npm run prisma:migrate -w backend`.
6. Start backend: `npm run dev -w backend`.
7. Start frontend: `npm run dev -w frontend`.
8. Register, upload both CSV files, run reconciliation, and review the dashboard.

## Environment Variables
Backend: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `CORS_ORIGIN`, `BCRYPT_ROUNDS`.
Frontend: `VITE_API_URL`.

## Deployment Guide
- Neon: create a PostgreSQL database and copy the pooled connection string into `DATABASE_URL`.
- Render: create a web service from `render.yaml`, set `DATABASE_URL`, `JWT_SECRET`, and `CORS_ORIGIN` to the deployed Vercel URL.
- Vercel: deploy the repo with `vercel.json`, set `VITE_API_URL` to the Render API URL ending in `/api`.

## Future Improvements
- Add password reset and profile-edit backend endpoints.
- Add server-side pagination for very large reconciliation result sets.
- Add audit comments and exception assignment workflow.
- Integrate a hosted LLM provider for richer explanations while preserving deterministic reconciliation ownership in the backend service.

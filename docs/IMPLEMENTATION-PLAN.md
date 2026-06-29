# Implementation Plan: Finboard Investor Onboarding Platform

## Version: 3.1
## Date: 2026-06-26
## Supersedes: v2.0 (modular monolith plan — now obsolete)

---

## Architecture

Finboard runs as a **microservices monorepo** using pnpm workspaces + Turborepo.

```
apps/customer-web             → Next.js frontend (port 3000)
services/api-gateway          → Entry point, proxies to all services (port 4000)
services/auth-service         → JWT auth, OTP, user management (port 4001)
services/profile-service      → Investor profiles, KYC status sync (port 4002)
services/kyc-service          → KYC submissions, identity matching, admin review (port 4003)
services/ocr-service          → Document extraction: Tesseract + LLM fallback (port 4004)
services/banking-service      → PostgreSQL/Prisma banking ledger (port 4005)
services/investment-service   → Portfolio holdings, buy/SIP, AMC workflow (port 4006)
services/notification-service → In-app notifications (port 4007)
services/audit-service        → Immutable audit log (port 4008)

packages/shared               → Express factory, mongo, validate, jwt utils, error handler
packages/contracts            → Inter-service HTTP clients, auth middleware, events
packages/kafka                → kafkajs producer/consumer (graceful no-op when disabled)
packages/storage              → S3/MinIO client, presigned URLs
packages/config               → Env loading, getServiceEnv()
packages/service-kit          → bootstrapService(), graceful shutdown
packages/logger            → Structured logger
packages/errors            → Shared error types
packages/validation        → Zod helpers
```

### Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Implemented and working |
| 🟡 | Core exists; gaps remain |
| ⬜ | Planned, not yet built |

---

## Phase Overview

| Phase | Name | Status |
|-------|------|--------|
| 0 | Foundation & Tooling | ✅ Done |
| 1 | Auth Service | ✅ Done (28/28 tests passing) |
| 2 | Profile Service | ✅ Done (30/30 tests passing) |
| 3 | KYC Service + Document (OCR) Service | ✅ Done |
| 4 | Banking Service | ✅ Done |
| 5 | Investment Service | ✅ Done |
| 6 | Notification Service | ✅ Done |
| 7 | Audit Service | ✅ Done |
| 8 | Frontend (Next.js) | ✅ Done |
| 9 | Infrastructure (Docker, Kafka, S3, Tests) | ✅ Done (152 service tests + E2E smoke) |

> **Microservices migration is complete.** All services are independently deployable. There is no monolith to migrate from.
>
> **Implementation plan complete (Phases 0–9).** All planned tasks are implemented and tested.

---

## Phase 0 — Foundation & Tooling

### Tasks

| # | Task | Status |
|---|------|--------|
| 0.1 | pnpm workspace with `apps/`, `services/`, `packages/` | ✅ |
| 0.2 | `.gitignore` (node_modules, .env, .next, uploads, dist) | ✅ |
| 0.3 | Root `.env.example` with all service variables | ✅ |
| 0.4 | Turborepo `turbo.json` with build/dev pipeline | ✅ |
| 0.5 | `packages/shared` — Express factory, mongo, validate, jwt, error handler | ✅ |
| 0.6 | `packages/contracts` — inter-service HTTP clients + auth middleware | ✅ |
| 0.7 | `packages/service-kit` — `bootstrapService()` with graceful shutdown | ✅ |
| 0.8 | `packages/config` — `loadEnv()`, `getServiceEnv()` | ✅ |
| 0.9 | `docker-compose.yml` — MongoDB, PostgreSQL, MinIO, Zookeeper, Kafka + Kafka UI | ✅ |
| 0.10 | `infrastructure/scripts/init-kafka-topics.sh` — Kafka topic bootstrap on compose start | ✅ |
| 0.11 | Root ESLint (`eslint.config.js`) + Prettier (`.prettierrc`, `.prettierignore`) | ✅ |
| 0.12 | `pnpm infra:up / infra:down / infra:logs` scripts; `mf-network` Docker bridge | ✅ |

---

## Phase 1 — Authentication Service

**Location:** `services/auth-service/` (port 4001)

| # | Task | Status |
|---|------|--------|
| 1.1 | User model with bcrypt password, roles (`user`, `admin`, `rta_admin`, `amc_admin`) | ✅ |
| 1.2 | POST `/api/auth/signup` with phone OTP verification | ✅ |
| 1.3 | POST `/api/auth/signin` — email + password → JWT | ✅ |
| 1.4 | POST `/api/auth/admin/signin` with role validation | ✅ |
| 1.5 | POST `/api/auth/send-otp` and `/api/auth/verify-otp` (Twilio + dev fallback) | ✅ |
| 1.6 | POST `/api/auth/phone-login` | ✅ |
| 1.7 | GET `/api/auth/me` | ✅ |
| 1.8 | PATCH `/api/auth/change-password` | ✅ |
| 1.9 | Internal routes for inter-service user lookups | ✅ |
| 1.10 | Admin seed script | ✅ |
| 1.11 | Phone OTP via Twilio + dev fallback | ✅ |
| 1.12 | Password reset via email OTP — `POST /forgot-password` + `POST /reset-password` (nodemailer/dev fallback) | ✅ |
| 1.13 | Jest tests — 28 tests, 100% pass: signup, signin, admin, OTP, change-password, forgot/reset-password | ✅ |

---

## Phase 2 — Profile Service

**Location:** `services/profile-service/` (port 4002)

| # | Task | Status |
|---|------|--------|
| 2.1 | UserProfile Mongoose model | ✅ |
| 2.2 | GET `/api/profile/me` | ✅ |
| 2.3 | PUT `/api/profile/me` with Zod validation | ✅ |
| 2.4 | Internal route: create profile on auth signup | ✅ |
| 2.5 | Internal route: `updateProfileKycStatus` on KYC approve/reject | ✅ |
| 2.6 | Internal route: `getProfileByUserId` for investment eligibility | ✅ |
| 2.7 | Jest tests for profile CRUD — 30 tests, 100% pass: GET/PUT /me, all internal routes, upsert, validation, auth | ✅ |

---

## Phase 3 — KYC + OCR Services

**Location:** `services/kyc-service/` (port 4003), `services/ocr-service/` (port 4004)

### KYC Service

| # | Task | Status |
|---|------|--------|
| 3.1 | KycApplication Mongoose model | ✅ |
| 3.2 | POST `/api/kyc/submit` — multipart PAN + Aadhaar upload | ✅ |
| 3.3 | GET `/api/kyc/me` | ✅ |
| 3.4 | PAN format validation (regex) via Zod | ✅ |
| 3.5 | Dummy identity matching via identity-service | ✅ |
| 3.6 | Admin: list, detail, approve, reject endpoints | ✅ |
| 3.7 | Notify + audit on approve/reject via contracts | ✅ |
| 3.8 | PAN taxpayer-type check (4th char ∈ P/C/H/F/A/T/B/L/J/G) + Aadhaar Verhoeff check digit; seed data corrected | ✅ |
| 3.9 | Server-side pagination on admin list — `?page=&limit=&status=` with `pagination` envelope | ✅ |
| 3.10 | Mandatory rejection remarks — `rejectKycSchema` enforces min 10-char non-empty string | ✅ |

### OCR Service

| # | Task | Status |
|---|------|--------|
| 3.11 | Tesseract.js OCR pipeline | ✅ |
| 3.12 | OpenRouter LLM structured extraction fallback | ✅ |
| 3.13 | Internal route: `processDocumentOcr` | ✅ |

### Documents (interim — local disk)

| # | Task | Status |
|---|------|--------|
| 3.14 | Multer disk upload (5MB limit, image types) | ✅ |
| 3.15 | Static serve via `/uploads` (demo only) | ✅ |
| 3.16 | Migrate to S3/MinIO with presigned URLs | ✅ |

---

## Phase 4 — Banking Service

**Location:** `services/banking-service/` (port 4005)

| # | Task | Status |
|---|------|--------|
| 4.1 | Prisma schema: BankAccount, BankTransaction, LedgerEntry, Beneficiary | ✅ |
| 4.2 | PostgreSQL via `BANK_DATABASE_URL` (Supabase-compatible) | ✅ |
| 4.3 | Prisma migrations + seed with demo accounts | ✅ |
| 4.4 | POST `/api/banking/verify-bank` — Rs. 2 debit simulation | ✅ |
| 4.5 | Background refund job | ✅ |
| 4.6 | GET account, balance, transactions | ✅ |
| 4.7 | POST transfer, beneficiary management | ✅ |
| 4.8 | Banking notifications (PostgreSQL `BankNotification`) | ✅ |
| 4.9 | Admin: freeze account, reset balance, list users/transactions | ✅ |
| 4.10 | `requireBankingConfigured` middleware (graceful when PG unavailable) | ✅ |
| 4.11 | Internal route: `debitForInvestment`, `getLinkedAccount` | ✅ |
| 4.12 | Kafka `bank.verified` event | ✅ |
| 4.13 | Jest + Prisma test database tests | ✅ |

---

## Phase 5 — Investment Service

**Location:** `services/investment-service/` (port 4006)

| # | Task | Status |
|---|------|--------|
| 5.1 | GET `/api/investments/portfolio` | ✅ |
| 5.2 | POST `/api/investments/buy` — stock and mutual fund | ✅ |
| 5.3 | POST `/api/investments/sip` | ✅ |
| 5.4 | Eligibility gate: KYC approved (profile-service) + linked bank (banking-service) | ✅ |
| 5.5 | Debit via `debitForInvestment` contract | ✅ |
| 5.6 | Holdings stored via portfolio-service contract | ✅ |
| 5.7 | GET `/api/investments/admin/overview` — AUM, SIP book | ✅ |
| 5.8 | PATCH order status (AMC admin approval) | ✅ |
| 5.9 | Notify investor on order events | ✅ |
| 5.10 | Kafka `order.placed` / `order.approved` / `sip.created` events | ✅ |
| 5.11 | Jest tests | ✅ |

---

## Phase 6 — Notification Service

**Location:** `services/notification-service/` (port 4007)

| # | Task | Status |
|---|------|--------|
| 6.1 | AppNotification Mongoose model | ✅ |
| 6.2 | Internal route: `notifyUser()` called from KYC, banking, investments | ✅ |
| 6.3 | GET `/api/notifications` (limit 50) | ✅ |
| 6.4 | DELETE `/api/notifications/:id` | ✅ |
| 6.5 | PUT `/api/notifications/:id/read` — mark as read | ✅ |
| 6.6 | GET `/api/notifications/unread-count` | ✅ |
| 6.7 | Email notifications via nodemailer | ✅ |
| 6.8 | Kafka consumer for `kyc.*`, `order.*`, `bank.*` | ✅ |

---

## Phase 7 — Audit Service

**Location:** `services/audit-service/` (port 4008)

| # | Task | Status |
|---|------|--------|
| 7.1 | AuditLog Mongoose model (actor, action, resource, IP, user-agent) | ✅ |
| 7.2 | Internal route: `audit()` / `auditEvent()` | ✅ |
| 7.3 | Logs KYC_SUBMITTED, KYC_APPROVED, KYC_REJECTED | ✅ |
| 7.4 | GET `/api/audit/:resourceType/:resourceId` — admin read | ✅ |
| 7.5 | No update/delete routes (immutability enforced) | ✅ |
| 7.6 | Kafka consumer for all domain events | ✅ |
| 7.7 | Admin audit trail UI | ✅ |

---

## Phase 8 — Frontend (Next.js)

**Location:** `apps/customer-web/` (port 3000)

| # | Task | Status |
|---|------|--------|
| 8.1 | Next.js App Router + Tailwind CSS v4 + shadcn/ui | ✅ |
| 8.2 | TanStack Query + Axios client with JWT interceptor | ✅ |
| 8.3 | AuthContext, ProtectedRoute, DashboardGate | ✅ |
| 8.4 | `(auth)` routes: signin, signup, admin login | ✅ |
| 8.5 | `(platform)` routes: dashboard, kyc, profile, banking, stocks/[symbol] | ✅ |
| 8.6 | Admin routes: dashboard, kyc review, AMC admin, banking admin | ✅ |
| 8.7 | Notification drawer in navbar | ✅ |
| 8.8 | Landing page sections | ✅ |
| 8.9 | next.config API proxy rewrites to `api-gateway` | ✅ |
| 8.10 | `(platform)/documents` route | ✅ |
| 8.11 | `admin/kyc/[id]` detail route | ✅ |
| 8.12 | Frontend component tests | ✅ |

---

## Phase 9 — Infrastructure (Docker, Kafka, S3, Tests) ✅

All services have Dockerfiles. This phase wires them together.

### Docker & Compose

| # | Task | Status |
|---|------|--------|
| 9.1 | `docker-compose.yml` — MongoDB, PostgreSQL, MinIO, Zookeeper, Kafka + UI | ✅ (Phase 0) |
| 9.2 | `init-kafka-topics.sh` — all 9 topics bootstrapped via `kafka-init` service | ✅ (Phase 0) |
| 9.3 | Health checks and `depends_on` ordering on all infra services | ✅ (Phase 0) |
| 9.4 | Compose entries for all 9 application services + frontend | ✅ `docker-compose.apps.yml` |
| 9.5 | Service Dockerfiles updated for monorepo context (pnpm workspace copy) | ✅ `infrastructure/docker/Dockerfile.service` |
| 9.6 | Frontend Dockerfile (Next.js standalone output) | ✅ `infrastructure/docker/Dockerfile.web` |

### Object Storage

| # | Task | Status |
|---|------|--------|
| 9.7 | `@aws-sdk/client-s3` + MinIO dev config in kyc-service | ✅ `@finboard/storage` |
| 9.8 | Migrate KYC uploads from local disk to S3/MinIO | ✅ (S3 when configured, disk fallback) |
| 9.9 | Presigned URL generation (5-min expiry) | ✅ |

### Kafka Events

| # | Task | Status |
|---|------|--------|
| 9.10 | `kafkajs` producer in kyc-service (`kyc.*`) | ✅ |
| 9.11 | `kafkajs` producer in banking-service (`bank.verified`) | ✅ |
| 9.12 | `kafkajs` producer in investment-service (`order.*`, `sip.created`) | ✅ |
| 9.13 | Kafka consumers in notification-service and audit-service | ✅ |

### API Gateway

| # | Task | Status |
|---|------|--------|
| 9.14 | `services/api-gateway` — http-proxy-middleware routing all `/api/*` prefixes | ✅ |
| 9.15 | Rate limiter: 100 req/min per IP | ✅ |
| 9.16 | Frontend `NEXT_PUBLIC_API_URL` → gateway :4000 | ✅ |

### Testing

| # | Task | Status |
|---|------|--------|
| 9.17 | Jest + Supertest per service | ✅ (152 tests across 7 services) |
| 9.18 | `mongodb-memory-server` for unit tests | ✅ |
| 9.19 | E2E smoke: signup → signin → profile | ✅ `pnpm test:e2e` (full KYC flow optional) |
| 9.20 | Root ESLint + Prettier | ✅ |

---

## Progress Summary

> **All 10 phases (0–9) are complete.** The platform is feature-complete for MVP.

| Area | Progress | Notes |
|------|:--------:|-------|
| Auth service | 100% | 28/28 tests passing |
| Profile service | 100% | 30/30 tests passing |
| KYC + OCR services | 100% | S3/MinIO + Kafka producers |
| Banking service | 100% | 56/56 tests + Kafka `bank.verified` |
| Investment service | 100% | 22/22 tests + Kafka order events |
| Notification service | 100% | Email, read APIs, Kafka consumer |
| Audit service | 100% | Read API, admin UI, Kafka consumer |
| Frontend | 100% | Phase 8 complete, DESIGN.md tokens |
| Infrastructure | 100% | Compose apps, Kafka, S3, Docker images |
| API Gateway | 100% | Routing, 100 req/min rate limit, health test |

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-06-21 | Original 8-phase microservices-first plan |
| 2.0 | 2026-06-26 | Restructured to 11 phases; modular monolith MVP approach |
| 3.0 | 2026-06-26 | Reflects actual state: all services already extracted as microservices; removed monolith migration phases; accurate status per service |
| 3.1 | 2026-06-26 | Phase 9 complete: Docker Compose apps, Kafka producers/consumers, S3/MinIO storage, gateway rate limit, 152 service tests, E2E smoke |

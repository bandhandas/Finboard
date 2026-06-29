# Technology Stack

## Finboard Investor Onboarding Platform

## Version: 2.0
## Date: 2026-06-26

---

## 1. Overview

Finboard uses a **hybrid technology stack** optimized for rapid MVP delivery today and microservices production deployment tomorrow.

> The current implementation is intentionally developed as a **modular monolith** inside a pnpm workspace. The production architecture will evolve into **independently deployable microservices** with Kafka, Docker Compose, and S3/MinIO object storage.

### 1.1 Stack at a Glance

| Layer | Technology | Version (Current) | Purpose |
|-------|-----------|:-----------------:|---------|
| **Monorepo** | pnpm workspaces | 10.12.4 | Package management across frontend + backend |
| **Frontend** | Next.js (App Router) | 16.2.9 | Full-stack React UI |
| **UI Components** | shadcn/ui + Radix UI | 4.x / 1.6.x | Accessible component primitives |
| **State (client)** | React Context | Built-in | Auth session (MVP) |
| **State (server)** | TanStack Query | 5.101.1 | Server state caching & mutations |
| **Styling** | Tailwind CSS | 4.3.1 | Utility-first CSS |
| **Backend** | Node.js + Express | 24 LTS / 5.1.0 | REST API (modular monolith today) |
| **Document DB** | MongoDB + Mongoose | 8.x / 8.19.1 | Users, profiles, KYC, notifications, audit, portfolios |
| **Relational DB** | PostgreSQL + Prisma | 16+ / 6.19.0 | Banking ledger, transactions, verification |
| **File Storage** | Local disk (MVP) → AWS S3 / MinIO | — | KYC document storage |
| **Message Queue** | In-process (MVP) → Apache Kafka | kafkajs 4.1.0 | Async inter-service events *(planned)* |
| **OCR** | Tesseract.js + OpenRouter | 7.0.0 | Document text extraction |
| **OTP / SMS** | Twilio-compatible + dev fallback | 6.0.2 | Phone verification |
| **Auth** | JWT + bcryptjs | 9.0.2 / 3.0.3 | Stateless authentication |
| **Validation** | Zod | 3.25.76 | Input validation |
| **Testing** | Jest + Supertest | 30.0.0 | Unit & integration testing *(planned)* |
| **Containerization** | Docker + Docker Compose | 29.x / 5.x | Service packaging *(planned)* |

---

## 2. Architecture Stages

### 2.1 Current (Modular Monolith)

```
Next.js 16 (port 3000)
        │
        │  Axios + JWT
        ▼
Express Monolith (port 4000)
        │
   ┌────┴────┬─────────┬──────────┬─────────────┐
   │         │         │          │             │
 Auth    Profile     KYC      Banking    Investments
 Profile           + Docs    (Prisma)    (Mongoose)
   │         │         │          │             │
   └────┬────┴────┬────┴──────────┴─────────────┘
        │         │
        ▼         ▼
    MongoDB   PostgreSQL
        │
        ▼
  Local uploads/  (interim)
```

### 2.2 Target (Production Microservices)

```
Next.js Frontend (port 3000)
            │
            ▼
     API Gateway (port 4000)
            │
    ┌───────┼───────┬───────┬───────┬───────┬───────┐
    │       │       │       │       │       │       │
  Auth  Profile  KYC   Document Banking Invest Notif Audit
    │       │       │       │       │       │       │
    └───┬───┴───┬───┴───┬───┴───┬───┴───┬───┴───┬───┘
        │       │       │       │       │       │
        ▼       ▼       ▼       ▼       ▼       ▼
              Apache Kafka (event bus)
        │                       │
        ▼                       ▼
    MongoDB                 PostgreSQL
    (per-service DBs)       (banking-db)
        │
        ▼
   AWS S3 / MinIO
```

---

## 3. Frontend

```
Next.js 16 (App Router) + Tailwind CSS v4 + shadcn/ui
            │
    ┌───────┴───────┐
    │               │
 Server Components  Client Components
 (layouts, SEO)      (forms, charts, interactivity)
    │               │
    └───────┬───────┘
            │
   ┌────────┴────────┐
   │                 │
AuthContext      TanStack Query
(session/token)  (KYC, banking, portfolio,
                 notifications, admin)
   │                 │
   └────────┬────────┘
            │
   Express Backend (port 4000)
   [Future: API Gateway]
```

### 3.1 Key Packages (Current — verified in `frontend/package.json`)

| Package | Version | Purpose | Status |
|---------|:-------:|---------|--------|
| `next` | 16.2.9 | App Router, SSR, routing | ✅ In use |
| `react` / `react-dom` | 19.2.7 | UI library | ✅ In use |
| `@tanstack/react-query` | 5.101.1 | Server state, mutations, cache | ✅ In use |
| `axios` | 1.12.2 | HTTP client with JWT interceptor | ✅ In use |
| `tailwindcss` | 4.3.1 | Utility-first styling | ✅ In use |
| `shadcn` / `radix-ui` | 4.11.0 / 1.6.0 | UI component system | ✅ In use |
| `lucide-react` | 1.21.0 | Icons | ✅ In use |
| `recharts` | 3.8.0 | Dashboard charts | ✅ In use |
| `sonner` | 2.0.7 | Toast notifications | ✅ In use |
| `next-themes` | 0.4.6 | Theme provider (dark mode) | ✅ In use |
| `date-fns` | 4.4.0 | Date formatting | ✅ In use |
| `@supabase/supabase-js` | 2.108.2 | Supabase client (stubs) | 🟡 Scaffolded |

### 3.2 Frontend Packages (Planned / Optional)

| Package | Version | Purpose | Status |
|---------|:-------:|---------|--------|
| `@reduxjs/toolkit` | 2.12.0 | Global state if complexity grows | ⬜ Optional |
| `react-redux` | 9.2.0 | Redux React bindings | ⬜ Optional |
| `react-dropzone` | 14.3.5 | Drag-and-drop file upload | ⬜ Planned |
| `jest` | 30.0.0 | Test runner | ⬜ Planned |
| `@testing-library/react` | 16.3.0 | Component testing | ⬜ Planned |

### 3.3 Frontend Structure

Feature-based architecture under `frontend/src/features/`:

| Feature | Responsibility |
|---------|---------------|
| `auth` | Signin, signup, admin login, ProtectedRoute, AuthContext |
| `profile` | Extended profile form |
| `kyc` | KYC submission, admin review API |
| `banking` | Bank verification, transfers, admin |
| `investments` | Portfolio, buy/SIP, stock detail, market data |
| `admin` | KYC review screen, AMC admin |
| `notifications` | Notification API + navbar integration |
| `layout` | Navbar, Footer, AppLayout, AdminShell |
| `dashboard` | Investment dashboard with onboarding gate |

---

## 4. Backend

### 4.1 Current (Modular Monolith)

```
Node.js 24 LTS + Express 5
      │
  ┌───┴───────────────────────────────┐
  │                                   │
Mongoose Models                  Prisma Client
(MongoDB)                        (PostgreSQL)
  │                                   │
  ├── User, UserProfile               ├── BankAccount
  ├── KycApplication, DummyIdentity ├── BankTransaction
  ├── AppNotification, AuditLog     ├── LedgerEntry
  └── PortfolioHolding              ├── BankVerification
                                      └── Beneficiary
      │
  Domain Services
  (OCR, OTP, banking, audit, notifications)
      │
  Middleware
  (JWT, roles, Zod validate, helmet, rate-limit, sanitize)
```

### 4.2 Key Packages (Current — verified in `backend/package.json`)

| Package | Version | Purpose | Status |
|---------|:-------:|---------|--------|
| `express` | 5.1.0 | HTTP framework | ✅ In use |
| `mongoose` | 8.19.1 | MongoDB ODM | ✅ In use |
| `@prisma/client` | 6.19.0 | PostgreSQL ORM (banking) | ✅ In use |
| `prisma` | 6.19.0 | Schema migrations, seed | ✅ In use |
| `jsonwebtoken` | 9.0.2 | JWT sign/verify | ✅ In use |
| `bcryptjs` | 3.0.3 | Password hashing | ✅ In use |
| `zod` | 3.25.76 | Schema validation | ✅ In use |
| `tesseract.js` | 7.0.0 | OCR engine | ✅ In use |
| `multer` | 2.2.0 | Multipart file upload | ✅ In use |
| `twilio` | 6.0.2 | SMS OTP delivery | ✅ In use |
| `axios` | 1.18.1 | OpenRouter OCR API calls | ✅ In use |
| `helmet` | 8.1.0 | Security headers | ✅ In use |
| `express-rate-limit` | 8.2.1 | Rate limiting | ✅ In use |
| `morgan` | 1.10.1 | HTTP request logging | ✅ In use |
| `cors` | 2.8.5 | Cross-origin support | ✅ In use |
| `dotenv` | 16.6.1 | Environment variables | ✅ In use |
| `nodemon` | 3.1.10 | Dev hot reload | ✅ Dev only |

### 4.3 Backend Packages (Planned for Production)

| Package | Version | Purpose | Status |
|---------|:-------:|---------|--------|
| `kafkajs` | 4.1.0 | Kafka producer/consumer | ⬜ Planned |
| `@aws-sdk/client-s3` | 3.1069.0 | S3/MinIO object storage | ⬜ Planned |
| `@aws-sdk/s3-request-presigner` | 3.1069.0 | Pre-signed URL generation | ⬜ Planned |
| `sharp` | 0.35.1 | Image compression + thumbnails | ⬜ Planned |
| `nodemailer` | 9.0.1 | Email notifications | ⬜ Planned |
| `uuid` | 11.1.0 | Unique document keys | ⬜ Planned |
| `jest` | 30.0.0 | Test runner | ⬜ Planned |
| `supertest` | 7.1.0 | HTTP integration testing | ⬜ Planned |
| `http-proxy-middleware` | latest | API Gateway proxy | ⬜ Planned |

### 4.4 Service-Specific Packages (Target Microservices)

| Service | Packages | Status |
|---------|----------|--------|
| KYC Service | `tesseract.js`, `validator`, `kafkajs` | 🟡 Partial (no Kafka yet) |
| Document Service | `@aws-sdk/client-s3`, `multer`, `sharp`, `uuid` | ⬜ Planned |
| Banking Service | `@prisma/client`, `prisma` | ✅ In monolith |
| Notification Service | `nodemailer`, `kafkajs` | ⬜ Planned |
| Audit Service | `kafkajs` | ⬜ Planned |
| Investment Service | `mongoose`, banking HTTP client | ✅ In monolith |

---

## 5. Database Layer (Hybrid Persistence)

Hybrid persistence is **intentional**. Document-oriented and workflow data lives in MongoDB; relational ledger data lives in PostgreSQL.

### 5.1 MongoDB (Mongoose)

**Used for:**

| Domain | Collections / Models |
|--------|---------------------|
| Authentication | `User` |
| User Profile | `UserProfile` |
| KYC | `KycApplication`, `DummyIdentity` |
| Notifications | `AppNotification` |
| Audit | `AuditLog` |
| Investments | `PortfolioHolding` |

**Connection:** Single `MONGODB_URI` in the modular monolith. Production target: per-service databases (`auth-db`, `kyc-db`, `notif-db`, `audit-db`, `invest-db`) on a shared MongoDB cluster.

| Attribute | Current | Production Target |
|-----------|---------|-------------------|
| Engine | MongoDB 8.x | MongoDB 8.3.4 |
| ODM | Mongoose 8.19.1 | Mongoose 9.7.1 |
| Topology | Single shared database | Per-service databases |

### 5.2 PostgreSQL (Prisma)

**Used for:**

| Domain | Prisma Models |
|--------|--------------|
| Banking accounts | `BankAccount` |
| Financial transactions | `BankTransaction`, `LedgerEntry` |
| Account verification | `BankVerification` |
| Beneficiaries | `Beneficiary` |
| Banking notifications | `BankNotification` |

**Connection:** `BANK_DATABASE_URL` (Supabase-compatible PostgreSQL). Banking module degrades gracefully when unset.

| Attribute | Current | Production Target |
|-----------|---------|-------------------|
| Engine | PostgreSQL 16+ (Supabase) | PostgreSQL 16+ |
| ORM | Prisma 6.19.0 | Prisma 6.x |
| Scope | Banking module only | Dedicated `banking-service` |

### 5.3 Why Hybrid?

| Concern | MongoDB | PostgreSQL |
|---------|---------|------------|
| KYC documents & OCR metadata | Flexible nested schema | — |
| User profiles with variable fields | Schema-flexible | — |
| Double-entry ledger & DECIMAL precision | — | ACID transactions |
| Bank verification state machine | — | Relational integrity |
| Audit/event logs | Append-friendly documents | — |

---

## 6. Infrastructure

### 6.1 Current (Development)

| Component | Status |
|-----------|--------|
| pnpm workspace | ✅ |
| MongoDB (Atlas or local) | ✅ Required |
| PostgreSQL (Supabase or local) | ✅ Optional (banking) |
| Local file uploads (`backend/uploads/`) | ✅ Interim |
| Docker Compose | ⬜ Planned |
| Kafka | ⬜ Planned |
| MinIO | ⬜ Planned |

### 6.2 Target (Production — Planned)

```
┌─────────────────────┐
│  Docker Engine      │  Container runtime (v29.5.2)
│  Docker Compose     │  Multi-service orchestration (v5.1.4)
├─────────────────────┤
│  Apache Kafka 4.1.0 │  Event streaming
│                     │  Topics: kyc.submitted, kyc.approved,
│                     │          kyc.rejected, bank.verified,
│                     │          order.placed
├─────────────────────┤
│  MinIO (Dev)        │  S3-compatible object storage
│  AWS S3 (Prod)      │  Same SDK, swap endpoint only
├─────────────────────┤
│  MongoDB 8.3.4      │  Per-service databases
├─────────────────────┤
│  PostgreSQL 16+     │  Banking service database
└─────────────────────┘
```

---

## 7. Data Flow Examples

### 7.1 KYC Submission (Current — Monolith)

```
User ──POST /api/kyc/submit──> Express Monolith
                                    │
                         ┌──────────┼──────────┐
                         │          │          │
                         ▼          ▼          ▼
                    Validate    Tesseract   notifyUser()
                    PAN/Aadhaar  OCR +      audit()
                    + Multer     OpenRouter   (in-process)
                         │          │          │
                         ▼          ▼          ▼
                    MongoDB    uploads/kyc/  MongoDB
                               (local disk)  (notif + audit)
```

### 7.2 KYC Submission (Target — Microservices)

```
User ──POST /api/kyc/submit──> Gateway ──> KYC Service
                                               │
                                    ┌──────────┼──────────┐
                                    │          │          │
                                    ▼          ▼          ▼
                               Validate    Document Svc  Kafka
                               PAN         (S3 upload)   kyc.submitted
                                    │          │          │
                                    ▼          ▼          ▼
                               MongoDB      S3/MinIO   Kafka Topic
                                                         │
                                              ┌──────────┴──────────┐
                                              ▼                     ▼
                                        Audit Service      Notification Service
```

### 7.3 Investment Buy (Current)

```
User ──POST /api/investments/buy──> Express Monolith
                                        │
                              ensureInvestmentEligibility()
                              (KYC approved + bank linked)
                                        │
                                        ▼
                              debitForInvestment() ──> Prisma/PostgreSQL
                                        │
                                        ▼
                              PortfolioHolding.create() ──> MongoDB
                                        │
                                        ▼
                              notifyUser() ──> MongoDB
```

### 7.4 Admin KYC Approval (Target)

```
Admin ──POST /api/kyc/.../approve──> Gateway ──> KYC Service
                                                      │
                                           ┌──────────┼──────────┐
                                           ▼          ▼          ▼
                                      Update      Kafka       Kafka
                                      status      kyc.approved audit event
                                           │          │          │
                                           ▼          ▼          ▼
                                      MongoDB    Kafka Topic  Kafka Topic
                                                      │
                                                      ▼
                                               Notification Svc
                                               (in-app + email)
```

---

## 8. Port Mapping

### 8.1 Current

| Component | Port |
|-----------|:----:|
| Express monolith (all APIs) | 4000 |
| Next.js frontend | 3000 |
| MongoDB | 27017 |
| PostgreSQL (Supabase) | 5432 |

### 8.2 Target (Production)

| Service | Internal Port | Exposed |
|---------|:------------:|:-------:|
| API Gateway | 4000 | 4000 |
| Auth Service | 4001 | — |
| Profile Service | 4002 | — |
| KYC Service | 4003 | — |
| Document Service | 4004 | — |
| Banking Service | 4005 | — |
| Investment Service | 4006 | — |
| Notification Service | 4007 | — |
| Audit Service | 4008 | — |
| MongoDB | 27017 | 27017 |
| PostgreSQL | 5432 | 5432 |
| Kafka | 9092 / 9093 | 9092 / 9093 |
| MinIO (Dev) | 9000 / 9001 | 9000 / 9001 |
| Frontend (Next.js) | 3000 | 3000 |

---

## 9. Environment Variables

### 9.1 Backend (Current)

```env
# Core
NODE_ENV=development
PORT=4000
CLIENT_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
MONGODB_URI=mongodb://127.0.0.1:27017/kyc-auth-db
JWT_SECRET=<secret>
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
UPLOAD_DIR=uploads

# Banking (PostgreSQL)
BANK_DATABASE_URL=postgresql://...@db.<project>.supabase.co:5432/postgres?sslmode=require

# OCR
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-4o-mini

# Twilio OTP
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_DEV_OTP=123456
TWILIO_SHOW_OTP_IN_RESPONSE=true
```

### 9.2 Frontend (Current)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

### 9.3 Production Additions (Planned)

```env
# Kafka
KAFKA_BROKER=kafka:9092

# S3 / MinIO
S3_ENDPOINT=http://minio:9000        # MinIO in dev; omit for AWS
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=finboard-kyc-docs

# Email
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=noreply@finboard.demo

# OCR
OCR_LANG=eng
PAN_REGEX_PATTERN=
```

---

## 10. Development Tools

| Tool | Version | Usage | Status |
|------|:-------:|-------|--------|
| pnpm | 10.12.4 | Monorepo package manager | ✅ |
| VS Code | latest | Primary IDE | ✅ |
| Postman / Bruno | latest | API testing | ✅ |
| MongoDB Compass | latest | MongoDB GUI | ✅ |
| Prisma Studio | 6.x | PostgreSQL GUI | ✅ |
| Docker Desktop | 4.78.0 | Container management | ⬜ Planned |
| ESLint + Prettier | latest | Code quality | ⬜ Planned |
| Jest | 30.0.0 | Test runner | ⬜ Planned |
| Nodemon | 3.1.10 | Backend hot reload | ✅ |

### Dev Commands

```bash
pnpm install                              # Install all workspace packages
pnpm run dev                              # Backend (:4000) + frontend (:3000)
pnpm --filter kyc-auth-backend dev        # Backend only
pnpm --filter kyc-auth-frontend dev       # Frontend only
pnpm --filter kyc-auth-frontend build     # Production build
pnpm --filter kyc-auth-backend prisma:migrate  # Banking DB migrations
pnpm --filter kyc-auth-backend seed:admin      # Seed admin users
pnpm --filter kyc-auth-backend seed:kyc        # Seed dummy identities
```

---

## 11. Justification

### Why MongoDB?

- Schema-flexible documents suit variable KYC data (PAN, Aadhaar, OCR output)
- Embedded document arrays in `KycApplication` reduce joins
- Native JSON aligns with Node.js/Express
- Horizontal scaling via sharding in production

### Why PostgreSQL + Prisma for Banking?

- **ACID transactions** required for ledger entries and balance updates
- **DECIMAL precision** for monetary amounts (no floating-point errors)
- **Relational integrity** for account → transaction → ledger foreign keys
- **Prisma** provides type-safe queries, migrations, and seed scripts
- **Isolation** from MongoDB — banking data never mixes with document-store collections

### Why Hybrid Persistence?

- Right tool for each domain: documents vs ledger
- Banking can scale independently on PostgreSQL read replicas
- KYC/OCR workflows benefit from MongoDB's flexible schema
- Matches production fintech patterns (operational DB + ledger DB)

### Why Kafka over RabbitMQ? *(Production target)*

- **Event replay** — Consumers can rewind from any offset for audit recovery
- **Durable log** — Append-only log aligns with immutable audit requirements
- **Consumer groups** — Notification and Audit services independently consume same events
- **Throughput** — Handles high event volume during bulk KYC processing

### Why Tesseract.js over Cloud OCR?

- Zero cost, runs locally in the container
- Sufficient accuracy for printed PAN/Aadhaar text
- No external API dependency for baseline OCR
- OpenRouter LLM layer added for structured extraction when needed
- Can swap for AWS Textract in production if accuracy requirements increase

### Why Next.js?

- App Router with Server and Client Components
- File-system routing matches feature module structure
- Built-in optimizations (fonts, code splitting)
- Industry standard for React production apps

### Why AuthContext + TanStack Query (Current)?

- **Simpler MVP** — AuthContext handles token/session without Redux boilerplate
- **TanStack Query** owns all server state (KYC, banking, portfolio, notifications)
- **Automatic caching** — Query invalidation after mutations (approve KYC, buy stock)
- Redux Toolkit remains available if global UI state complexity grows

### Why shadcn/ui?

- Copy-paste components — no opaque dependency
- Built on Radix UI — accessible by default
- Tailwind-native — consistent with design system
- Dark theme support out of the box

### Why pnpm?

- Efficient disk usage via content-addressable store
- First-class monorepo workspace support
- Strict dependency resolution prevents phantom deps

### Why MinIO over AWS S3 for Development? *(Planned)*

- Identical `@aws-sdk/client-s3` API — swap `S3_ENDPOINT` only
- Zero cost — runs locally via Docker
- Built-in web console at port 9001
- Offline-friendly development

### Why Express?

- Largest middleware ecosystem (multer, helmet, cors, rate-limit)
- Simple learning curve
- Same framework for monolith today and microservices tomorrow

---

## 12. Version Verification

Package versions in the **Current** columns were verified from `frontend/package.json` and `backend/package.json` on **2026-06-26**.

Production target versions were verified from npm registry and official release notes on **2026-06-21**.

To update versions:

```bash
pnpm view <package-name> version     # Single package
pnpm outdated                         # All outdated packages
node --version                        # Node.js
docker --version                      # Docker Engine
docker compose version                # Docker Compose
```

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-06-21 | Original KYC-only microservices stack |
| 2.0 | 2026-06-26 | Added PostgreSQL/Prisma, banking/investments modules, shadcn/ui, pnpm, Twilio; two-stage architecture; hybrid persistence section |

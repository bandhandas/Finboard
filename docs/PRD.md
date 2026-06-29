# Product Requirements Document: Finboard Investor Onboarding Platform

## Version: 2.0
## Status: Active
## Date: 2026-06-26
## Supersedes: PRD v1.0 (2026-06-21)

---

## 1. Executive Summary

**Finboard** is a full-stack fintech simulation platform for mutual fund investor onboarding, KYC verification, dummy core banking, and investment flows. It mirrors production-grade patterns used by RTAs (Registrar & Transfer Agents) and AMCs (Asset Management Companies) across India.

The platform covers the complete investor lifecycle:

1. **Registration & authentication** (email/password + phone OTP)
2. **Extended user profile** completion
3. **KYC submission** with PAN/Aadhaar upload, OCR extraction, and admin review
4. **Dummy bank verification** (Rs. 2 debit + automatic refund)
5. **Stock and mutual fund investing** (buy, SIP, portfolio, AMC order management)
6. **In-app notifications** and **immutable audit logging**

> **Architecture note:** The current implementation is intentionally developed as a **modular monolith** inside a pnpm workspace to accelerate MVP delivery. The **production architecture will evolve into independently deployable microservices** following the implementation roadmap in `IMPLEMENTATION-PLAN.md`. See §2 for the two-stage architecture model.

This document describes both **what exists today** and **where the product is heading**.

---

## 2. Architecture Overview

### 2.1 Two-Stage Architecture Model

| Stage | Pattern | Purpose |
|-------|---------|---------|
| **Current (MVP)** | Modular monolith | Fast iteration, shared process, domain folders in `backend/src/` |
| **Target (Production)** | Microservices + API Gateway + Kafka | Independent deployability, event-driven decoupling, horizontal scaling |

### 2.2 Current Architecture (Modular Monolith)

```
┌─────────────────────────────────────────────────────────┐
│              Next.js 16 Frontend (port 3000)             │
│         App Router · TanStack Query · shadcn/ui          │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP REST
                            ▼
┌─────────────────────────────────────────────────────────┐
│           Express Backend — Modular Monolith             │
│                      (port 4000)                         │
├──────────┬──────────┬──────────┬──────────┬─────────────┤
│   Auth   │ Profile  │   KYC    │ Banking  │ Investments │
│          │          │ + Docs   │          │             │
├──────────┴──────────┴──────────┴──────────┴─────────────┤
│        Notifications · Audit (in-process helpers)        │
└───────────────┬─────────────────────────┬───────────────┘
                │                         │
                ▼                         ▼
         ┌─────────────┐          ┌─────────────┐
         │   MongoDB   │          │ PostgreSQL  │
         │  (Mongoose) │          │  (Prisma)   │
         └─────────────┘          └─────────────┘
                │
                ▼
         Local disk uploads
         (uploads/kyc/) — interim;
         S3/MinIO planned for production
```

**Current backend modules** (mapped to `backend/src/`):

| Module | Routes | Persistence |
|--------|--------|-------------|
| Authentication | `/api/auth/*` | MongoDB |
| User Profile | `/api/profile/*` | MongoDB |
| KYC + Documents | `/api/kyc/*` | MongoDB + local files |
| Notifications | `/api/notifications/*` | MongoDB |
| Banking | `/api/banking/*` | PostgreSQL |
| Investments | `/api/investments/*` | MongoDB (+ banking debit via Prisma) |
| Audit (write-only) | In-process `audit()` helper | MongoDB |

### 2.3 Target Architecture (Production Microservices)

```
┌─────────────────────────────────────────────────────────┐
│              Next.js Frontend (port 3000)                │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     API Gateway                          │
│           Express reverse proxy (port 4000)              │
└──┬───┬───┬───┬───┬───┬───┬───┬───┬─────────────────────┘
   │   │   │   │   │   │   │   │   │
   ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼
 Auth Profile KYC  Doc Bank Invest Notif Audit
 Svc  Svc   Svc  Svc  Svc  Svc   Svc   Svc
   │   │   │   │   │   │   │   │   │
   └───┴───┴───┴───┴───┴───┴───┴───┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐
   │  Kafka  │ │ MongoDB │ │PostgreSQL│
   │ (events)│ │         │ │         │
   └─────────┘ └─────────┘ └─────────┘
                        │
                        ▼
                   AWS S3 / MinIO
                   (document storage)
```

### 2.4 Target Service Definitions

| Service | Responsibility | Database | Port |
|---------|---------------|----------|------|
| **API Gateway** | Route requests, rate-limit, CORS, helmet | None | 4000 |
| **Auth Service** | Register, login, JWT, phone OTP, admin roles | MongoDB (`auth-db`) | 4001 |
| **Profile Service** | Extended investor profile CRUD | MongoDB (`profile-db`) | 4002 |
| **KYC Service** | PAN validation, OCR, eKYC, admin review | MongoDB (`kyc-db`) | 4003 |
| **Document Service** | S3/MinIO upload, presigned URLs, thumbnails | MongoDB (`doc-db`) | 4004 |
| **Banking Service** | Account verification, transfers, ledger | PostgreSQL (`bank-db`) | 4005 |
| **Investment Service** | Portfolio, buy/SIP, AMC order workflow | MongoDB (`invest-db`) | 4006 |
| **Notification Service** | In-app + email notifications (Kafka consumer) | MongoDB (`notif-db`) | 4007 |
| **Audit Service** | Immutable audit trail (Kafka consumer) | MongoDB (`audit-db`) | 4008 |

### 2.5 Migration Strategy

| Phase | Action |
|-------|--------|
| **Now** | Domain logic lives in modular monolith folders; synchronous calls between modules |
| **Near-term** | Extract document storage to S3/MinIO; add Kafka producers for KYC lifecycle events |
| **Mid-term** | Introduce API Gateway; split Auth, KYC, Banking into separate deployables |
| **Production** | Full service split, per-service databases where required, Kafka consumers for Notification and Audit |

---

## 3. Product Scope

### 3.1 In Scope (Official Product Modules)

| Module | Description | Status |
|--------|-------------|--------|
| **Authentication** | Signup, signin, JWT, phone OTP (Twilio-compatible), admin login, role-based access | ✅ Implemented (monolith) |
| **User Profile** | Extended demographic, address, bank summary, KYC status linkage | ✅ Implemented (monolith) |
| **KYC** | PAN/Aadhaar submission, dummy identity matching, admin approve/reject | ✅ Implemented (monolith) |
| **OCR** | Tesseract.js extraction + optional OpenRouter structured parsing | ✅ Implemented (monolith) |
| **Documents** | File upload with validation; metadata embedded in KYC application | 🟡 Partial — local disk; S3 planned |
| **Notifications** | In-app notifications for KYC, banking, investment events | 🟡 Partial — no email, no Kafka |
| **Audit** | Append-only audit log writes on KYC state changes | 🟡 Partial — write-only; read API planned |
| **Banking** | Dummy core banking: verify account, transfer, beneficiaries, admin ops | ✅ Implemented (monolith + PostgreSQL) |
| **Investments** | Stocks, mutual funds, SIP, portfolio, AMC admin order approval | ✅ Implemented (monolith) |
| **AMC Administration** | `amc_admin` role, order status management, AUM overview | ✅ Implemented (monolith) |
| **Admin / RTA Review** | KYC review queue, OCR comparison, multi-role admin (`admin`, `rta_admin`) | ✅ Implemented (monolith) |

### 3.2 Out of Scope (Current Release)

- Real bank, UPI, broker, or exchange connectivity
- Production-grade Video KYC (SEBI VideoKYC)
- Kubernetes / Helm deployment (planned post-microservices migration)

### 3.3 Demo & Learning Constraints

All financial flows are simulated. No real money movement occurs outside the dummy PostgreSQL ledger.

---

## 4. Functional Requirements

### 4.1 Authentication

| ID | Requirement | Priority | Status |
|----|------------|----------|--------|
| AUTH-01 | User shall register with name, email, phone, password | P0 | ✅ |
| AUTH-02 | User shall log in with email + password | P0 | ✅ |
| AUTH-03 | System shall issue JWT access tokens on login | P0 | ✅ |
| AUTH-04 | System shall verify JWT on protected routes | P0 | ✅ |
| AUTH-05 | User shall verify phone via OTP during signup (Twilio or dev fallback) | P0 | ✅ |
| AUTH-06 | Admin users shall be seeded with configurable roles | P0 | ✅ |
| AUTH-07 | System shall support roles: `user`, `admin`, `rta_admin`, `amc_admin` | P0 | ✅ |
| AUTH-08 | User shall change password when authenticated | P1 | ✅ |
| AUTH-09 | User shall reset password via email OTP | P1 | ⬜ Planned |

### 4.2 User Profile

| ID | Requirement | Priority | Status |
|----|------------|----------|--------|
| PROF-01 | User shall view their extended profile | P0 | ✅ |
| PROF-02 | User shall update demographic and address fields | P0 | ✅ |
| PROF-03 | Profile shall track KYC status (`not_started` through `approved`) | P0 | ✅ |
| PROF-04 | Profile shall store masked bank summary after verification | P1 | ✅ |

### 4.3 KYC

| ID | Requirement | Priority | Status |
|----|------------|----------|--------|
| KYC-01 | User shall submit PAN number with format validation | P0 | ✅ |
| KYC-02 | System shall verify PAN against checksum algorithm | P0 | ⬜ Planned |
| KYC-03 | User shall upload PAN card image (max 5MB) | P0 | ✅ |
| KYC-04 | User shall upload Aadhaar card image (max 5MB) | P0 | ✅ |
| KYC-05 | System shall extract text from documents using OCR (Tesseract.js) | P1 | ✅ |
| KYC-06 | System shall compare OCR-extracted values with user-entered values | P1 | 🟡 Partial |
| KYC-07 | System shall match submission against seeded dummy identity dataset | P1 | ✅ |
| KYC-08 | KYC submission shall be a single atomic operation | P0 | ✅ |
| KYC-09 | Admin shall approve or reject KYC applications | P0 | ✅ |
| KYC-10 | Optional OpenRouter LLM extraction for structured OCR fields | P2 | ✅ |

### 4.4 Documents

| ID | Requirement | Priority | Status |
|----|------------|----------|--------|
| DOC-01 | System shall upload files to S3/MinIO with UUID-based keys | P0 | ⬜ Planned |
| DOC-02 | System shall generate pre-signed URLs for secure viewing | P0 | ⬜ Planned |
| DOC-03 | System shall validate file type and size before upload | P0 | ✅ (local upload) |
| DOC-04 | System shall compress images >2MB before upload (Sharp) | P1 | ⬜ Planned |
| DOC-05 | System shall store document metadata | P0 | 🟡 Embedded in KYC application |
| DOC-06 | Admin shall view uploaded documents alongside OCR output | P1 | ✅ |

### 4.5 Admin & AMC Administration

| ID | Requirement | Priority | Status |
|----|------------|----------|--------|
| ADM-01 | Admin dashboard shall display KYC applications | P0 | ✅ |
| ADM-02 | Admin shall filter KYC by status | P0 | 🟡 Client-side filter; server pagination planned |
| ADM-03 | Admin shall view user details + documents + OCR side by side | P0 | ✅ |
| ADM-04 | Admin shall approve a KYC application | P0 | ✅ |
| ADM-05 | Admin shall reject with remarks | P0 | 🟡 Remarks optional in API |
| ADM-06 | Admin dashboard shall show aggregate stats | P1 | 🟡 Client-computed; dedicated stats API planned |
| ADM-07 | AMC admin shall manage investment order statuses | P1 | ✅ |
| ADM-08 | RTA admin shall access KYC review (role-scoped) | P1 | ✅ |

### 4.6 Banking

| ID | Requirement | Priority | Status |
|----|------------|----------|--------|
| BANK-01 | User shall link and verify a bank account (Rs. 2 debit simulation) | P0 | ✅ |
| BANK-02 | System shall automatically refund verification debit | P0 | ✅ (background job) |
| BANK-03 | User shall view balance and transaction history | P0 | ✅ |
| BANK-04 | User shall transfer funds between demo accounts | P1 | ✅ |
| BANK-05 | User shall manage beneficiaries | P1 | ✅ |
| BANK-06 | Admin shall freeze accounts and reset demo balances | P1 | ✅ |
| BANK-07 | Banking data shall be isolated in PostgreSQL | P0 | ✅ |

### 4.7 Investments

| ID | Requirement | Priority | Status |
|----|------------|----------|--------|
| INV-01 | User shall buy stocks after KYC approval + bank verification | P0 | ✅ |
| INV-02 | User shall place mutual fund orders routed to AMC collection account | P0 | ✅ |
| INV-03 | User shall create SIP installments | P1 | ✅ |
| INV-04 | User shall view portfolio holdings | P0 | ✅ |
| INV-05 | AMC admin shall approve/reject pending MF orders | P1 | ✅ |
| INV-06 | Admin shall view AUM and investor overview | P1 | ✅ |

### 4.8 Notifications

| ID | Requirement | Priority | Status |
|----|------------|----------|--------|
| NOT-01 | User shall receive in-app notification on KYC approval | P0 | ✅ |
| NOT-02 | User shall receive in-app notification on KYC rejection | P0 | ✅ |
| NOT-03 | User shall receive notifications for banking and investment events | P1 | ✅ |
| NOT-04 | User shall view notification history | P1 | ✅ |
| NOT-05 | User shall receive email on status change | P1 | ⬜ Planned |
| NOT-06 | User shall mark notifications as read | P1 | ⬜ Planned |
| NOT-07 | User shall fetch unread notification count | P2 | 🟡 Computed client-side |

### 4.9 Audit

| ID | Requirement | Priority | Status |
|----|------------|----------|--------|
| AUD-01 | Every KYC state change shall be logged with actor, action, timestamp | P0 | ✅ |
| AUD-02 | Audit log shall be append-only | P0 | 🟡 No delete API; Kafka immutability planned |
| AUD-03 | Admin shall view audit trail for a resource | P0 | ⬜ Planned |
| AUD-04 | Audit entries shall include IP address and user-agent | P1 | ✅ |

**Status legend:** ✅ Implemented · 🟡 Partial · ⬜ Planned

---

## 5. Non-Functional Requirements

| ID | Requirement | Target | Current | Target (Production) |
|----|------------|--------|---------|---------------------|
| NFR-01 | API response time (p95) | < 500ms | Monolith — acceptable for demo | Per-service SLA |
| NFR-02 | Document upload time (p95, <5MB) | < 3s | Local disk | S3 with CDN |
| NFR-03 | System uptime | 99.5% | Single process | Multi-instance per service |
| NFR-04 | Concurrent users | 1000 | Demo scale | Horizontally scaled services |
| NFR-05 | Independent deployability | Yes | No (monolith) | Yes (microservices) |
| NFR-06 | Sync HTTP + async message queue | Yes | HTTP only (in-process) | HTTP + Kafka |
| NFR-07 | Secrets in environment variables | Yes | ✅ | ✅ |
| NFR-08 | Containerized via Docker Compose | Yes | ⬜ Planned | ✅ Required |

---

## 6. Data Models

### 6.1 MongoDB Collections

#### User (`User`)

```json
{
  "id": "ObjectId",
  "name": "string",
  "email": "string (unique)",
  "phone": "string (unique)",
  "passwordHash": "string (bcrypt)",
  "role": "enum: user | admin | rta_admin | amc_admin",
  "phoneVerified": "boolean",
  "emailVerified": "boolean",
  "lastLoginAt": "ISODate",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

#### User Profile (`UserProfile`)

```json
{
  "id": "ObjectId",
  "userId": "ObjectId (ref User)",
  "fullName": "string",
  "dateOfBirth": "ISODate",
  "pan": "string",
  "mobileNumber": "string",
  "emailAddress": "string",
  "maritalStatus": "enum",
  "gender": "enum",
  "incomeRange": "enum",
  "occupation": "string",
  "address": { "line1", "line2", "city", "state", "postalCode", "country" },
  "bank": { "accountHolderName", "accountNumberMasked", "ifsc", "bankName", "verified" },
  "kycStatus": "enum: not_started | profile_pending | pending_review | approved | rejected"
}
```

#### KYC Application (`KycApplication`)

```json
{
  "id": "ObjectId",
  "userId": "ObjectId",
  "name": "string",
  "panNumber": "string",
  "aadhaarNumber": "string",
  "status": "enum: draft | failed | pending_admin_review | approved | rejected | reupload_requested",
  "checks": {
    "identityExists": "boolean",
    "nameMatchesDataset": "boolean",
    "panMatchesDataset": "boolean",
    "aadhaarMatchesDataset": "boolean",
    "panOcrMatches": "boolean",
    "aadhaarOcrMatches": "boolean"
  },
  "documents": [{
    "type": "enum: pan | aadhaar",
    "originalName": "string",
    "mimeType": "string",
    "sizeBytes": "number",
    "url": "string",
    "ocrText": "string",
    "extracted": "object",
    "extractionSource": "string",
    "match": "boolean"
  }],
  "adminRemarks": "string",
  "reviewedBy": "ObjectId",
  "reviewedAt": "ISODate",
  "submittedAt": "ISODate"
}
```

#### Portfolio Holding (`PortfolioHolding`)

```json
{
  "id": "ObjectId",
  "userId": "ObjectId",
  "assetType": "enum: stock | mutual_fund | sip",
  "symbol": "string",
  "name": "string",
  "quantity": "number",
  "purchasePrice": "number",
  "currentPrice": "number",
  "totalAmount": "number",
  "orderStatus": "string",
  "folioNumber": "string",
  "sipDate": "number",
  "sipAmount": "number",
  "nextDebitDate": "ISODate",
  "amcAccount": "object"
}
```

#### App Notification (`AppNotification`)

```json
{
  "id": "ObjectId",
  "userId": "ObjectId",
  "title": "string",
  "message": "string",
  "type": "string",
  "read": "boolean (default false)",
  "createdAt": "ISODate"
}
```

#### Audit Log (`AuditLog`)

```json
{
  "id": "ObjectId",
  "actorId": "ObjectId",
  "actorRole": "enum: user | admin | rta_admin | amc_admin | system",
  "action": "string",
  "resourceType": "string",
  "resourceId": "string",
  "details": "object",
  "ipAddress": "string",
  "userAgent": "string",
  "createdAt": "ISODate"
}
```

### 6.2 PostgreSQL Models (Prisma — Banking)

Key entities: `BankAccount`, `BankTransaction`, `LedgerEntry`, `BankVerification`, `Beneficiary`, `BankNotification`.

Banking uses **intentional hybrid persistence**: document-oriented data (users, KYC, portfolios) in MongoDB; relational ledger data in PostgreSQL. See `TECH-STACK.md` §4 for rationale.

### 6.3 Target Document Model (Production)

When the Document Service is extracted, metadata will move to a dedicated `Document` collection with `s3Key` and `thumbnailS3Key` fields (see `IMPLEMENTATION-PLAN.md` Phase 3 / Document extraction).

---

## 7. API Overview

### 7.1 Current API (Modular Monolith — port 4000)

#### Authentication — `/api/auth`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/signup` | Register with phone OTP verification | No |
| POST | `/api/auth/signin` | Email + password login | No |
| POST | `/api/auth/admin/signin` | Admin login with role check | No |
| POST | `/api/auth/send-otp` | Send phone OTP | No |
| POST | `/api/auth/verify-otp` | Verify phone OTP | No |
| POST | `/api/auth/phone-login` | Login via verified phone OTP | No |
| GET | `/api/auth/me` | Current user | JWT |
| PATCH | `/api/auth/change-password` | Change password | JWT |

#### Profile — `/api/profile`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/profile/me` | Get profile | JWT |
| PUT | `/api/profile/me` | Update profile | JWT |

#### KYC — `/api/kyc`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/kyc/me` | User's KYC application | JWT |
| POST | `/api/kyc/submit` | Submit PAN/Aadhaar + documents | JWT |
| GET | `/api/kyc/admin/applications` | List all applications | Admin / RTA |
| GET | `/api/kyc/admin/applications/:id` | Application detail | Admin / RTA |
| POST | `/api/kyc/admin/applications/:id/approve` | Approve | Admin / RTA |
| POST | `/api/kyc/admin/applications/:id/reject` | Reject | Admin / RTA |

#### Notifications — `/api/notifications`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/notifications` | List notifications (limit 50) | JWT |
| DELETE | `/api/notifications/:id` | Remove notification | JWT |

#### Banking — `/api/banking`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/banking/account` | Linked account + balance | JWT |
| POST | `/api/banking/verify-bank` | Verify bank (Rs. 2 debit) | JWT |
| POST | `/api/banking/transfer` | Transfer funds | JWT |
| GET | `/api/banking/transactions` | Transaction history | JWT |
| GET | `/api/banking/admin/users` | Admin user list | Admin |
| PATCH | `/api/banking/admin/users/:id/freeze` | Freeze account | Admin |

#### Investments — `/api/investments`

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/investments/portfolio` | User holdings | JWT |
| POST | `/api/investments/buy` | Buy stock or MF | JWT |
| POST | `/api/investments/sip` | Create SIP | JWT |
| GET | `/api/investments/admin/overview` | AMC/Admin AUM overview | Admin / RTA / AMC |
| PATCH | `/api/investments/admin/orders/:id/status` | Update order status | Admin / AMC |

#### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service health check |

### 7.2 Target API (Production — via Gateway)

Gateway will normalize paths toward REST conventions defined in v1 PRD:

| Path prefix | Target Service |
|-------------|----------------|
| `/api/auth/*` | Auth Service |
| `/api/profile/*` | Profile Service |
| `/api/kyc/*` | KYC Service |
| `/api/documents/*` | Document Service |
| `/api/banking/*` | Banking Service |
| `/api/investments/*` | Investment Service |
| `/api/notifications/*` | Notification Service |
| `/api/audit/*` | Audit Service |

Additional planned endpoints: `GET /api/audit/:resourceType/:resourceId`, `PUT /api/notifications/:id/read`, `GET /api/admin/stats`, `POST /api/documents/upload`.

---

## 8. Inter-Service Communication

### 8.1 Current (Synchronous, In-Process)

Modules communicate via direct function imports (e.g., `notifyUser()`, `audit()`, `debitForInvestment()`). No network hop between domains within the monolith.

### 8.2 Target (HTTP + Kafka)

#### Synchronous (HTTP/REST via Gateway)

```
Gateway ──> Auth Service       (JWT verification)
        ──> Profile Service    (profile CRUD)
        ──> KYC Service        (KYC CRUD)
        ──> Document Service   (upload/view)
        ──> Banking Service    (accounts, transfers)
        ──> Investment Service (portfolio, orders)
        ──> Notification Svc   (fetch notifications)
        ──> Audit Service      (read audit trail)
```

#### Asynchronous (Apache Kafka — planned)

```
KYC Service    ──(kyc.submitted)  ──> Kafka ──> Audit Service
                                              ──> Notification Service
Admin/KYC Svc  ──(kyc.approved)  ──> Kafka ──> Notification Service
Admin/KYC Svc  ──(kyc.rejected)  ──> Kafka ──> Notification Service
Banking Svc    ──(bank.verified) ──> Kafka ──> Audit Service (planned)
Investment Svc ──(order.placed)  ──> Kafka ──> Notification Service (planned)
```

#### Event Payload Schema

```json
{
  "eventType": "kyc.approved",
  "source": "kyc-service",
  "timestamp": "2026-06-26T10:30:00Z",
  "data": {
    "kycId": "ObjectId",
    "userId": "ObjectId",
    "adminId": "ObjectId",
    "remarks": "Documents verified successfully"
  }
}
```

---

## 9. Technology Stack Summary

See `TECH-STACK.md` for full detail. Highlights:

| Layer | Current | Production Target |
|-------|---------|-------------------|
| Frontend | Next.js 16, TanStack Query, AuthContext, shadcn/ui, Tailwind 4 | Same + optional Redux for complex global state |
| Backend | Express 5 modular monolith | Express microservices per domain |
| Document DB | MongoDB + Mongoose | MongoDB (per-service databases) |
| Relational DB | PostgreSQL + Prisma (banking) | PostgreSQL (banking service) |
| File storage | Local disk (interim) | AWS S3 / MinIO |
| Messaging | In-process calls | Apache Kafka (kafkajs) |
| OCR | Tesseract.js + OpenRouter | Tesseract.js (+ optional LLM) |
| OTP | Twilio-compatible + dev fallback | Twilio / dev OTP |
| Packaging | pnpm workspace | Docker + Docker Compose |

---

## 10. Project Structure

### 10.1 Current Repository Layout

```
KYC_ONBOARDING-Page/
├── backend/
│   ├── prisma/                    # PostgreSQL schema, migrations, seed
│   └── src/
│       ├── auth/                  # Admin seed scripts
│       ├── banking/               # Banking module (Prisma)
│       ├── config/                # env, db
│       ├── controllers/           # Auth, profile controllers
│       ├── investments/           # Investment routes + logic
│       ├── kyc/                   # KYC, OCR, notifications, audit helpers
│       ├── middleware/            # auth, validate, sanitize, errorHandler
│       ├── models/                # Mongoose models
│       ├── routes/                # auth, profile routes
│       ├── schemas/               # Zod schemas
│       ├── services/              # OTP service
│       ├── utils/                 # JWT helpers
│       ├── app.js
│       └── server.js
├── frontend/
│   └── src/
│       ├── app/                   # Next.js App Router pages
│       │   ├── (auth)/            # signin, signup, admin/login
│       │   ├── (platform)/        # dashboard, kyc, banking, profile, stocks
│       │   └── admin/             # dashboard, kyc, amc
│       ├── components/ui/         # shadcn/ui
│       ├── features/              # auth, banking, dashboard, investments, kyc, admin, layout, notifications, profile
│       ├── lib/                   # api client, utils, supabase stubs
│       ├── providers/             # app providers (Query, Theme, Auth)
│       └── hooks/
├── DOCS/                          # Planning doc copies
├── PRD.md
├── IMPLEMENTATION-PLAN.md
├── TECH-STACK.md
├── result.md                      # Architectural audit
├── pnpm-workspace.yaml
└── package.json
```

### 10.2 Target Production Layout

```
finboard-platform/
├── api-gateway/
├── services/
│   ├── auth-service/
│   ├── profile-service/
│   ├── kyc-service/
│   ├── document-service/
│   ├── banking-service/
│   ├── investment-service/
│   ├── notification-service/
│   └── audit-service/
├── frontend/
├── docker-compose.yml
└── init-kafka-topics.sh
```

Migration preserves existing module code by **extracting** folders from `backend/src/` into standalone services without rewriting business logic.

---

## 11. Security Considerations

| Concern | Current Mitigation | Production Target |
|---------|-------------------|-------------------|
| JWT security | 7d expiry, Bearer header | Same + refresh token (optional) |
| Password storage | bcryptjs, 12 salt rounds | Same |
| Document access | Static `/uploads` (demo) | Pre-signed S3 URLs, 5-min expiry |
| Admin routes | Role-based middleware | Same, enforced at gateway + service |
| Rate limiting | 100 req / 15 min on monolith | 100 req/min at gateway |
| Input validation | Zod on POST/PATCH/PUT | Same per service |
| CORS | Whitelist `CLIENT_ORIGIN` | Same |
| Helmet | Security headers enabled | Same at gateway |
| Secrets | Environment variables only | Same + secret manager in prod |

---

## 12. Deployment

### 12.1 Current (Development)

```bash
pnpm install
pnpm run dev          # backend :4000 + frontend :3000
```

Requires MongoDB (`MONGODB_URI`) and optionally PostgreSQL (`BANK_DATABASE_URL` for banking).

### 12.2 Target (Docker Compose)

```yaml
services:
  api-gateway:        # port 4000
  auth-service:       # port 4001
  profile-service:    # port 4002
  kyc-service:        # port 4003
  document-service:   # port 4004
  banking-service:    # port 4005
  investment-service: # port 4006
  notification-svc:   # port 4007
  audit-service:      # port 4008
  mongodb:            # port 27017
  postgresql:         # port 5432
  kafka:              # port 9092
  minio:              # ports 9000, 9001
  frontend:           # port 3000
```

*Planned for future implementation.*

---

## 13. Success Metrics

| Metric | Target |
|--------|--------|
| KYC submission success rate | > 95% |
| OCR accuracy for PAN | > 90% |
| Admin review time per KYC | < 2 min |
| End-to-end onboarding (signup → KYC approved → first investment) | < 15 min (demo) |
| System availability (production) | > 99.5% |
| Bank verification refund completion | < 24 hours (demo: minutes) |

---

## 14. Future Scope (Post-Microservices)

- Video KYC (VideoKYC per SEBI guidelines)
- UPI-based identity verification
- FATCA/CRS declaration management
- SIP auto-debit scheduling (cron + Kafka)
- WhatsApp / Telegram notification channels
- Kubernetes deployment with Helm charts
- Phone OTP via Twilio with local dev fallback
- Full audit and notification Kafka pipeline

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-06-21 | Initial KYC-only microservices PRD |
| 2.0 | 2026-06-26 | Expanded scope (banking, investments, AMC); two-stage architecture; aligned with modular monolith MVP and production microservices roadmap |

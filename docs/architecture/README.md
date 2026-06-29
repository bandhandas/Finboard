# Finboard Monorepo Architecture

Industry-standard layout for a financial platform microservices monorepo.

```
finboard/
├── apps/                    # Frontend applications
│   ├── customer-web/        # Main Next.js app (auth, KYC, banking, investments)
│   ├── admin-web/           # Admin dashboard (planned)
│   └── landing/             # Marketing site (planned)
├── services/                # Backend microservices (same internal layout each)
├── packages/                # Shared libraries
├── infrastructure/          # Docker, K8s, scripts
└── docs/                    # Architecture, API, flows
```

## Service internal layout

Every service follows:

```
service-name/
├── src/
│   ├── app.js               # Express composition
│   ├── server.js            # Bootstrap entry
│   ├── config/
│   ├── bootstrap/           # Local handler registration
│   ├── common/              # Service-local middleware/helpers
│   ├── infrastructure/    # DB, cache, providers
│   └── modules/{domain}/
│       ├── controllers/
│       ├── services/
│       ├── repositories/
│       ├── models/
│       ├── routes/
│       ├── validators/
│       └── index.js
├── tests/
├── Dockerfile
└── package.json
```

## Service map

| Service | Port | Domain |
|---------|------|--------|
| api-gateway | 4000 | Routing |
| auth-service | 4001 | Users, OTP, JWT |
| profile-service | 4002 | User profiles |
| kyc-service | 4003 | KYC applications |
| ocr-service | 4004 | Document OCR (decoupled) |
| banking-service | 4005 | Accounts, transfers |
| investment-service | 4006 | Buy, SIP orders |
| notification-service | 4007 | In-app notifications |
| audit-service | 4008 | Audit logs |
| identity-service | 4009 | Seeded identity verification |
| portfolio-service | 4011 | Holdings |

## Inter-service calls

All cross-domain communication uses `@finboard/contracts` HTTP clients with `x-service-key`.

## Run

```bash
cp .env.example .env
pnpm install
pnpm dev
```

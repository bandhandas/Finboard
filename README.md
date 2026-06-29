# Finboard KYC Onboarding Platform

Finboard is a full-stack fintech simulation for authentication, profile completion, KYC review, dummy core banking, and stock investment flows. It is built for demo and learning purposes only. It does not connect to real banks, UPI, brokers, exchanges, or payment gateways.

## Features

- React/Vite frontend with a Groww-inspired dark investment dashboard.
- Node.js/Express backend with JWT authentication.
- MongoDB for authentication, user profile, KYC, admin users, notifications, and investment holdings.
- PostgreSQL/Supabase with Prisma for isolated dummy banking data.
- Twilio-compatible OTP flow with local alert OTP fallback for easy demo testing.
- Bank verification simulation with Rs. 2 debit and automatic refund.
- KYC submission with PAN/Aadhaar manual fields, document upload, OCR hooks, and admin review.
- Admin dashboard for reviewing users, uploaded documents, OCR output, KYC status, and approval/rejection.
- RTA and AMC admin role simulation with seeded logins.
- Stock and mutual fund marketplace with search, paginated listings, detail pages, buy flow, SIP flow, holdings, orders, and portfolio value.

## Project Structure

```text
.
├── apps/customer-web/          # Next.js frontend
├── services/                   # Microservices (auth, kyc, banking, …)
├── packages/                   # shared, contracts, config, …
├── infrastructure/             # storage, scripts, docker (planned)
├── docs/
└── .env.example
```

See `docs/architecture/README.md` for the full service map.

## Tech Stack

- Frontend: React, Vite, React Router, TanStack Query, Axios, Recharts, Lucide icons.
- Backend: Node.js, Express, JWT, bcrypt, Zod, Multer, Mongoose.
- Auth database: MongoDB Atlas or local MongoDB.
- Banking database: PostgreSQL on Supabase, accessed through Prisma.
- OTP: Backend-generated OTP with optional Twilio SMS delivery.
- OCR/KYC hooks: Tesseract.js local OCR and OpenRouter-compatible structured extraction.

## Prerequisites

- Node.js 20 or newer.
- npm.
- MongoDB Atlas database or local MongoDB.
- Supabase PostgreSQL project for the banking module.
- Optional Twilio account if you want SMS delivery.
- Optional OpenRouter key for structured OCR extraction. Tesseract.js runs locally.

## First-Time Setup

Install all dependencies:

```bash
npm install
npm run install:all
```

Create environment files:

```bash
cp .env.example .env
cp apps/customer-web/.env.example apps/customer-web/.env
```

Fill the values in `.env` and `apps/customer-web/.env`.

## Environment Variables

### Backend

Use the repo root `.env` (see `.env.example`). API traffic goes through the gateway at `:4000`.

Twilio/demo OTP:

```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_API_KEY_SID=
TWILIO_API_KEY_SECRET=
TWILIO_VERIFY_SERVICE_SID=
TWILIO_FROM_PHONE=
TWILIO_MESSAGING_SERVICE_SID=
TWILIO_OTP_TTL_MINUTES=5
TWILIO_DEV_OTP=123456
TWILIO_SHOW_OTP_IN_RESPONSE=true
```

KYC OCR:

```env
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-4o-mini
```

Phone OTP uses Twilio in production and the dev fallback (`TWILIO_DEV_OTP=123456`) locally.

### Frontend

```env
VITE_API_URL=http://localhost:4000/api
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

The frontend does not connect directly to the database for app flows. All business actions go through the Node backend.

## Database Setup

### MongoDB

MongoDB stores:

- Users and passwords.
- JWT-backed auth data.
- User profile details.
- KYC submissions.
- Dummy PAN/Aadhaar identity records.
- App notifications.
- Investment holdings and orders.
- Admin users.

For MongoDB Compass, use only one valid URI. Do not prepend `mongodb://localhost:27017` before an Atlas URI.

Correct Atlas format:

```text
mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
```

If the password contains special characters, percent-encode them.

### PostgreSQL/Supabase Banking DB

PostgreSQL stores only banking data:

- Seeded bank accounts.
- Bank verification records.
- Beneficiaries.
- Bank transactions.
- Ledger entries.
- Banking notifications.

Run Prisma commands from the project root:

```bash
npm run prisma:generate --prefix backend
npm run prisma:migrate --prefix backend
npm run prisma:seed --prefix backend
```

The seed creates one admin bank account and ten dummy customer accounts.

## Seed Data

Seed KYC dummy identities:

```bash
npm run seed:kyc --prefix backend
```

Seed admin users:

```bash
npm run seed:admin --prefix backend
```

Default admin accounts:

```text
Email: admin@finboard.local
Password: Admin@12345

Email: ops.admin@finboard.local
Password: OpsAdmin@12345

Email: rta.admin@finboard.local
Password: RtaAdmin@12345
Role: RTA Admin

Email: amc.admin@finboard.local
Password: AmcAdmin@12345
Role: AMC Admin
```

Change these before using the project outside local demo mode.

## Running the App

Run backend and frontend together:

```bash
npm run dev
```

Run separately:

```bash
npm run dev:backend
npm run dev:frontend
```

Default URLs:

```text
Backend:  http://localhost:4000
Frontend: http://localhost:5173
```

If Vite starts on `5174`, keep that origin in `CLIENT_ORIGIN`.

## Main User Flow

1. Open the frontend.
2. Sign up with name, email, phone, password.
3. Click `Send OTP`.
4. The backend generates an OTP, stores a hash, optionally sends SMS with Twilio, and returns the OTP in development.
5. The frontend shows the OTP in an alert box and auto-fills it.
6. Click `Verify`.
7. Complete bank details using one seeded dummy bank account.
8. The backend verifies the account against PostgreSQL, debits Rs. 2, and refunds it automatically after a short demo delay.
9. Complete KYC by entering PAN/Aadhaar details and uploading documents.
10. Admin reviews and approves/rejects KYC.
11. After KYC approval and bank verification, user can buy simulated stocks.

## OTP Behavior

The current OTP flow is demo-friendly:

- Backend generates the OTP.
- Backend stores only the hash and expiry.
- Frontend displays the OTP in an alert when `TWILIO_SHOW_OTP_IN_RESPONSE=true`.
- Twilio SMS is attempted if sender configuration is available.
- If Twilio trial restrictions block SMS, the alert OTP still works.

Useful endpoints:

```text
POST /api/auth/send-otp
POST /api/auth/verify-otp
POST /api/auth/signup
POST /api/auth/email-login
```

PowerShell test:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:4000/api/auth/send-otp" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"user@finboard.local"}'
```

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:4000/api/auth/verify-otp" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"user@finboard.local","otp":"123456"}'
```

## KYC Flow

User KYC includes:

- Full name.
- PAN number.
- Aadhaar number.
- PAN card upload.
- Aadhaar card upload.

The backend checks whether the entered PAN/Aadhaar/name exists in the dummy identity dataset. Uploaded PAN and Aadhaar images are read with Tesseract.js, then the raw OCR text is sent to OpenRouter to extract clean name, PAN number, and Aadhaar number fields. Raw OCR text and structured extracted values are stored with the KYC application and shown in the admin dashboard. The admin can approve or reject the submission after reviewing user-entered values, database values, OCR values, and uploaded documents.

KYC routes:

```text
POST /api/kyc/submit
GET  /api/kyc/status
GET  /api/kyc/admin/applications
PATCH /api/kyc/admin/applications/:id/review
```

## Banking Flow

Banking is intentionally isolated in PostgreSQL. It simulates a core banking system and does not use real bank APIs.

User can:

- Verify bank account details.
- View linked account and balance.
- Send money to seeded accounts.
- View transaction history.
- View banking notifications.

Bank verification:

1. User enters account holder name, account number, and IFSC.
2. Backend checks the seeded PostgreSQL bank accounts.
3. If found, Rs. 2 is debited as a verification debit.
4. A notification is created.
5. Refund job credits Rs. 2 back after the demo delay.

## Investment Flow

Investment simulation includes:

- Stock and mutual fund marketplace dashboard.
- Searchable instruments.
- Paginated stock and fund lists.
- Stock and fund detail pages with history, performance, facts, and order panel.
- Stock buy panel.
- Mutual fund lump-sum order panel.
- SIP creation with monthly amount, SIP date, folio number, and next debit date.
- Portfolio and holdings.
- Orders/transactions.

Buying a stock requires:

- User is authenticated.
- Bank account is verified.
- KYC status is approved.
- Bank balance is sufficient.

When a buy succeeds:

- Money is deducted from the linked dummy bank account.
- Stock orders route toward a simulated listed-company treasury account.
- Mutual fund and SIP orders route toward a simulated AMC collection account.
- Holding/order is stored in MongoDB.
- Portfolio value updates.
- Notification is created.

AMC admin can review fund and SIP orders and update order status.

## Admin Dashboard

Admin login:

```text
http://localhost:5173/signin
```

Use an admin account. Admin users are redirected to:

```text
/admin/dashboard
```

Admin login includes a role selector:

- RTA Admin: KYC, OCR review, investor record management.
- AMC Admin: fund order book, SIP book, AUM, scheme analytics.
- Super Admin: can access both admin modules.

RTA dashboard includes:

- Admin profile summary.
- User/KYC application list.
- Pending, approved, rejected, failed status.
- Review panel.
- Uploaded PAN/Aadhaar document preview links.
- OCR extracted text.
- Approve/reject actions.

AMC dashboard includes:

- Total AUM.
- Monthly SIP book.
- Investor count.
- Pending fund orders.
- Mutual fund and SIP order review.
- Investor stock activity visibility.

## Useful Scripts

Root:

```bash
npm run install:all
npm run dev
npm run dev:backend
npm run dev:frontend
```

Backend:

```bash
npm run check --prefix backend
npm run prisma:generate --prefix backend
npm run prisma:migrate --prefix backend
npm run prisma:seed --prefix backend
npm run seed:kyc --prefix backend
npm run seed:admin --prefix backend
```

Frontend:

```bash
npm run build --prefix frontend
npm run preview --prefix frontend
```

## Troubleshooting

### Request failed with status code 429

The backend rate limiter was hit. For local demo mode, use:

```env
RATE_LIMIT_MAX=5000
RATE_LIMIT_WINDOW_MS=900000
```

Restart the backend after changing this because old counters live inside the running process.

### CORS error from `127.0.0.1` or port `5174`

Add the exact frontend origin to `CLIENT_ORIGIN`:

```env
CLIENT_ORIGIN=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174
```

Restart the backend.

### MongoDB Compass says password has unescaped characters

Use only one connection string and percent-encode special characters. Do not combine local and Atlas URIs.

### MongoDB connection fails

Check:

- Atlas database user exists.
- Password is correct.
- Current IP is allowed in Atlas Network Access.
- Database URI has the database name.

### Prisma P1017 or connection reset

Supabase may close idle connections. The app handles common reset cases in the refund job, but if commands fail:

- Check `BANK_DATABASE_URL`.
- Ensure `sslmode=require`.
- Re-run `npm run prisma:generate --prefix backend`.
- Restart backend.

### Twilio SMS does not arrive

Twilio trial accounts usually send only to verified phone numbers. This app still works because backend returns the generated OTP in development and the frontend shows it in an alert.

### KYC submit says failed

For the demo dataset, entered name, PAN, and Aadhaar must match a seeded dummy identity. Run:

```bash
npm run seed:kyc --prefix backend
```

Then submit values from the seeded records.

## Verification

Before presenting the demo:

```bash
npm run check --prefix backend
npm run build --prefix frontend
```

Both commands should complete successfully.

## Security Notes

This is a simulation project. Do not commit real secrets, private keys, database passwords, Twilio tokens, or API keys. Rotate any credentials that were shared publicly or stored in screenshots. In production, never return OTP values to the frontend.

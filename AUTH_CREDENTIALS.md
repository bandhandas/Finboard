# Finboard — Auth Credentials (Local Development)

> **Local dev only.** Do not use these values in production. Do not commit real secrets.
> Seed users: `pnpm seed:admin`

---

## App URLs

| App | URL |
|-----|-----|
| Customer web (sign in) | http://localhost:3000/signin |
| API gateway | http://localhost:4000 |
| Auth service | http://localhost:4001 |

---

## Environment secrets (from `.env`)

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | `mongodb://root:rootpassword@127.0.0.1:27017/kyc-auth-db?authSource=admin` |
| `JWT_SECRET` | `finboard-local-dev-jwt-secret-min-32-chars` |
| `JWT_EXPIRES_IN` | `7d` |
| `BCRYPT_SALT_ROUNDS` | `12` |
| `INTERNAL_SERVICE_KEY` | `dev-internal-key` |

---

## Email OTP (Resend)

Verification and password-reset codes are delivered by **Resend** to the account email.

| Variable | Value |
|----------|-------|
| `RESEND_API_KEY` | Your Resend API key |
| `RESEND_FROM` | `Finboard <onboarding@resend.dev>` (or your verified domain) |
| `OTP_TTL_MINUTES` | `5` |
| `PASSWORD_RESET_OTP_TTL_MINUTES` | `10` |

When Resend is not configured locally, OTPs log to the auth-service console:
- Signup / login OTP: `[DEV] Email OTP for user@...`
- Password reset: `[DEV] Password reset OTP for user@...`

---

## Seeded admin accounts

| Name | Email | Password | Phone | Role |
|------|-------|----------|-------|------|
| KYC Review Admin | `admin@finboard.local` | `Admin@12345` | `+910000000001` | `admin` |
| Operations Admin | `ops.admin@finboard.local` | `OpsAdmin@12345` | `+910000000002` | `admin` |
| RTA Investor Records Admin | `rta.admin@finboard.local` | `RtaAdmin@12345` | `+910000000003` | `rta_admin` |
| AMC Scheme Manager | `amc.admin@finboard.local` | `AmcAdmin@12345` | `+910000000004` | `amc_admin` |

Override any account via env vars: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN2_*`, `RTA_ADMIN_*`, `AMC_ADMIN_*`.

After admin login, the **top navbar** on every `/admin/*` page shows only the modules allowed for that JWT role (e.g. RTA sees KYC + Audit; platform admin sees all five links).

---

## Seeded demo customer accounts

| Name | Email | Password | Phone | PAN | Aadhaar | Role |
|------|-------|----------|-------|-----|---------|------|
| Rahul Sharma | `user@finboard.local` | `User@12345` | `+919876543210` | `ABCPS1234F` | `111222333445` | `user` |
| Priya Singh | `priya@finboard.local` | `User@12345` | `+919876543211` | `PQRPS6789K` | `222333444555` | `user` |
| Anurag Swarnakar | `anurag@finboard.local` | `User@12345` | `+919348404335` | `QMRPS6975K` | `634441264716` | `user` |

PAN and Aadhaar come from the KYC identity seed (`pnpm seed:kyc`). Name, PAN, and Aadhaar must match exactly when submitting KYC.

Anurag is in the KYC identity and banking seeds. Register at `/signup` if the auth account does not exist yet.

Override via: `DEMO_USER_*`, `DEMO_USER2_*`.

---

## Seeded bank accounts (dashboard verify-bank)

Seed with `pnpm seed:banking`. All accounts use **IFSC** `DEMO0000001` and bank **Finboard Demo Bank**.

> **Important:** `accountHolderName` must match the seeded **holder name exactly** (case-insensitive). A typo such as `Anurag Swarnaka` instead of `Anurag Swarnakar` returns `Invalid bank account details`.

### Customer app users (sign in → verify on dashboard)

| Auth email | Account holder (use exactly) | Account number | Seeded balance | Bank seed email |
|------------|------------------------------|----------------|----------------|-----------------|
| `user@finboard.local` | Rahul Sharma | `100000000002` | ₹15,000.00 | `rahul.sharma@testbank.local` |
| `priya@finboard.local` | Priya Singh | `100000000003` | ₹9,500.00 | `priya.singh@testbank.local` |
| `anurag@finboard.local` | Anurag Swarnakar | `100000000012` | ₹20,000.00 | `anurag@finboard.local` |

**Verify-bank payload example (Rahul):**

```json
{
  "accountHolderName": "Rahul Sharma",
  "accountNumber": "100000000002",
  "ifsc": "DEMO0000001"
}
```

Verification debits **₹2** (refunded automatically in the demo flow).

### Banking admin (API only — not a Finboard auth login)

| Account holder | Email | Account number | Seeded balance | Role |
|----------------|-------|----------------|----------------|------|
| Demo Bank Admin | `admin@demobank.test` | `100000000001` | ₹10,00,000.00 | `ADMIN` |

Use a platform admin JWT (`admin@finboard.local`) for `/api/banking/admin/*`, not this email.

### Extra demo bank accounts (transfers / beneficiaries)

These exist in the banking DB for peer transfers. They are **not** linked to Finboard auth logins.

| Account holder | Email | Phone | Account number | Seeded balance |
|----------------|-------|-------|----------------|----------------|
| Aarav Mehta | `aarav.mehta@testbank.local` | `+919000000004` | `100000000004` | ₹22,000.00 |
| Neha Kapoor | `neha.kapoor@testbank.local` | `+919000000005` | `100000000005` | ₹18,450.00 |
| Vikram Rao | `vikram.rao@testbank.local` | `+919000000006` | `100000000006` | ₹31,200.00 |
| Ananya Das | `ananya.das@testbank.local` | `+919000000007` | `100000000007` | ₹12,750.00 |
| Kabir Khan | `kabir.khan@testbank.local` | `+919000000008` | `100000000008` | ₹40,000.00 |
| Meera Iyer | `meera.iyer@testbank.local` | `+919000000009` | `100000000009` | ₹7,600.00 |
| Rohan Verma | `rohan.verma@testbank.local` | `+919000000010` | `100000000010` | ₹25,800.00 |
| Isha Nair | `isha.nair@testbank.local` | `+919000000011` | `100000000011` | ₹11,000.00 |

---

## Banking API access (by seeded account)

Use these logins when testing `/api/banking/*` in Swagger (`http://localhost:4000/docs`) or Postman.

| Account | Email | Bank account | JWT `role` | Customer `/api/banking/*` | Admin `/api/banking/admin/*` |
|---------|-------|--------------|------------|---------------------------|------------------------------|
| Rahul Sharma | user@finboard.local | `100000000002` | `user` | Yes | No |
| Priya Singh | priya@finboard.local | `100000000003` | `user` | Yes | No |
| Anurag Swarnakar | anurag@finboard.local | `100000000012` | `user` | Yes | No |
| KYC Review Admin | admin@finboard.local | — | `admin` | No | Yes |
| Operations Admin | ops.admin@finboard.local | — | `admin` | No | Yes |
| RTA Records Admin | rta.admin@finboard.local | — | `rta_admin` | No | No |
| AMC Scheme Manager | amc.admin@finboard.local | — | `amc_admin` | No | No |
| Demo Bank Admin | admin@demobank.test | `100000000001` | — | No | Yes (via admin JWT) |

**Example:** Sign in as `user@finboard.local`, call `GET /api/banking/demo-accounts` → 200. Sign in as `admin@finboard.local`, same endpoint → 403.

---

## Audit trail (in-app)

View KYC compliance history at **http://localhost:3000/admin/audit** after admin login.

| Account | Can view audit? |
|---------|-----------------|
| `admin@finboard.local` | Yes |
| `rta.admin@finboard.local` | Yes |
| `ops.admin@finboard.local` | Yes |
| `amc.admin@finboard.local` | No |
| Retail users (`user@`, `priya@`, `anurag@`) | No |

API: `GET /api/audit/kyc/{kycApplicationId}` with admin or RTA JWT.

---

## Quick sign-in

**Customer app — Rahul Sharma**

```
Email:              user@finboard.local
Password:           User@12345
Phone:              +919876543210
PAN:                ABCPS1234F
Aadhaar:            111222333445
Bank holder name:   Rahul Sharma
Bank account:       100000000002
IFSC:               DEMO0000001
```

**Customer app — Priya Singh**

```
Email:              priya@finboard.local
Password:           User@12345
Phone:              +919876543211
PAN:                PQRPS6789K
Aadhaar:            222333444555
Bank holder name:   Priya Singh
Bank account:       100000000003
IFSC:               DEMO0000001
```

**Customer app — Anurag Swarnakar**

```
Email:              anurag@finboard.local
Password:           User@12345
Phone:              +919348404335
PAN:                QMRPS6975K
Aadhaar:            634441264716
Bank holder name:   Anurag Swarnakar
Bank account:       100000000012
IFSC:               DEMO0000001
```

**Admin (KYC review)**

```
Email:    admin@finboard.local
Password: Admin@12345
```

**RTA admin**

```
Email:    rta.admin@finboard.local
Password: RtaAdmin@12345
```

**AMC admin**

```
Email:    amc.admin@finboard.local
Password: AmcAdmin@12345
```

---

## Reseed auth users

```bash
pnpm seed:admin
```

## Reseed KYC identities (PAN / Aadhaar)

```bash
pnpm seed:kyc
```

## Reseed bank accounts

```bash
pnpm seed:banking
```

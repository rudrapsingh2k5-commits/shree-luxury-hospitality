# SHREE श्री — Luxury Hospitality Management System

> Production-grade full-stack hospitality web application engineered for luxury Indian heritage properties, atomic room inventory protection, authentic role-based access control, and Stripe payment processing with automated INR-to-GBP (£) currency conversion.

---

## 1. Executive Summary & Hospitality Architecture

**SHREE श्री** ("Prosperity and Auspicious Hospitality") is an enterprise-caliber hotel management system uniting luxury hospitality with rigorous application security standards:
- **Design System:** Warm Ivory (`#FBF9F5`), Royal Maroon (`#6E1A24`), Heritage Forest Green (`#1A3026`), and Pitambari Antique Gold (`#C59B27`, `#D4AF37`) with editorial serif typography and zero bloated frameworks.
- **Atomic Concurrency Protection:** Unique compound slot reservation model (`RoomNightAllocation`) mathematically guaranteeing zero overbooking across concurrent reservations.
- **Authentic Authentication & Authorization:** Real email/password sign-in, bcrypt password hashing, single-use SHA256 hashed verification tokens, password reset flows with expiration, and strict server-side RBAC.
- **Zero Startup Seeding:** No automatic database collection wiping and zero demo credentials hardcoded into the platform.
- **Trusted Administrator Provisioning:** Controlled, documented CLI mechanism for creating the initial platform administrator without hardcoded passwords or startup mutations.

---

## 2. Technology Stack

### Frontend
- **Framework:** React 19 with Vite 6
- **Routing:** React Router v7 with real `ProtectedRoute` route guards
- **Styling:** Custom Vanilla CSS Design System with accessible focus states, responsive layouts, and luxury design tokens
- **Icons:** Lucide React
- **API Client:** Axios with JWT request/response interceptors & global session error handling
- **Charts:** Recharts for platform revenue, ADR, and occupancy metrics backed by real database records

### Backend
- **Runtime:** Node.js (ES Modules `type: module`)
- **Web Framework:** Express.js 4.x
- **Database:** MongoDB with Mongoose ODM (includes embedded `mongodb-memory-server` fallback for local evaluation)
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs salted password hashing
- **Security:** Helmet HTTP headers, CORS origin whitelisting, Express-Rate-Limit, timing-safe cryptographic comparisons, and CSV formula injection neutralization
- **Payment Gateway:** Stripe Node SDK with PaymentIntents, automated INR (₹) to GBP (£) currency conversion, non-production sandbox simulator, and idempotent webhook processing
- **Testing:** Node.js native test runner (`node --test`) and Supertest (58 automated unit, integration, concurrency, and security tests passing)

---

## 3. Prerequisites

- **Node.js:** v18.0.0 or later (v20+ recommended)
- **npm:** v9.0.0 or later (or pnpm)
- **MongoDB:** MongoDB Atlas replica-set URI or local MongoDB instance (optional for local dev; embedded engine is provided for zero-config testing)

---

## 4. Installation & Environment Setup

### 4.1 Clone & Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 4.2 Configure Environment Variables

Create `server/.env` based on `server/.env.example`:

```bash
cp server/.env.example server/.env
```

Review and configure the variables in `server/.env`:

```ini
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# MongoDB Connection String (Leave blank for embedded local engine during dev)
MONGODB_URI=

# JWT Authentication Secret (Minimum 32 characters in production)
JWT_SECRET=shree_super_secure_jwt_secret_key_2026_auspicious
JWT_EXPIRES_IN=7d

# Stripe Payment Gateway Credentials (GBP Billing with INR Website Pricing)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here
INR_TO_GBP_EXCHANGE_RATE=105.0

# Outbound Email (SMTP - Optional in local development)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="SHREE Concierge <concierge@shreehotels.com>"
```

---

## 5. First Administrator Provisioning

SHREE श्री does **not** automatically create default administrator accounts on server startup. To create your first platform administrator, execute the operator provisioning script:

### Interactive Provisioning:
```bash
npm run admin:create
```
You will be prompted to enter the administrator's email, a strong password (minimum 8 characters), and full name.

### Command-Line Flag Mode:
```bash
cd server
node src/scripts/createAdmin.js --email admin@shreehotels.com --password "StrongAdminPassword@2026" --name "Vikramaditya Singhania"
```

> **Security Note:** The script refuses to duplicate existing administrator accounts and prevents accidental overwrites of existing guest accounts without the explicit `--promote` flag. Passwords are never echoed or printed to stdout.

---

## 6. Running the Application Locally

You can run the frontend and backend servers together or independently:

### Option A: Run Both Servers Simultaneously
```bash
# Terminal 1: Start Backend API
npm run dev:server

# Terminal 2: Start Client Dev Server
npm run dev:client
```

### Option B: Production Build & Unified Serving
When built, the Express backend automatically serves the production frontend distribution bundle:

```bash
# Build the client
npm run build:client

# Start the unified server
npm run start
```
The application will be live at: `http://localhost:5001`

---

## 7. Running Automated Tests

SHREE श्री includes an extensive suite of 58 automated unit, integration, authorization, concurrency, and security tests:

```bash
# Run all test suites
npm run test:server

# Or directly in server directory:
cd server && npm test
```

### Covered Test Categories:
1. **Authentication Tests:** Valid login, invalid password rejection, non-existent email enumeration prevention, protected route enforcement, session logout, deactivated account rejection, single-use password reset token invalidation, and single-use email verification.
2. **Authorization & RBAC Tests:** Horizontal guest IDOR protection, staff cross-property isolation, public registration privilege-escalation prevention, and administrator-only endpoint restrictions.
3. **Database & Seeding Safety Tests:** Verifying server startup never drops collections or creates fake users, verifying CLI admin provisioning idempotency, and validating production guardrails.
4. **Payment & Concurrency Tests:** Atomic slot allocation preventing simultaneous double-booking under load, Stripe PaymentIntent creation with exact INR-to-GBP conversion, and idempotent webhook handling.

---

## 8. Role-Based Access Control Matrix

| Role | Permitted Routes & Capabilities |
| :--- | :--- |
| **Guest** | Explore properties (`/stays`), view hotel details (`/hotel/:slug`), create reservations, manage personal bookings and service requests (`/dashboard`), submit stay reviews. |
| **Staff** | Property front-desk portal (`/staff`), check-in / check-out guests, room inspection matrix, housekeeping task updates, concierge service request processing. Strictly isolated to assigned property. |
| **Administrator** | Full platform management (`/admin`), cross-property revenue analytics, user role updates, hotel catalog configuration, bookings CSV export with formula-injection defense, system audit logs. |

---

## 9. Troubleshooting & FAQ

### 1. `JWT_SECRET is required in production`
**Cause:** In `NODE_ENV=production`, the server enforces a strong secret of at least 32 characters.  
**Fix:** Generate a cryptographic secret (e.g. `openssl rand -hex 32`) and update `JWT_SECRET` in your server environment.

### 2. `Verification email not received in development`
**Cause:** In local development without configured SMTP credentials, outbound email delivery is safely bypassed.  
**Fix:** The server logs the generated verification/reset URL directly to the server terminal. To enable real email dispatch, supply `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` in `server/.env`.

### 3. `403 Forbidden: Cross-property access restricted`
**Cause:** Staff accounts are strictly scoped to their assigned hotel property.  
**Fix:** A platform administrator can view and reassign staff hotel affiliations from the Executive Console (`/admin` → Users tab).

---

## 10. License

Proprietary — Developed for SHREE श्री Luxury Hospitality. All rights reserved.

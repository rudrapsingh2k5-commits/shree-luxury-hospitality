# SHREE श्री — Security, Architecture & UI/UX Technical Documentation

**Platform:** SHREE श्री Luxury Hospitality Management System  
**Stack:** React 19 + Vite 6 (Frontend), Node.js + Express (Backend), MongoDB + Mongoose (Database), JWT Authentication, Stripe Integration  
**Author:** Senior Full-Stack, Application Security, UI/UX & QA Engineer  
**Status:** Complete & Fully Verified  

---

## 1. Authentication Architecture

### 1.1 Token & Session Strategy
- **JWT (JSON Web Token):** Cryptographically signed using HMAC-SHA256 with strong secret validation via `validateEnv()`. In production, startup aborts immediately if `JWT_SECRET` is less than 32 characters or matches insecure development placeholders.
- **Short/Standard Expiration:** Default expiration is configured via `JWT_EXPIRES_IN` (configurable from 1h to 7d).
- **Payload Sanitization:** Payload includes only non-sensitive claims: `{ id, name, email, role, assignedHotelId }`. Password hashes and single-use security tokens are strictly excluded.
- **Client Synchronization:** The frontend Axios instance in `client/src/services/api.js` attaches `Authorization: Bearer <token>` automatically and intercepts `401 Unauthorized` responses to clear invalid sessions and redirect to `/login`.

### 1.2 Password Security
- **Bcrypt Hashing:** User passwords are encrypted with bcrypt using salt work factor of 10 (`bcrypt.genSalt(10)`).
- **Pre-Save Encryption:** Mongoose `pre('save')` hook only re-hashes when `password` has been modified, preventing double-hashing on profile or role updates.
- **Password Obfuscation in Responses:** `User.prototype.toJSON` unconditionally deletes `password`, `emailVerificationToken`, `emailVerificationExpires`, `passwordResetToken`, and `passwordResetExpires`.
- **Enumeration Defense:** `login`, `forgotPassword`, and `register` endpoints do not leak whether an account exists or provide distinct timing signatures for invalid usernames vs passwords.

### 1.3 Email Verification Architecture
- **Single-Use Cryptographic Tokens:** Generated using `crypto.randomBytes(32).toString('hex')`.
- **Hash-at-Rest Storage:** Only the SHA256 digest (`crypto.createHash('sha256').update(token).digest('hex')`) is persisted in the database; raw tokens are never saved.
- **24-Hour Expiration:** Stored with an explicit `emailVerificationExpires` date.
- **Atomic Single-Use Invalidation:** Upon successful validation, `isEmailVerified` is set to `true`, and both `emailVerificationToken` and `emailVerificationExpires` are unset (`undefined`). Subsequent attempts to reuse the same token fail with `400 Bad Request`.
- **Safe SMTP Dispatch:** Evaluates `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS`. If SMTP credentials are not configured, clear configuration warnings are logged on the server without pretending that delivery succeeded.

### 1.4 Secure Password Reset Flow
- **1-Hour Expiration Window:** Password reset tokens expire after 60 minutes.
- **Strict Role Preservation:** During password reset (`POST /api/auth/reset-password`), only `password` is modified; client-supplied inputs cannot alter `role`, `assignedHotelId`, or `isActive`.
- **Immediate Invalidation:** Reset tokens are wiped immediately upon password update.
- **Audit Logging:** Every password reset request and completion is recorded in the `AuditLog` collection with timestamp, IP address, and user ID.

---

## 2. Role and Permission Matrix (RBAC)

The system enforces strict least-privilege role boundaries on the server:

| Capability / Resource | Guest | Staff | Administrator | Endpoint & Enforcement |
|---|---|---|---|---|
| Public Stays & Room Discovery | Read-Only | Read-Only | Read-Only | `GET /api/hotels`, `GET /api/rooms` |
| Public Guest Registration | Allowed | Blocked (Admin only) | Blocked (CLI / Admin) | `POST /api/auth/register` (forces `role: 'guest'`) |
| Booking Creation (Self) | Allowed | Allowed | Allowed | `POST /api/bookings` |
| View Own Bookings & Folios | Allowed | Allowed | Allowed | `GET /api/bookings/my-bookings` |
| View Any Guest Booking (Cross-User) | **Blocked (403)** | Allowed (Assigned Hotel only) | Allowed (Global) | `GET /api/bookings/:reference` |
| Cancel Booking | Allowed (Own only) | Allowed (Assigned Hotel) | Allowed (Global) | `PUT /api/bookings/:id/cancel` |
| Process Guest Check-In & Check-Out | **Blocked (403)** | Allowed (Assigned Hotel only) | Allowed (Global) | `POST /api/staff/check-in`, `/check-out` |
| Housekeeping & Room Status Updates | **Blocked (403)** | Allowed (Assigned Hotel only) | Allowed (Global) | `PUT /api/staff/rooms/:id/status`, `/housekeeping/:id` |
| View Cross-Property Staff Data | **Blocked (403)** | **Blocked (403)** | Allowed (Global) | Scoped via `authorizeHotelStaff` middleware |
| View Financial Platform Analytics | **Blocked (403)** | **Blocked (403)** | Allowed (Global) | `GET /api/admin/analytics` |
| Export Bookings CSV | **Blocked (403)** | **Blocked (403)** | Allowed (Global) | `GET /api/admin/export-bookings-csv` |
| Manage User Roles & Permissions | **Blocked (403)** | **Blocked (403)** | Allowed (Global) | `PUT /api/admin/users/:userId` |
| Demote or Deactivate Self | **Blocked (403)** | **Blocked (403)** | **Blocked (400)** | Prevented in `updateUserRole` |
| View System Security Audit Logs | **Blocked (403)** | **Blocked (403)** | Allowed (Global) | `GET /api/admin/audit-logs` |

---

## 3. Account Provisioning Strategy

### 3.1 Initial Platform Administrator Provisioning
- **Zero Server Startup Auto-Creation:** The server never creates administrator accounts automatically on startup.
- **Dedicated CLI Script:** Administrators are provisioned via `server/src/scripts/createAdmin.js` (or `npm run admin:create`).
  ```bash
  # Interactive mode:
  node src/scripts/createAdmin.js

  # Non-interactive operator flag mode:
  node src/scripts/createAdmin.js --email admin@domain.com --password StrongPassword@2026 --name "General Manager"
  ```
- **Safety Invariants:**
  1. Validates minimum 8-character password length.
  2. Checks if an administrator with that email already exists; if found, preserves it safely without duplicating or modifying credentials.
  3. Refuses to overwrite non-admin accounts unless explicitly confirmed with `--promote`.
  4. Never prints passwords to terminal output.

### 3.2 Staff Provisioning
- Staff accounts cannot be registered publicly.
- Staff members are provisioned by an authenticated Platform Administrator through the Executive Console (`/admin` → Users tab).
- Each staff account must be assigned to an active hotel property ID (`assignedHotelId`), ensuring horizontal property-level isolation.

---

## 4. Database Safety Considerations

1. **Destructive Initialization Removed:** All automatic `deleteMany({})` and drop commands have been permanently detached from server startup.
2. **Production Seeding Guard:** `server/src/utils/seedData.js` contains an unbypassable production assertion:
   ```javascript
   if (process.env.NODE_ENV === 'production') {
     throw new Error('[Fatal Security Guard] Seeding fixtures and resetting collections is strictly prohibited in production.');
   }
   ```
3. **Compound Unique Inventory Allocation:** Overbooking race conditions are mathematically prevented by MongoDB compound index:
   ```javascript
   roomNightAllocationSchema.index({ roomTypeId: 1, date: 1, slot: 1 }, { unique: true });
   ```
   Concurrent booking attempts for the same inventory slot trigger an `E11000` duplicate key violation, cleanly converting into an HTTP `409 Conflict` without overselling.

---

## 5. UI/UX Design System Decisions

1. **Aesthetic Direction:**
   - **Background Palette:** Restrained warm ivory (`#FBF9F5`) and natural sandstone (`#F5EFEB`).
   - **Primary Palette:** Deep imperial forest green (`#1A3026`) and royal kumkum maroon (`#6E1A24`).
   - **Accent Accents:** Pitambari gold (`#D4AF37`) and antique brass (`#C59B27`) used with intentional restraint.
   - **Typography:** Editorial heading display font (`Cinzel` & `Playfair Display`), authentic Devanagari mark (`Noto Serif Devanagari`), and modern interface sans-serif (`Plus Jakarta Sans`).
2. **Elimination of Artificial AI Artifacts:**
   - No repetitive pill buttons or glowing neon borders.
   - No 1-click demo switcher cards or shortcut role selection.
   - Authentic empty states that reflect actual authorized data rather than invented figures.
3. **Usability & Accessibility:**
   - Real password visibility toggle on all sign-in, registration, and reset forms.
   - Accessible keyboard focus states (`outline: 2px solid var(--primary-forest)`).
   - Responsive layouts optimized for mobile (375px+), tablet (768px+), laptop (1024px+), and wide desktop displays.

---

## 6. Production Deployment Checklist

- [ ] Set `NODE_ENV=production`.
- [ ] Configure `MONGODB_URI` pointing to a managed MongoDB Atlas replica set (with connection pooling and TLS enabled).
- [ ] Generate high-entropy 64-character string for `JWT_SECRET` (`openssl rand -hex 32`).
- [ ] Configure production `CLIENT_URL` (e.g. `https://shreehotels.com`).
- [ ] Configure live Stripe API credentials (`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`).
- [ ] Configure outbound SMTP transactional email delivery credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`).
- [ ] Provision initial operator administrator using `npm run admin:create`.
- [ ] Verify HTTPS termination with valid SSL certificates.
- [ ] Ensure `.env` is excluded from source control.

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import request from 'supertest';
import dotenv from 'dotenv';
dotenv.config();

import app from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User, Hotel, RoomType, Booking, AuditLog } from '../models/index.js';
import { provisionAdministrator } from '../scripts/createAdmin.js';
import { seedDatabase } from '../utils/seedData.js';
import jwt from 'jsonwebtoken';

describe('Comprehensive Authentication, Role Authorization & Provisioning Suite', { concurrency: false }, () => {
  let testAdminEmail = 'lead.admin.test@shreehotels.com';
  let testGuestEmail = 'royal.guest.test@shreehotels.com';
  let testStaffEmail = 'frontdesk.test@shreehotels.com';
  let otherGuestEmail = 'other.guest.test@shreehotels.com';

  let adminUser = null;
  let guestUser = null;
  let staffUser = null;
  let otherGuestUser = null;

  let adminToken = '';
  let guestToken = '';
  let staffToken = '';
  let otherGuestToken = '';

  let testHotel = null;
  let testRoomType = null;
  let testBooking = null;

  before(async () => {
    await connectDB();

    // 1. Provision Admin via trusted CLI provisioning function
    const adminResult = await provisionAdministrator({
      email: testAdminEmail,
      password: 'AdminPassword@2026',
      name: 'Executive Auditor Admin',
      phone: '+91 99999 88888',
    });
    adminUser = adminResult.user;

    // 2. Create Test Hotel & Room Type
    testHotel = await Hotel.create({
      name: 'The Heritage Palace Sanctuary',
      slug: 'the-heritage-palace-sanctuary',
      tagline: 'Imperial retreat',
      description: 'Luxury heritage experience',
      address: { city: 'Udaipur', state: 'Rajasthan', country: 'India' },
      starRating: 5,
      active: true,
    });

    testRoomType = await RoomType.create({
      hotelId: testHotel._id,
      name: 'Chamber Royal',
      type: 'deluxe',
      basePricePerNight: 9500,
      capacityAdults: 2,
      capacityChildren: 1,
      maxOccupancy: 3,
      totalRoomsCount: 5,
      active: true,
    });

    // 3. Register Guest Account
    const guestRegRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Maharani Gayatri',
        email: testGuestEmail,
        password: 'GuestPassword@2026',
        phone: '+91 98765 43210',
      });
    assert.equal(guestRegRes.status, 201);
    guestToken = guestRegRes.body.token;
    guestUser = await User.findOne({ email: testGuestEmail });

    // 4. Register Other Guest
    const otherGuestRegRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Kunwar Ranveer',
        email: otherGuestEmail,
        password: 'OtherPassword@2026',
      });
    otherGuestToken = otherGuestRegRes.body.token;
    otherGuestUser = await User.findOne({ email: otherGuestEmail });

    // 5. Create Staff Account directly assigned to Hotel
    staffUser = await User.create({
      name: 'Frontdesk Manager',
      email: testStaffEmail,
      password: 'StaffPassword@2026',
      role: 'staff',
      assignedHotelId: testHotel._id,
      isActive: true,
      isEmailVerified: true,
    });

    // Login Staff to get token
    const staffLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testStaffEmail, password: 'StaffPassword@2026' });
    staffToken = staffLoginRes.body.token;

    // Login Admin to get token
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testAdminEmail, password: 'AdminPassword@2026' });
    adminToken = adminLoginRes.body.token;

    // Create a booking owned by guestUser
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 10);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 12);

    testBooking = await Booking.create({
      bookingReference: 'SHREE-2026-TEST99',
      userId: guestUser._id,
      hotelId: testHotel._id,
      roomTypeId: testRoomType._id,
      checkIn,
      checkOut,
      numberOfRooms: 1,
      guests: { adults: 2, children: 0 },
      guestDetails: { name: guestUser.name, email: guestUser.email },
      priceBreakdown: {
        basePricePerNight: 9500,
        nights: 2,
        roomsCount: 1,
        totalBaseCharge: 19000,
        taxPercent: 18,
        taxAmount: 3420,
        finalAmount: 22420,
      },
      bookingStatus: 'confirmed',
      paymentStatus: 'captured',
    });
  });

  after(async () => {
    await disconnectDB();
  });

  /* ========================================================================
     1. AUTHENTICATION TEST CASES
     ======================================================================== */

  it('1.1 Login with a valid existing account returns valid token and sanitized user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testGuestEmail, password: 'GuestPassword@2026' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, testGuestEmail);
    assert.equal(res.body.user.password, undefined, 'Password hash must never be returned in API response');
  });

  it('1.2 Login with an invalid password returns 401 with generic error message', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testGuestEmail, password: 'WrongPassword@999' });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /invalid email or password/i);
  });

  it('1.3 Login with an unknown email returns 401 without leaking user existence', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent.user.xyz@shreehotels.com', password: 'AnyPassword@123' });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /invalid email or password/i);
  });

  it('1.4 Access a protected route without authentication returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('1.5 Access a protected route with an invalid or expired token returns 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.tampered.token');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('1.6 User logout endpoint returns success and records audit entry', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${guestToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  it('1.7 Disabled or deactivated account cannot sign in even with valid credentials', async () => {
    // Temporarily deactivate otherGuestUser
    await User.findByIdAndUpdate(otherGuestUser._id, { isActive: false });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: otherGuestEmail, password: 'OtherPassword@2026' });

    assert.equal(res.status, 403);
    assert.match(res.body.message, /deactivated/i);

    // Reactivate for subsequent tests
    await User.findByIdAndUpdate(otherGuestUser._id, { isActive: true });
  });

  it('1.8 Password reset: forgotPassword generates token hash, resetPassword sets new password', async () => {
    const forgotRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: otherGuestEmail });

    assert.equal(forgotRes.status, 200);
    assert.equal(forgotRes.body.success, true);

    // Retrieve user and simulate possession of the raw token by generating matching hash
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');

    await User.findByIdAndUpdate(otherGuestUser._id, {
      passwordResetToken: hashedResetToken,
      passwordResetExpires: new Date(Date.now() + 3600000),
    });

    // Reset password with valid raw token
    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawResetToken, password: 'NewSecurePassword@999' });

    assert.equal(resetRes.status, 200);
    assert.equal(resetRes.body.success, true);

    // Attempting to reuse the exact same token must fail (single-use enforcement)
    const reuseRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: rawResetToken, password: 'AnotherPassword@111' });

    assert.equal(reuseRes.status, 400);
    assert.match(reuseRes.body.message, /invalid or has expired/i);

    // Verify login works with the new password
    const newLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: otherGuestEmail, password: 'NewSecurePassword@999' });
    assert.equal(newLoginRes.status, 200);
  });

  it('1.9 Email verification token validates email and enforces single-use invalidation', async () => {
    const rawVerifyToken = crypto.randomBytes(32).toString('hex');
    const hashedVerifyToken = crypto.createHash('sha256').update(rawVerifyToken).digest('hex');

    await User.findByIdAndUpdate(otherGuestUser._id, {
      isEmailVerified: false,
      emailVerificationToken: hashedVerifyToken,
      emailVerificationExpires: new Date(Date.now() + 86400000),
    });

    const verifyRes = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: rawVerifyToken });

    assert.equal(verifyRes.status, 200);
    assert.equal(verifyRes.body.success, true);

    const updatedUser = await User.findById(otherGuestUser._id);
    assert.equal(updatedUser.isEmailVerified, true);

    // Reuse must fail
    const reuseVerifyRes = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: rawVerifyToken });
    assert.equal(reuseVerifyRes.status, 400);
  });

  /* ========================================================================
     2. AUTHORIZATION TEST CASES
     ======================================================================== */

  it('2.1 Guest attempting to access administrator analytics endpoint is blocked with 403', async () => {
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${guestToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
    assert.match(res.body.message, /forbidden/i);
  });

  it('2.2 Guest attempting to access staff metrics endpoint is blocked with 403', async () => {
    const res = await request(app)
      .get('/api/staff/metrics')
      .set('Authorization', `Bearer ${guestToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  it('2.3 Staff attempting to access administrator endpoint is blocked with 403', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${staffToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  it('2.4 Administrator accesses protected admin analytics successfully with 200', async () => {
    const res = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.summary);
  });

  it('2.5 Staff accesses staff metrics for assigned hotel successfully with 200', async () => {
    const res = await request(app)
      .get(`/api/staff/metrics?hotelId=${testHotel._id}`)
      .set('Authorization', `Bearer ${staffToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  it('2.6 Guest B cannot access or view Guest A booking (IDOR protection: 403)', async () => {
    const res = await request(app)
      .get(`/api/bookings/${testBooking.bookingReference}`)
      .set('Authorization', `Bearer ${otherGuestToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  it('2.7 Public registration with malicious role=admin in body strictly creates guest', async () => {
    const attackEmail = `intruder.${Date.now()}@shreehotels.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Privilege Escalation Tester',
        email: attackEmail,
        password: 'Password@123',
        role: 'admin',
        isAdmin: true,
        permissions: ['*'],
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.user.role, 'guest', 'Role must be strictly overridden to guest');

    const created = await User.findOne({ email: attackEmail });
    assert.equal(created.role, 'guest');
  });

  it('2.8 Unauthenticated user attempting privileged mutations returns 401', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${guestUser._id}`)
      .send({ role: 'admin' });

    assert.equal(res.status, 401);
  });

  /* ========================================================================
     3. DATABASE & SEEDING SAFETY TEST CASES
     ======================================================================== */

  it('3.1 Administrator provisioning via CLI script creates new admin with hashed password', async () => {
    const cliAdminEmail = `cli.admin.${Date.now()}@shreehotels.com`;
    const res = await provisionAdministrator({
      email: cliAdminEmail,
      password: 'StrongAdminPassword@2026',
      name: 'CLI Officer',
    });

    assert.equal(res.success, true);
    assert.equal(res.created, true);

    const checkUser = await User.findOne({ email: cliAdminEmail });
    assert.equal(checkUser.role, 'admin');
    assert.notEqual(checkUser.password, 'StrongAdminPassword@2026', 'Password must be stored as bcrypt hash');
  });

  it('3.2 Rerunning administrator provisioning for an existing admin preserves account without duplicating', async () => {
    const res = await provisionAdministrator({
      email: testAdminEmail,
      password: 'DifferentPassword@999',
    });

    assert.equal(res.success, true);
    assert.equal(res.alreadyExisted, true);

    const adminCount = await User.countDocuments({ email: testAdminEmail });
    assert.equal(adminCount, 1, 'Never duplicate existing accounts');
  });

  it('3.3 Administrator provisioning refuses to silently overwrite existing non-admin account without promote flag', async () => {
    await assert.rejects(
      async () => {
        await provisionAdministrator({
          email: testGuestEmail,
          password: 'AttemptOverwrite@123',
          promoteIfExisting: false,
        });
      },
      /Refusing to silently overwrite/
    );
  });

  it('3.4 Production guard: seedDatabase() rejects execution in NODE_ENV=production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    await assert.rejects(
      async () => {
        await seedDatabase();
      },
      /Fatal Security Guard/
    );

    process.env.NODE_ENV = originalEnv;
  });
});

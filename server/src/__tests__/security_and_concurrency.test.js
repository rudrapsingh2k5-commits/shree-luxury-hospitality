import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import request from 'supertest';
import dotenv from 'dotenv';
dotenv.config();

import app from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { seedDatabase } from '../utils/seedData.js';
import { User, Hotel, RoomType, Booking, RoomNightAllocation, SupportTicket } from '../models/index.js';
import { convertInrToGbp, getExchangeRate } from '../utils/currency.js';

describe('HotelPro Security, Authorization, Concurrency & Reliability Suite', { concurrency: false }, () => {
  let guestAToken = '';
  let guestBToken = '';
  let staffUdaipurToken = '';
  let staffGoaToken = '';
  let adminToken = '';

  let udaipurHotel = null;
  let goaHotel = null;
  let udaipurRoomType = null;
  let goaRoomType = null;

  before(async () => {
    await connectDB();
    await seedDatabase();
    await RoomNightAllocation.syncIndexes();

    // 1. Login Guest A
    const guestARes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'guest@hotelpro.com', password: 'Guest@123' });
    guestAToken = guestARes.body.token;

    // 2. Register Guest B
    const guestBRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Guest Bravo',
        email: 'guest.bravo@hotelpro.com',
        password: 'Password@123',
        phone: '+91 9123456789',
      });
    guestBToken = guestBRes.body.token;

    // 3. Login Staff Udaipur
    const staffUdaipurRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'staff.udaipur@hotelpro.com', password: 'Staff@123' });
    staffUdaipurToken = staffUdaipurRes.body.token;

    // 4. Login Staff Goa
    const staffGoaRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'staff.goa@hotelpro.com', password: 'Staff@123' });
    staffGoaToken = staffGoaRes.body.token;

    // 5. Login Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@hotelpro.com', password: 'Admin@123' });
    adminToken = adminRes.body.token;

    // Fetch hotels and room types
    const hotels = await Hotel.find({});
    udaipurHotel = hotels.find((h) => h.address.city === 'Udaipur');
    goaHotel = hotels.find((h) => h.address.city === 'Goa');

    udaipurRoomType = await RoomType.findOne({ hotelId: udaipurHotel._id });
    goaRoomType = await RoomType.findOne({ hotelId: goaHotel._id });
  });

  after(async () => {
    await disconnectDB();
  });

  // --------------------------------------------------------------------------
  // SECTION 1: Authentication & Privilege Escalation Hardening
  // --------------------------------------------------------------------------
  it('1.1 Registration must reject/ignore role parameter and always create a guest', async () => {
    const maliciousRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Hacker Admin',
        email: 'hacker.admin@hotelpro.com',
        password: 'Password@123',
        role: 'admin',
        assignedHotelId: udaipurHotel._id.toString(),
      });

    assert.equal(maliciousRes.status, 201);
    assert.equal(maliciousRes.body.user.role, 'guest', 'Role must strictly default to guest');

    const createdUser = await User.findOne({ email: 'hacker.admin@hotelpro.com' });
    assert.equal(createdUser.role, 'guest');
    assert.equal(createdUser.assignedHotelId, null);
  });

  it('1.2 Deactivated or suspended accounts must be rejected even with a valid token', async () => {
    // Create and immediately deactivate a test user
    const userToDeactivate = await User.create({
      name: 'Deactivated Guest',
      email: 'deactivated.guest@hotelpro.com',
      password: 'Password@123',
      role: 'guest',
      isActive: false, // Deactivated
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'deactivated.guest@hotelpro.com', password: 'Password@123' });

    assert.ok(loginRes.status === 401 || loginRes.status === 403);
    assert.ok(loginRes.body.message.toLowerCase().includes('deactivated') || loginRes.body.message.toLowerCase().includes('suspended'));
  });

  // --------------------------------------------------------------------------
  // SECTION 2: Hotel-Level & Resource-Level Authorization
  // --------------------------------------------------------------------------
  it('2.1 Staff at Udaipur must be strictly blocked from managing Goa hotel resources (403)', async () => {
    // Ensure a Goa booking exists
    let goaBooking = await Booking.findOne({ hotelId: goaHotel._id });
    if (!goaBooking) {
      goaBooking = await Booking.create({
        bookingReference: 'HP-GOA-SEED-01',
        userId: (await User.findOne({ email: 'guest@hotelpro.com' }))._id,
        hotelId: goaHotel._id,
        roomTypeId: goaRoomType._id,
        checkIn: new Date(Date.now() + 86400000 * 10),
        checkOut: new Date(Date.now() + 86400000 * 13),
        numberOfRooms: 1,
        guests: { adults: 2, children: 0 },
        guestDetails: { name: 'Goa Guest', email: 'goa.guest@hotelpro.com' },
        priceBreakdown: {
          basePricePerNight: 9500,
          nights: 3,
          roomsCount: 1,
          totalBaseCharge: 28500,
          taxPercent: 18,
          taxAmount: 5130,
          serviceFee: 0,
          discountAmount: 0,
          finalAmount: 33630,
          amountInPaise: 3363000,
        },
        cancellationPolicy: '48_hours_free',
        bookingStatus: 'confirmed',
        paymentStatus: 'captured',
        invoiceNumber: 'INV-GOA-001',
      });
    }

    const unauthorizedCheckIn = await request(app)
      .post('/api/staff/check-in')
      .set('Authorization', `Bearer ${staffUdaipurToken}`)
      .send({
        bookingId: goaBooking._id,
        roomNumbers: ['101'],
      });

    assert.equal(unauthorizedCheckIn.status, 403);
    assert.ok(unauthorizedCheckIn.body.message.includes('not authorized'));
  });

  it('2.2 Guest B cannot access, cancel, or initiate payment for Guest A booking (403)', async () => {
    // Create a booking owned by Guest A
    const checkInDate = new Date();
    checkInDate.setDate(checkInDate.getDate() + 45);
    const checkOutDate = new Date();
    checkOutDate.setDate(checkOutDate.getDate() + 47);

    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${guestAToken}`)
      .send({
        hotelId: udaipurHotel._id,
        roomTypeId: udaipurRoomType._id,
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        numberOfRooms: 1,
        guests: { adults: 2, children: 0 },
        guestDetails: { name: 'Guest Alpha', email: 'guest@hotelpro.com' },
      });

    assert.equal(bookingRes.status, 201);
    const guestABookingId = bookingRes.body.booking._id;

    // Guest B attempts to cancel Guest A's booking -> must fail with 403
    const unauthorizedCancel = await request(app)
      .put(`/api/bookings/${guestABookingId}/cancel`)
      .set('Authorization', `Bearer ${guestBToken}`)
      .send({ reason: 'Malicious cancellation attempt' });

    assert.equal(unauthorizedCancel.status, 403);

    // Guest B attempts to create Stripe payment intent for Guest A's booking -> must fail with 403
    const unauthorizedPayment = await request(app)
      .post('/api/payments/create-intent')
      .set('Authorization', `Bearer ${guestBToken}`)
      .send({ bookingId: guestABookingId });

    assert.equal(unauthorizedPayment.status, 403);
  });

  // --------------------------------------------------------------------------
  // SECTION 3: Booking Validation & Consistency
  // --------------------------------------------------------------------------
  it('3.1 Reject booking when room type does not belong to selected hotel (400)', async () => {
    const checkInDate = new Date();
    checkInDate.setDate(checkInDate.getDate() + 50);
    const checkOutDate = new Date();
    checkOutDate.setDate(checkOutDate.getDate() + 52);

    // Cross-hotel: Udaipur Hotel ID paired with Goa Room Type ID
    const crossHotelRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${guestAToken}`)
      .send({
        hotelId: udaipurHotel._id,
        roomTypeId: goaRoomType._id,
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        numberOfRooms: 1,
        guests: { adults: 2, children: 0 },
        guestDetails: { name: 'Cross Hotel Tester', email: 'cross@hotelpro.com' },
      });

    assert.equal(crossHotelRes.status, 400);
    assert.ok(crossHotelRes.body.message.includes('does not belong'));
  });

  it('3.2 Reject booking when check-in date is in the past (400)', async () => {
    const pastCheckIn = new Date();
    pastCheckIn.setDate(pastCheckIn.getDate() - 5);
    const pastCheckOut = new Date();
    pastCheckOut.setDate(pastCheckOut.getDate() - 2);

    const pastDateRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${guestAToken}`)
      .send({
        hotelId: udaipurHotel._id,
        roomTypeId: udaipurRoomType._id,
        checkIn: pastCheckIn.toISOString(),
        checkOut: pastCheckOut.toISOString(),
        numberOfRooms: 1,
        guests: { adults: 2, children: 0 },
        guestDetails: { name: 'Past Tester', email: 'past@hotelpro.com' },
      });

    assert.equal(pastDateRes.status, 400);
    assert.ok(pastDateRes.body.message.includes('past'));
  });

  it('3.3 Reject booking when total guests exceed room capacity limit (400)', async () => {
    const checkInDate = new Date();
    checkInDate.setDate(checkInDate.getDate() + 55);
    const checkOutDate = new Date();
    checkOutDate.setDate(checkOutDate.getDate() + 57);

    const excessiveGuestsRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${guestAToken}`)
      .send({
        hotelId: udaipurHotel._id,
        roomTypeId: udaipurRoomType._id,
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        numberOfRooms: 1,
        guests: { adults: 8, children: 4 }, // 12 guests for 1 suite
        guestDetails: { name: 'Party Crowd', email: 'party@hotelpro.com' },
      });

    assert.equal(excessiveGuestsRes.status, 400);
    assert.ok(excessiveGuestsRes.body.message.includes('Capacity exceeded'));
  });

  // --------------------------------------------------------------------------
  // SECTION 4: Concurrency & Overbooking Elimination
  // --------------------------------------------------------------------------
  it('4.1 Prevent overselling under high concurrency: simultaneous requests for last room', async () => {
    // Create a special boutique room type with totalRoomsCount = 1
    const exclusiveSuite = await RoomType.create({
      hotelId: udaipurHotel._id,
      name: 'Presidential Monolith Suite',
      type: 'presidential',
      basePricePerNight: 50000,
      totalRoomsCount: 1, // Exactly 1 inventory slot
      maxOccupancy: 2,
      active: true,
    });

    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 60);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 62);

    const checkInIso = checkIn.toISOString();
    const checkOutIso = checkOut.toISOString();

    // Spawn 5 simultaneous concurrent booking requests for this single room
    const concurrentAttempts = Array.from({ length: 5 }, (_, i) =>
      request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${guestAToken}`)
        .send({
          hotelId: udaipurHotel._id,
          roomTypeId: exclusiveSuite._id,
          checkIn: checkInIso,
          checkOut: checkOutIso,
          numberOfRooms: 1,
          guests: { adults: 2, children: 0 },
          guestDetails: { name: `Racer ${i + 1}`, email: `racer${i + 1}@hotelpro.com` },
        })
    );

    const results = await Promise.all(concurrentAttempts);
    const successCount = results.filter((r) => r.status === 201).length;
    const conflictCount = results.filter((r) => r.status === 409).length;

    // Mathematically exactly 1 must succeed and exactly 4 must receive 409 Conflict
    assert.equal(successCount, 1, 'Exactly one concurrent booking should succeed');
    assert.equal(conflictCount, 4, 'All four competing requests must be rejected with 409 Conflict');

    // Verify database constraint state
    const allocations = await RoomNightAllocation.find({
      roomTypeId: exclusiveSuite._id,
    });
    // For 2 nights and 1 room, exactly 2 room-night allocations exist (1 per night)
    assert.equal(allocations.length, 2, 'Exactly two room-night allocations should exist in DB');
  });

  // --------------------------------------------------------------------------
  // SECTION 5: Payment Integrity & Verification Hardening
  // --------------------------------------------------------------------------
  it('5.1 Reject payment verification with spoofed/arbitrary non-empty signature', async () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 70);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 72);

    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${guestAToken}`)
      .send({
        hotelId: udaipurHotel._id,
        roomTypeId: udaipurRoomType._id,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        numberOfRooms: 1,
        guests: { adults: 2, children: 0 },
        guestDetails: { name: 'Payment Security Guest', email: 'paysec@hotelpro.com' },
      });

    const bookingId = bookRes.body.booking._id;
    const orderRes = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${guestAToken}`)
      .send({ bookingId });

    const intentId = orderRes.body.paymentIntentId || orderRes.body.order.id;

    // Malicious attempt: Mismatched payment intent ID
    const verifySpoofed = await request(app)
      .post('/api/payments/confirm')
      .set('Authorization', `Bearer ${guestAToken}`)
      .send({
        bookingId,
        paymentIntentId: 'pi_fake_mismatched_intent_123',
        isSimulated: true,
      });

    assert.equal(verifySpoofed.status, 400);
    assert.ok(verifySpoofed.body.message.includes('mismatch'));
  });

  it('5.2 Cancelled booking must NOT be revived by delayed/out-of-order webhook', async () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 80);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 82);

    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${guestAToken}`)
      .send({
        hotelId: udaipurHotel._id,
        roomTypeId: udaipurRoomType._id,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        numberOfRooms: 1,
        guests: { adults: 2, children: 0 },
        guestDetails: { name: 'Webhook Racer', email: 'webhook@hotelpro.com' },
      });

    const bookingId = bookRes.body.booking._id;
    const orderRes = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${guestAToken}`)
      .send({ bookingId });
    const orderId = orderRes.body.order.id;

    // Guest cancels the booking before payment webhook arrives
    const cancelRes = await request(app)
      .put(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${guestAToken}`)
      .send({ reason: 'Guest changed travel plans' });
    assert.equal(cancelRes.status, 200);

    // Now a late webhook for payment_intent.succeeded arrives
    const payload = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: orderId,
          amount: 5000,
          currency: 'gbp',
          metadata: {
            bookingId: bookingId.toString(),
          },
        },
      },
    };
    const rawPayload = JSON.stringify(payload);

    const webhookRes = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .send(rawPayload);

    assert.equal(webhookRes.status, 200);

    // Verify booking is STILL cancelled and not revived to confirmed!
    const recheckedBooking = await Booking.findById(bookingId);
    assert.equal(recheckedBooking.bookingStatus, 'cancelled', 'Cancelled booking must NOT be revived by late webhook');
  });

  // --------------------------------------------------------------------------
  // SECTION 6: Support Ticket System Persistence
  // --------------------------------------------------------------------------
  it('6.1 Support ticket endpoint must validate and persist inquiry in MongoDB', async () => {
    const invalidRes = await request(app)
      .post('/api/support/tickets')
      .send({
        name: 'Inquirer',
        email: 'invalid-email-address',
        subject: 'Short',
        message: 'Too short',
      });
    assert.equal(invalidRes.status, 400);

    const validRes = await request(app)
      .post('/api/support/tickets')
      .send({
        name: 'Pooja Hegde',
        email: 'pooja.guest@hotelpro.com',
        subject: 'Airport Transfer to Lake Palace',
        category: 'concierge',
        message: 'Could you please arrange luxury boat transfer from Udaipur airport jetty at 4 PM?',
      });

    assert.equal(validRes.status, 201);
    assert.equal(validRes.body.success, true);
    assert.ok(validRes.body.ticket._id);

    const ticketInDb = await SupportTicket.findById(validRes.body.ticket._id);
    assert.ok(ticketInDb);
    assert.equal(ticketInDb.email, 'pooja.guest@hotelpro.com');
    assert.equal(ticketInDb.status, 'open');
  });

  // --------------------------------------------------------------------------
  // SECTION 7: Admin CSV Formula Injection Sanitization
  // --------------------------------------------------------------------------
  it('7.1 Admin CSV export must neutralize formula injection vulnerabilities', async () => {
    // Create a booking with a malicious formula payload in guest name and special requests
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 90);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 92);

    await Booking.create({
      bookingReference: 'HP-TEST-CSV-01',
      userId: (await User.findOne({ email: 'guest@hotelpro.com' }))._id,
      hotelId: udaipurHotel._id,
      roomTypeId: udaipurRoomType._id,
      checkIn,
      checkOut,
      numberOfRooms: 1,
      guests: { adults: 2, children: 0 },
      guestDetails: {
        name: '=cmd|/C calc!A0', // Classic CSV formula injection vector
        email: 'csvinjection@hotelpro.com',
        phone: '+91 9999999999',
        specialRequests: '@SUM(1+1)*cmd', // Another formula vector
      },
      priceBreakdown: {
        basePricePerNight: 10000,
        nights: 2,
        roomsCount: 1,
        totalBaseCharge: 20000,
        taxPercent: 18,
        taxAmount: 3600,
        serviceFee: 0,
        discountAmount: 0,
        finalAmount: 23600,
        amountInPaise: 2360000,
      },
      cancellationPolicy: '48_hours_free',
      bookingStatus: 'confirmed',
      paymentStatus: 'captured',
      invoiceNumber: 'INV-TEST-CSV',
    });

    const exportRes = await request(app)
      .get('/api/admin/export-bookings-csv')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(exportRes.status, 200);
    assert.ok(exportRes.text.includes('Booking Reference,Guest Name'));

    // Check that formula triggers have been neutralized with a leading single quote
    assert.ok(
      exportRes.text.includes("''=cmd|/C calc!A0") || exportRes.text.includes("'=cmd|/C calc!A0"),
      'CSV output must neutralize formula prefix with leading quote'
    );
  });

  // --------------------------------------------------------------------------
  // SECTION 8: SHREE Rebranding, Stripe Gateway, and CORS Hardening
  // --------------------------------------------------------------------------
  it('8.1 SHREE booking references must follow the format SHREE-YYYY-XXXXX', async () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 30);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 32);

    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${guestAToken}`)
      .send({
        hotelId: udaipurHotel._id.toString(),
        roomTypeId: udaipurRoomType._id.toString(),
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        numberOfRooms: 1,
        guests: { adults: 2, children: 0 },
        guestDetails: {
          name: 'Shree Regal Guest',
          email: 'regal.guest@shreehotels.com',
          phone: '+91 9876543210',
        },
      });

    assert.equal(bookingRes.status, 201);
    const ref = bookingRes.body.booking.bookingReference;
    const currentYear = new Date().getFullYear();
    const regex = new RegExp(`^SHREE-${currentYear}-[A-Z0-9]{5}$`);
    assert.match(ref, regex, `Booking reference '${ref}' must match SHREE-${currentYear}-XXXXX`);
  });

  it('8.2 Stripe Gateway: must convert INR to GBP (£) and confirm payment successfully', async () => {
    // 1. Create a pending booking
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 45);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 47);

    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${guestAToken}`)
      .send({
        hotelId: goaHotel._id.toString(),
        roomTypeId: goaRoomType._id.toString(),
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        numberOfRooms: 1,
        guests: { adults: 1, children: 0 },
        guestDetails: {
          name: 'Signature Test Guest',
          email: 'signature.test@shreehotels.com',
          phone: '+91 9888877777',
        },
      });

    assert.equal(bookingRes.status, 201);
    const bookingId = bookingRes.body.booking._id;

    // 2. Create Stripe payment intent
    const intentRes = await request(app)
      .post('/api/payments/create-intent')
      .set('Authorization', `Bearer ${guestAToken}`)
      .send({ bookingId });

    assert.equal(intentRes.status, 200);
    assert.equal(intentRes.body.currency, 'gbp');
    assert.ok(intentRes.body.amountGbp > 0);
    assert.ok(intentRes.body.paymentIntentId);
    const paymentIntentId = intentRes.body.paymentIntentId;

    // 3. Confirm with unauthorized user (Guest B) -> must return 403 Forbidden
    const forbiddenRes = await request(app)
      .post('/api/payments/confirm')
      .set('Authorization', `Bearer ${guestBToken}`)
      .send({ bookingId, paymentIntentId, isSimulated: true });
    assert.equal(forbiddenRes.status, 403);

    // 4. Confirm as booking owner (Guest A) -> confirms reservation
    const confirmRes = await request(app)
      .post('/api/payments/confirm')
      .set('Authorization', `Bearer ${guestAToken}`)
      .send({
        bookingId,
        paymentIntentId,
        paymentMethod: 'card',
        isSimulated: true,
      });

    assert.equal(confirmRes.status, 200);
    assert.equal(confirmRes.body.booking.bookingStatus, 'confirmed');
    assert.ok(confirmRes.body.booking.amountGbp > 0);

    // 5. Verify inventory was confirmed
    const confirmedBooking = await Booking.findById(bookingId);
    assert.equal(confirmedBooking.bookingStatus, 'confirmed');
    assert.ok(['succeeded', 'captured'].includes(confirmedBooking.paymentStatus));
  });

  it('8.3 CORS Hardening: Permitted origins must be accepted, unwhitelisted origins rejected', async () => {
    // Permitted origin: http://localhost:5173
    const allowedRes = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');

    assert.equal(allowedRes.status, 200);
    assert.equal(allowedRes.headers['access-control-allow-origin'], 'http://localhost:5173');

    // Disallowed origin: http://evil-hacker.com
    const disallowedRes = await request(app)
      .get('/api/health')
      .set('Origin', 'http://evil-hacker.com');

    // In Express CORS, passing new Error(...) in origin callback triggers error response
    assert.notEqual(disallowedRes.headers['access-control-allow-origin'], 'http://evil-hacker.com');
  });

  it('8.4 SHREE Seed Accounts: Dual persona accounts (both @shreehotels.com and legacy @hotelpro.com) must be valid and operational', async () => {
    // Admin login via SHREE persona
    const shreeAdminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@shreehotels.com', password: 'Admin@123' });
    assert.equal(shreeAdminRes.status, 200);
    assert.equal(shreeAdminRes.body.user.role, 'admin');

    // Guest login via SHREE persona
    const shreeGuestRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'guest@shreehotels.com', password: 'Guest@123' });
    assert.equal(shreeGuestRes.status, 200);
    assert.equal(shreeGuestRes.body.user.role, 'guest');

    // Staff login via SHREE persona
    const shreeStaffRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'staff.udaipur@shreehotels.com', password: 'Staff@123' });
    assert.equal(shreeStaffRes.status, 200);
    assert.equal(shreeStaffRes.body.user.role, 'staff');
  });
});

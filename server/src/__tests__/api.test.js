import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import request from 'supertest';
import dotenv from 'dotenv';
dotenv.config();

import app from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { seedDatabase } from '../utils/seedData.js';
import { calculateStayPrice } from '../utils/pricing.js';
import { convertInrToGbp, getExchangeRate } from '../utils/currency.js';

describe('HotelPro Complete System Test Suite', { concurrency: false }, () => {
  let guestToken = '';
  let staffToken = '';
  let adminToken = '';
  let testHotelId = '';
  let testRoomTypeId = '';
  let testBookingId = '';
  let testBookingRef = '';
  let stripePaymentIntentId = '';

  const futureCheckIn = new Date();
  futureCheckIn.setDate(futureCheckIn.getDate() + 30);
  const futureCheckOut = new Date();
  futureCheckOut.setDate(futureCheckOut.getDate() + 33);

  before(async () => {
    await connectDB();
    await seedDatabase();

    // Login as guest
    const guestRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'guest@hotelpro.com', password: 'Guest@123' });
    guestToken = guestRes.body.token;

    // Login as staff
    const staffRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'staff.udaipur@hotelpro.com', password: 'Staff@123' });
    staffToken = staffRes.body.token;

    // Login as admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@hotelpro.com', password: 'Admin@123' });
    adminToken = adminRes.body.token;
  });

  after(async () => {
    await disconnectDB();
  });

  // Section 1: Auth
  it('1.1 should successfully login guest with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'guest@hotelpro.com', password: 'Guest@123' });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token);
    assert.equal(res.body.user.role, 'guest');
  });

  it('1.2 should reject login with invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'guest@hotelpro.com', password: 'WrongPassword99' });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  it('1.3 should register a new user successfully', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Kabir Verma',
        email: 'kabir.test@hotelpro.com',
        password: 'Password@123',
        phone: '+91 9988776655',
      });
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token);
  });

  it('1.4 should reject registration with duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate Guest',
        email: 'guest@hotelpro.com',
        password: 'Password@123',
      });
    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
  });

  it('1.5 should enforce admin role-based route protection', async () => {
    // Guest accessing admin analytics should be 403 Forbidden
    const guestRes = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${guestToken}`);
    assert.equal(guestRes.status, 403);

    // Admin accessing admin analytics should succeed
    const adminRes = await request(app)
      .get('/api/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(adminRes.status, 200);
    assert.ok(adminRes.body.summary);
  });

  // Section 2: Hotel Search & Details
  it('2.1 should fetch list of active hotels', async () => {
    const res = await request(app).get('/api/hotels');
    assert.equal(res.status, 200);
    assert.ok(res.body.hotels.length > 0);
    testHotelId = res.body.hotels[0]._id;
  });

  it('2.2 should filter hotels by destination query', async () => {
    const res = await request(app).get('/api/hotels?destination=Udaipur');
    assert.equal(res.status, 200);
    assert.ok(res.body.hotels.length > 0);
    assert.equal(res.body.hotels[0].address.city, 'Udaipur');
  });

  it('2.3 should fetch hotel details by slug with room types and reviews', async () => {
    const res = await request(app).get('/api/hotels/slug/the-mewar-palace-lake-retreat');
    assert.equal(res.status, 200);
    assert.ok(res.body.hotel.name.includes('Mewar Palace'));
    assert.ok(res.body.hotel.roomTypes.length > 0);
    assert.ok(res.body.hotel.reviews.length > 0);
    testRoomTypeId = res.body.hotel.roomTypes[0]._id;
  });

  it('2.4 should accurately calculate stay pricing with taxes and nights', () => {
    const checkIn = new Date('2027-01-10');
    const checkOut = new Date('2027-01-13'); // 3 nights
    const pricing = calculateStayPrice({
      basePricePerNight: 10000,
      checkIn,
      checkOut,
      numberOfRooms: 1,
    });

    assert.equal(pricing.nights, 3);
    assert.equal(pricing.totalBaseCharge, 30000);
    assert.equal(pricing.taxPercent, 18);
    assert.equal(pricing.taxAmount, 5400); // 18% of 30,000
    assert.equal(pricing.finalAmount, 35400);
  });

  // Section 3: Booking & Availability
  it('3.1 should create a pending reservation and prevent client-side price tampering', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        hotelId: testHotelId,
        roomTypeId: testRoomTypeId,
        checkIn: futureCheckIn.toISOString(),
        checkOut: futureCheckOut.toISOString(),
        numberOfRooms: 1,
        guests: { adults: 2, children: 0 },
        guestDetails: {
          name: 'Ananya Sharma',
          email: 'guest@hotelpro.com',
          phone: '+91 98765 43210',
          specialRequests: 'Quiet room please',
        },
        tamperedFinalAmount: 1, // Malicious attempt to pay ₹1
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.booking.bookingStatus, 'pending_payment');
    assert.ok(res.body.booking.priceBreakdown.finalAmount > 5000);
    testBookingId = res.body.booking._id;
    testBookingRef = res.body.booking.bookingReference;
  });

  it('3.2 should reject booking when checkOut is earlier than checkIn', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        hotelId: testHotelId,
        roomTypeId: testRoomTypeId,
        checkIn: '2027-02-15',
        checkOut: '2027-02-10', // Invalid
        numberOfRooms: 1,
        guestDetails: { name: 'Test', email: 'test@hotelpro.com' },
      });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  it('3.3 should prevent overlapping overbooking when capacity is exceeded', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        hotelId: testHotelId,
        roomTypeId: testRoomTypeId,
        checkIn: futureCheckIn.toISOString(),
        checkOut: futureCheckOut.toISOString(),
        numberOfRooms: 99,
        guestDetails: { name: 'Exceeding Guest', email: 'exceed@hotelpro.com' },
      });

    assert.equal(res.status, 409);
    assert.ok(res.body.message.includes('unavailable'));
  });

  // Section 4: Stripe Payments with INR to GBP Conversion
  it('4.1 should create Stripe payment intent and convert INR to GBP (£)', async () => {
    const res = await request(app)
      .post('/api/payments/create-intent')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ bookingId: testBookingId });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.currency, 'gbp');
    assert.equal(res.body.currencySymbol, '£');
    assert.ok(res.body.amountInr > 0);
    assert.ok(res.body.amountGbp > 0);
    assert.equal(res.body.exchangeRate, getExchangeRate());
    assert.equal(res.body.gbpPence, Math.round(res.body.amountGbp * 100));
    assert.ok(res.body.paymentIntentId);
    stripePaymentIntentId = res.body.paymentIntentId;
  });

  it('4.2 should reject payment confirmation with mismatched payment intent ID', async () => {
    const res = await request(app)
      .post('/api/payments/confirm')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        bookingId: testBookingId,
        paymentIntentId: 'pi_fake_mismatched_intent_123',
        isSimulated: true,
      });

    assert.equal(res.status, 400);
    assert.ok(res.body.message.includes('mismatch'));
  });

  it('4.3 should confirm payment in GBP and transition booking to confirmed', async () => {
    const res = await request(app)
      .post('/api/payments/confirm')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        bookingId: testBookingId,
        paymentIntentId: stripePaymentIntentId,
        paymentMethod: 'card',
        isSimulated: true,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.booking.bookingStatus, 'confirmed');
    assert.equal(res.body.booking.paymentStatus, 'succeeded');
    assert.ok(res.body.booking.amountGbp > 0);
  });

  it('4.4 should handle Stripe webhook idempotently', async () => {
    const payload = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: stripePaymentIntentId,
          amount: 5000,
          currency: 'gbp',
          metadata: {
            bookingId: testBookingId,
          },
        },
      },
    };
    const rawPayload = JSON.stringify(payload);

    const res = await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .send(rawPayload);

    assert.equal(res.status, 200);
    assert.equal(res.body.received, true);
  });

  // Section 5: Staff
  it('5.1 should reject staff checking in to a dirty or occupied room', async () => {
    // Room 103 was seeded as 'dirty'
    const res = await request(app)
      .post('/api/staff/check-in')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        bookingId: testBookingId,
        roomNumbers: ['103'],
      });

    assert.equal(res.status, 400);
    assert.ok(res.body.message.includes('DIRTY'));
  });

  it('5.2 should check in guest into an available clean room', async () => {
    // Room 102 was seeded as 'available'
    const res = await request(app)
      .post('/api/staff/check-in')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        bookingId: testBookingId,
        roomNumbers: ['102'],
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.booking.bookingStatus, 'checked_in');
  });

  it('5.3 should check out guest, set room to dirty, and auto-create housekeeping task', async () => {
    const res = await request(app)
      .post('/api/staff/check-out')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ bookingId: testBookingId });

    assert.equal(res.status, 200);
    assert.equal(res.body.booking.bookingStatus, 'checked_out');

    // Verify housekeeping tasks now list Room 102
    const hkRes = await request(app)
      .get('/api/staff/housekeeping')
      .set('Authorization', `Bearer ${staffToken}`);
    assert.equal(hkRes.status, 200);
    const hasCheckoutCleanTask = hkRes.body.tasks.some(
      (t) => t.roomNumber === '102' && t.taskType === 'checkout_clean'
    );
    assert.equal(hasCheckoutCleanTask, true);
  });

  // Section 6: Reviews
  it('6.1 should allow review submission for eligible checked_out stay', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        bookingId: testBookingId,
        rating: 5,
        cleanlinessRating: 5,
        serviceRating: 5,
        locationRating: 5,
        amenitiesRating: 5,
        title: 'Impeccable lakeside bliss',
        comment: 'Our stay was flawless from check-in to check-out. Attentive staff and pristine heritage architecture.',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.review.verifiedStay, true);
  });

  it('6.2 should prevent duplicate reviews for the same stay', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        bookingId: testBookingId,
        rating: 4,
        title: 'Duplicate review test',
        comment: 'Testing duplicate review prevention logic.',
      });

    assert.equal(res.status, 409);
    assert.ok(res.body.message.includes('already been submitted'));
  });
});

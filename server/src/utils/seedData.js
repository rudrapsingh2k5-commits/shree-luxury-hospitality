import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

import {
  User,
  Hotel,
  RoomType,
  RoomInventory,
  Booking,
  Payment,
  Review,
  Offer,
  HousekeepingTask,
  ServiceRequest,
  Notification,
  AuditLog,
  RoomNightAllocation,
  SupportTicket,
} from '../models/index.js';
import { reserveRoomInventoryAtomic, confirmRoomInventory } from './availability.js';
import { connectDB, disconnectDB } from '../config/db.js';

export const seedDatabase = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('[Fatal Security Guard] Seeding fixtures and resetting collections is strictly prohibited in production.');
  }
  try {
    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Hotel.deleteMany({}),
      RoomType.deleteMany({}),
      RoomInventory.deleteMany({}),
      Booking.deleteMany({}),
      Payment.deleteMany({}),
      Review.deleteMany({}),
      Offer.deleteMany({}),
      HousekeepingTask.deleteMany({}),
      ServiceRequest.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
      RoomNightAllocation.deleteMany({}),
      SupportTicket.deleteMany({}),
    ]);

    // Ensure database indexes are fully built and active
    await RoomNightAllocation.init();
    await User.init();

    // 1. Create Core Users
    console.log('[Seed] Creating demo accounts...');

    const adminUser = await User.create({
      name: 'Vikramaditya Singhania',
      email: 'admin@shreehotels.com',
      password: 'Admin@123',
      role: 'admin',
      phone: '+91 98201 12345',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    });

    await User.create({
      name: 'Vikramaditya Singhania',
      email: 'admin@hotelpro.com',
      password: 'Admin@123',
      role: 'admin',
      phone: '+91 98201 12345',
    });

    const guestUser = await User.create({
      name: 'Ananya Sharma',
      email: 'guest@shreehotels.com',
      password: 'Guest@123',
      role: 'guest',
      phone: '+91 98765 43210',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    });

    await User.create({
      name: 'Ananya Sharma',
      email: 'guest@hotelpro.com',
      password: 'Guest@123',
      role: 'guest',
      phone: '+91 98765 43210',
    });

    // 2. Create Luxury Properties
    console.log('[Seed] Seeding luxury heritage and boutique properties...');
    const hotelsData = [
      {
        name: 'The Mewar Palace & Lake Retreat',
        slug: 'the-mewar-palace-lake-retreat',
        tagline: 'Imperial Rajputana splendor on the tranquil waters of Lake Pichola',
        description:
          'Rising gracefully from the serene waters of Lake Pichola, The Mewar Palace is a testament to 18th-century Rajputana grandeur. Featuring hand-carved jharokhas, courtyards adorned with bougainvillea, and panoramic views of the Aravalli Hills, each stay is tailored with private butler hospitality and royal dining experiences.',
        address: {
          street: 'Pichola Island, Near City Palace',
          city: 'Udaipur',
          state: 'Rajasthan',
          country: 'India',
          postalCode: '313001',
        },
        locationCoordinates: { lat: 24.5764, lng: 73.6835 },
        starRating: 5,
        propertyType: 'palace',
        amenities: [
          'High-Speed Wi-Fi',
          'Infinity Swimming Pool',
          'Ayurvedic Royal Spa',
          'Fine Dining Restaurant',
          'Private Boat Transfer',
          '24/7 Butler Service',
          'Lakeview Rooftop Bar',
          'Valet Parking',
          'Air Conditioning',
        ],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80',
            caption: 'Exterior palace facade reflecting over Lake Pichola at sunset',
            isPrimary: true,
          },
          {
            url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
            caption: 'Royal courtyard with traditional Mewari arches and marble fountains',
          },
          {
            url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
            caption: 'Grand lakeside dining terrace under starlit skies',
          },
        ],
        featured: true,
        averageRating: 4.9,
        totalReviews: 28,
      },
      {
        name: 'Aguada Cove Beach Resort & Villas',
        slug: 'aguada-cove-beach-resort-villas',
        tagline: 'Portuguese-Goan coastal elegance nestled among swaying coconut palms',
        description:
          'Tucked along a secluded sun-drenched stretch of Sinquerim beach, Aguada Cove balances Portuguese colonial architecture with contemporary barefoot luxury. Private plunge pool villas, sea-facing cabanas, and fresh coastal seafood define this idyllic sanctuary on the Arabian Sea.',
        address: {
          street: 'Aguada Fort Road, Candolim Beachside',
          city: 'Goa',
          state: 'Goa',
          country: 'India',
          postalCode: '403515',
        },
        locationCoordinates: { lat: 15.4989, lng: 73.7698 },
        starRating: 5,
        propertyType: 'resort',
        amenities: [
          'High-Speed Wi-Fi',
          'Private Beach Access',
          'Swimming Pool',
          'Seafood Grill & Bar',
          'Water Sports Centre',
          'Spa & Wellness',
          'Airport Shuttle',
          'Valet Parking',
        ],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1600&q=80',
            caption: 'Palm-fringed coastal pool overlooking the ocean',
            isPrimary: true,
          },
          {
            url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
            caption: 'Luxury beach villa patio with private sun loungers',
          },
        ],
        featured: true,
        averageRating: 4.8,
        totalReviews: 19,
      },
      {
        name: 'The Amber Courtyard & Heritage Haveli',
        slug: 'the-amber-courtyard-heritage-haveli',
        tagline: 'Authentic 19th-century royal courtyard living in the Pink City',
        description:
          'Located in the heart of Jaipur with views toward the Nahargarh ramparts, The Amber Courtyard is an impeccably restored noble haveli. Admire intricate frescoes, stroll through fragrant jasmine gardens, and savor traditional thalis prepared from heirloom recipes.',
        address: {
          street: 'Civil Lines, Near Raj Mandir',
          city: 'Jaipur',
          state: 'Rajasthan',
          country: 'India',
          postalCode: '302006',
        },
        locationCoordinates: { lat: 26.9124, lng: 75.7873 },
        starRating: 5,
        propertyType: 'heritage',
        amenities: [
          'High-Speed Wi-Fi',
          'Swimming Pool',
          'Traditional Puppet & Sitar Nights',
          'Rooftop Fort-View Restaurant',
          'Heritage Library',
          'Ayurvedic Massage',
          'Air Conditioning',
        ],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?auto=format&fit=crop&w=1600&q=80',
            caption: 'Haveli courtyard with handcrafted stone jalis and lanterns',
            isPrimary: true,
          },
          {
            url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
            caption: 'Opulent suite with four-poster bed and brass filigree accents',
          },
        ],
        featured: true,
        averageRating: 4.9,
        totalReviews: 24,
      },
      {
        name: 'Highland Mist Estate & Tea Sanctuary',
        slug: 'highland-mist-estate-tea-sanctuary',
        tagline: 'Breathtaking serenity enveloped in the verdant rolling hills of the Western Ghats',
        description:
          'Perched at 5,400 feet amidst rolling emerald tea gardens, Highland Mist offers an intimate highland retreat. Crisp mountain breezes, private colonial fireplaces, curated tea-tasting trails, and floor-to-ceiling glass pavilions bring the drama of the misty Western Ghats into your room.',
        address: {
          street: 'Chithirapuram Post, Tea Valley Road',
          city: 'Munnar',
          state: 'Kerala',
          country: 'India',
          postalCode: '685565',
        },
        locationCoordinates: { lat: 10.0889, lng: 77.0595 },
        starRating: 4,
        propertyType: 'boutique',
        amenities: [
          'High-Speed Wi-Fi',
          'Tea Tasting Trails',
          'Organic Garden-to-Table Dining',
          'Fireplace Lounges',
          'Heated Infinity Pool',
          'Bird Watching Tours',
          'Free Parking',
        ],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80',
            caption: 'Highland chalets overlooking cascading mist and green tea slopes',
            isPrimary: true,
          },
        ],
        featured: false,
        averageRating: 4.7,
        totalReviews: 15,
      },
      {
        name: 'The Imperial Grand Chanakyapuri',
        slug: 'the-imperial-grand-chanakyapuri',
        tagline: 'Art deco majesty and diplomatic sanctuary in New Delhi',
        description:
          'Set within manicured lawns in the prestigious diplomatic enclave of Chanakyapuri, The Imperial Grand seamlessly unites 1930s Art Deco architecture with cutting-edge executive luxury. Home to Michelin-calibre dining and Delhi’s most distinguished afternoon tea salon.',
        address: {
          street: 'Janpath Diplomatic Enclave',
          city: 'New Delhi',
          state: 'Delhi',
          country: 'India',
          postalCode: '110001',
        },
        locationCoordinates: { lat: 28.6139, lng: 77.209 },
        starRating: 5,
        propertyType: 'business',
        amenities: [
          'High-Speed Wi-Fi',
          'Executive Boardrooms',
          'Temperature-Controlled Pool',
          'Fitness Centre & Sauna',
          'Award-Winning Bakery',
          'Airport Limousine Transfer',
          'Valet Parking',
        ],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80',
            caption: 'Majestic colonnaded entrance and private royal driveway',
            isPrimary: true,
          },
        ],
        featured: true,
        averageRating: 4.8,
        totalReviews: 32,
      },
    ];

    const createdHotels = await Hotel.insertMany(hotelsData);
    const udaipurHotel = createdHotels[0];
    const goaHotel = createdHotels[1];
    const jaipurHotel = createdHotels[2];

    // 3. Assign Staff Accounts to Hotels
    const staffUdaipur = await User.create({
      name: 'Raghavendra Rathore',
      email: 'staff.udaipur@shreehotels.com',
      password: 'Staff@123',
      role: 'staff',
      phone: '+91 94140 55221',
      assignedHotelId: udaipurHotel._id,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    });

    await User.create({
      name: 'Raghavendra Rathore',
      email: 'staff.udaipur@hotelpro.com',
      password: 'Staff@123',
      role: 'staff',
      phone: '+91 94140 55221',
      assignedHotelId: udaipurHotel._id,
    });

    const staffGoa = await User.create({
      name: 'Maria Fernandes',
      email: 'staff.goa@shreehotels.com',
      password: 'Staff@123',
      role: 'staff',
      phone: '+91 98221 66334',
      assignedHotelId: goaHotel._id,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    });

    await User.create({
      name: 'Maria Fernandes',
      email: 'staff.goa@hotelpro.com',
      password: 'Staff@123',
      role: 'staff',
      phone: '+91 98221 66334',
      assignedHotelId: goaHotel._id,
    });

    // 4. Create Room Types & Room Inventory
    console.log('[Seed] Seeding room categories and room inventories...');
    const roomTypesData = [
      // Udaipur
      {
        hotelId: udaipurHotel._id,
        name: 'Palace Garden Chamber',
        type: 'deluxe',
        description: 'Elegantly appointed room with jharokha bay window overlooking private Mughal gardens.',
        basePricePerNight: 8500,
        capacityAdults: 2,
        capacityChildren: 1,
        maxOccupancy: 3,
        totalRoomsCount: 6,
        bedType: 'King Bed',
        roomSizeSqFt: 520,
        amenities: ['Garden View', 'Heritage Jharokha', 'Rain Shower', 'Espresso Bar', 'High-Speed Wi-Fi'],
        photos: ['https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1000&q=80'],
      },
      {
        hotelId: udaipurHotel._id,
        name: 'Royal Lakeview Suite',
        type: 'suite',
        description: 'Expansive suite featuring sweeping panoramic views of Lake Pichola and the City Palace.',
        basePricePerNight: 16500,
        capacityAdults: 3,
        capacityChildren: 1,
        maxOccupancy: 4,
        totalRoomsCount: 4,
        bedType: 'Royal Canopied King Bed',
        roomSizeSqFt: 850,
        amenities: ['Panoramic Lake View', 'Private Balcony', 'Clawfoot Soaking Tub', '24/7 Butler Service'],
        photos: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80'],
      },
      // Goa
      {
        hotelId: goaHotel._id,
        name: 'Ocean Breeze Deluxe Room',
        type: 'deluxe',
        description: 'Bright coastal room featuring handcrafted teak furniture and balcony with ocean breezes.',
        basePricePerNight: 7200,
        capacityAdults: 2,
        capacityChildren: 1,
        maxOccupancy: 3,
        totalRoomsCount: 8,
        bedType: 'King Bed',
        roomSizeSqFt: 480,
        amenities: ['Sea View Balcony', 'Outdoor Daybed', 'Tropical Shower', 'Organic Toiletries'],
        photos: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80'],
      },
      {
        hotelId: goaHotel._id,
        name: 'Private Plunge Pool Villa',
        type: 'suite',
        description: 'Stand-alone luxury villa with enclosed courtyard and temperature-controlled private plunge pool.',
        basePricePerNight: 22000,
        capacityAdults: 2,
        capacityChildren: 2,
        maxOccupancy: 4,
        totalRoomsCount: 3,
        bedType: 'King Bed + Sofa Bed',
        roomSizeSqFt: 1100,
        amenities: ['Private Plunge Pool', 'Outdoor Rain Shower', 'Sun Deck', 'Complimentary Champagne'],
        photos: ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80'],
      },
      // Jaipur
      {
        hotelId: jaipurHotel._id,
        name: 'Heritage Courtyard Room',
        type: 'deluxe',
        description: 'Hand-painted floral frescoes, antique brass lamps, and plush bedding in a serene haveli setting.',
        basePricePerNight: 6400,
        capacityAdults: 2,
        capacityChildren: 1,
        maxOccupancy: 3,
        totalRoomsCount: 6,
        bedType: 'King Bed',
        roomSizeSqFt: 460,
        amenities: ['Courtyard View', 'Antique Brass Accents', 'Handmade Rugs', 'Organic Herbal Teas'],
        photos: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80'],
      },
    ];

    const createdRoomTypes = await RoomType.insertMany(roomTypesData);
    const udaipurDeluxe = createdRoomTypes[0];
    const udaipurSuite = createdRoomTypes[1];
    const goaDeluxe = createdRoomTypes[2];

    // Create RoomInventory units for operational staff dashboard
    const roomInventoryData = [
      // Udaipur Deluxe Rooms
      { hotelId: udaipurHotel._id, roomTypeId: udaipurDeluxe._id, roomNumber: '101', floor: 1, status: 'occupied', assignedGuestName: 'Ananya Sharma' },
      { hotelId: udaipurHotel._id, roomTypeId: udaipurDeluxe._id, roomNumber: '102', floor: 1, status: 'available' },
      { hotelId: udaipurHotel._id, roomTypeId: udaipurDeluxe._id, roomNumber: '103', floor: 1, status: 'dirty', notes: 'Scheduled for evening linen refresh' },
      { hotelId: udaipurHotel._id, roomTypeId: udaipurDeluxe._id, roomNumber: '104', floor: 1, status: 'maintenance', notes: 'AC sensor replacement' },
      { hotelId: udaipurHotel._id, roomTypeId: udaipurDeluxe._id, roomNumber: '105', floor: 1, status: 'available' },
      // Udaipur Suite Rooms
      { hotelId: udaipurHotel._id, roomTypeId: udaipurSuite._id, roomNumber: '201', floor: 2, status: 'available' },
      { hotelId: udaipurHotel._id, roomTypeId: udaipurSuite._id, roomNumber: '202', floor: 2, status: 'available' },
      // Goa Rooms
      { hotelId: goaHotel._id, roomTypeId: goaDeluxe._id, roomNumber: 'G-01', floor: 1, status: 'available' },
      { hotelId: goaHotel._id, roomTypeId: goaDeluxe._id, roomNumber: 'G-02', floor: 1, status: 'occupied', assignedGuestName: 'Karan Mehra' },
      { hotelId: goaHotel._id, roomTypeId: goaDeluxe._id, roomNumber: 'G-03', floor: 1, status: 'dirty' },
    ];
    await RoomInventory.insertMany(roomInventoryData);

    // 5. Seed Promotional Offers
    console.log('[Seed] Seeding promotional coupons...');
    await Offer.insertMany([
      {
        code: 'ROYAL15',
        title: 'Rajputana Heritage Escape',
        description: '15% instant reduction on luxury palace suites across Rajasthan.',
        discountPercentage: 15,
        maxDiscountAmount: 5000,
        minBookingAmount: 10000,
        validUntil: new Date('2028-12-31'),
        active: true,
      },
      {
        code: 'COASTAL20',
        title: 'Goan Coastal Sunshine',
        description: '20% discount on 3+ nights villa and beach resort reservations.',
        discountPercentage: 20,
        maxDiscountAmount: 6000,
        minBookingAmount: 12000,
        validUntil: new Date('2028-12-31'),
        active: true,
      },
      {
        code: 'WELCOME10',
        title: 'HotelPro Guest Welcome Offer',
        description: 'Flat 10% off your first stay across all HotelPro boutique stays.',
        discountPercentage: 10,
        maxDiscountAmount: 3000,
        minBookingAmount: 4000,
        validUntil: new Date('2028-12-31'),
        active: true,
      },
      {
        code: 'WELCOME15',
        title: 'HotelPro Royal Welcome Privilege',
        description: '15% instant reduction on your initial stay reservation.',
        discountPercentage: 15,
        maxDiscountAmount: 5000,
        minBookingAmount: 5000,
        validUntil: new Date('2028-12-31'),
        active: true,
      },
    ]);

    // 6. Seed Sample Bookings (Active, Completed, Cancelled)
    console.log('[Seed] Seeding real booking lifecycles...');

    // Past completed booking (Eligible for review)
    const pastCheckIn = new Date();
    pastCheckIn.setDate(pastCheckIn.getDate() - 10);
    const pastCheckOut = new Date();
    pastCheckOut.setDate(pastCheckOut.getDate() - 7);

    const pastBooking = await Booking.create({
      bookingReference: 'HP-2026-PAST01',
      userId: guestUser._id,
      hotelId: udaipurHotel._id,
      roomTypeId: udaipurDeluxe._id,
      checkIn: pastCheckIn,
      checkOut: pastCheckOut,
      numberOfRooms: 1,
      guests: { adults: 2, children: 0 },
      guestDetails: {
        name: guestUser.name,
        email: guestUser.email,
        phone: guestUser.phone,
        specialRequests: 'Quiet high-floor room with sunset view',
      },
      priceBreakdown: {
        basePricePerNight: 8500,
        nights: 3,
        roomsCount: 1,
        totalBaseCharge: 25500,
        taxPercent: 18,
        taxAmount: 4590,
        serviceFee: 0,
        discountAmount: 0,
        finalAmount: 30090,
      },
      bookingStatus: 'checked_out',
      paymentStatus: 'captured',
      assignedRooms: ['101'],
      invoiceNumber: 'INV-882104',
      createdAt: pastCheckIn,
    });

    // Create verified review from guest for this past stay
    await Review.create({
      bookingId: pastBooking._id,
      userId: guestUser._id,
      hotelId: udaipurHotel._id,
      rating: 5,
      cleanlinessRating: 5,
      serviceRating: 5,
      locationRating: 5,
      amenitiesRating: 5,
      title: 'A royal fairytale come to life on Lake Pichola',
      comment:
        'From the private boat arrival to the flute performance at dusk, our stay at The Mewar Palace was extraordinary. The staff anticipated every need, the food was exquisite, and the morning view of the lake is unforgettable. Truly a world-class hospitality experience.',
      verifiedStay: true,
    });

    // Currently checked-in booking (Today)
    const todayCheckIn = new Date();
    todayCheckIn.setHours(0, 0, 0, 0);
    const futureCheckOut = new Date();
    futureCheckOut.setDate(futureCheckOut.getDate() + 2);

    const currentBooking = await Booking.create({
      bookingReference: 'HP-2026-LIVE99',
      userId: guestUser._id,
      hotelId: udaipurHotel._id,
      roomTypeId: udaipurDeluxe._id,
      checkIn: todayCheckIn,
      checkOut: futureCheckOut,
      numberOfRooms: 1,
      guests: { adults: 2, children: 0 },
      guestDetails: {
        name: guestUser.name,
        email: guestUser.email,
        phone: guestUser.phone,
        specialRequests: 'Extra hypoallergenic pillows',
      },
      priceBreakdown: {
        basePricePerNight: 8500,
        nights: 2,
        roomsCount: 1,
        totalBaseCharge: 17000,
        taxPercent: 18,
        taxAmount: 3060,
        serviceFee: 0,
        discountAmount: 2550,
        couponCode: 'ROYAL15',
        finalAmount: 17510,
      },
      bookingStatus: 'checked_in',
      paymentStatus: 'captured',
      assignedRooms: ['101'],
      invoiceNumber: 'INV-990412',
    });

    // Seed confirmed inventory allocation for active booking
    await reserveRoomInventoryAtomic({
      roomTypeId: udaipurDeluxe._id,
      hotelId: udaipurHotel._id,
      bookingId: currentBooking._id,
      checkIn: todayCheckIn,
      checkOut: futureCheckOut,
      requestedRooms: 1,
    });
    await confirmRoomInventory(currentBooking._id);

    // Seed Active Service Request for this stay
    await ServiceRequest.create({
      hotelId: udaipurHotel._id,
      bookingId: currentBooking._id,
      userId: guestUser._id,
      roomNumber: '101',
      category: 'towels_linens',
      title: 'Additional bath sheet and botanical soaps',
      details: 'Please provide two extra bath sheets and organic jasmine soaps before 7 PM.',
      priority: 'medium',
      status: 'pending',
    });

    // Seed Active Housekeeping Tasks
    await HousekeepingTask.create({
      hotelId: udaipurHotel._id,
      roomNumber: '103',
      taskType: 'daily_clean',
      priority: 'medium',
      status: 'pending',
      notes: 'Guest requested afternoon refresh after 2 PM',
    });

    // Seed Welcome Notification
    await Notification.create({
      userId: guestUser._id,
      title: 'Welcome to SHREE श्री',
      message: 'Explore handpicked luxury heritage sanctuaries across India with exclusive member privileges.',
      type: 'system',
      link: '/stays',
    });

    console.log('[Seed] Database successfully populated!');
    console.log('--------------------------------------------------');
    console.log('SHREE श्री DEMO ACCOUNTS READY FOR EVALUATION & VIVA:');
    console.log('  Admin:         admin@shreehotels.com (or admin@hotelpro.com)         / Admin@123');
    console.log('  Staff Udaipur: staff.udaipur@shreehotels.com (or staff.udaipur)     / Staff@123');
    console.log('  Staff Goa:     staff.goa@shreehotels.com (or staff.goa)             / Staff@123');
    console.log('  Guest:         guest@shreehotels.com (or guest@hotelpro.com)         / Guest@123');
    console.log('--------------------------------------------------');
  } catch (err) {
    console.error('[Seed] Error seeding database:', err);
    throw err;
  }
};

// If run directly via CLI: `node src/utils/seedData.js`
if (process.argv[1].endsWith('seedData.js')) {
  (async () => {
    await connectDB();
    await seedDatabase();
    await disconnectDB();
    process.exit(0);
  })();
}

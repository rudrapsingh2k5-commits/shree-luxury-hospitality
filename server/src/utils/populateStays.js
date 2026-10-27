import { Hotel, RoomType, RoomInventory, Offer } from '../models/index.js';
import { hotelCatalog } from './hotelCatalogData.js';
import { connectDB, disconnectDB } from '../config/db.js';

export const populateStaysCatalog = async ({ force = false } = {}) => {
  try {
    console.log(`[Catalog] Synchronizing ${hotelCatalog.length} curated luxury stays and location images...`);

    let insertedHotelsCount = 0;
    let updatedHotelsCount = 0;
    let insertedRoomsCount = 0;

    for (const hotelData of hotelCatalog) {
      const { roomTypes, ...hotelFields } = hotelData;

      // Check if hotel already exists by slug
      let hotel = await Hotel.findOne({ slug: hotelFields.slug });
      if (!hotel) {
        hotel = await Hotel.create(hotelFields);
        insertedHotelsCount++;
      } else {
        // Synchronize accurate location images and details
        hotel.name = hotelFields.name;
        hotel.images = hotelFields.images;
        hotel.tagline = hotelFields.tagline;
        hotel.description = hotelFields.description;
        hotel.address = hotelFields.address;
        hotel.locationCoordinates = hotelFields.locationCoordinates;
        hotel.amenities = hotelFields.amenities;
        hotel.starRating = hotelFields.starRating;
        hotel.propertyType = hotelFields.propertyType;
        await hotel.save();
        updatedHotelsCount++;
      }

      if (roomTypes && roomTypes.length > 0) {
        for (const roomData of roomTypes) {
          let roomType = await RoomType.findOne({ hotelId: hotel._id, name: roomData.name });
          if (!roomType) {
            roomType = await RoomType.create({
              ...roomData,
              hotelId: hotel._id,
            });
            insertedRoomsCount++;

            // Create inventory units for room availability & housekeeping
            const totalUnits = roomData.totalRoomsCount || 4;
            const inventoryUnits = [];
            for (let i = 1; i <= totalUnits; i++) {
              const roomNumber = `${i < 10 ? '10' : '1'}${i}`;
              const exists = await RoomInventory.findOne({ hotelId: hotel._id, roomNumber });
              if (!exists) {
                inventoryUnits.push({
                  hotelId: hotel._id,
                  roomTypeId: roomType._id,
                  roomNumber,
                  floor: 1,
                  status: 'available',
                });
              }
            }
            if (inventoryUnits.length > 0) {
              await RoomInventory.insertMany(inventoryUnits);
            }
          } else {
            // Update room photos with location-matched imagery
            roomType.photos = roomData.photos;
            roomType.basePricePerNight = roomData.basePricePerNight;
            roomType.description = roomData.description;
            await roomType.save();
          }
        }
      }
    }

    // Populate standard promotional offers if none exist
    const offerCount = await Offer.countDocuments();
    if (offerCount === 0) {
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
          title: 'SHREE श्री Welcome Privilege',
          description: 'Flat 10% off your initial reservation across all sanctuaries.',
          discountPercentage: 10,
          maxDiscountAmount: 3000,
          minBookingAmount: 4000,
          validUntil: new Date('2028-12-31'),
          active: true,
        },
      ]);
    }

    const finalTotal = await Hotel.countDocuments();
    console.log(
      `[Catalog] Successfully synchronized ${finalTotal} luxury stays (inserted: ${insertedHotelsCount}, updated: ${updatedHotelsCount}, rooms: ${insertedRoomsCount}) in database!`
    );
    return {
      success: true,
      count: finalTotal,
      insertedHotels: insertedHotelsCount,
      updatedHotels: updatedHotelsCount,
      insertedRooms: insertedRoomsCount,
    };
  } catch (err) {
    console.error('[Catalog Error] Failed to populate hotel catalog:', err);
    throw err;
  }
};

// If executed via CLI: `node src/utils/populateStays.js`
if (process.argv[1]?.endsWith('populateStays.js')) {
  (async () => {
    try {
      await connectDB();
      await populateStaysCatalog();
      await disconnectDB();
      console.log('Catalog population complete.');
      process.exit(0);
    } catch (err) {
      console.error('Catalog script failed:', err.message);
      process.exit(1);
    }
  })();
}

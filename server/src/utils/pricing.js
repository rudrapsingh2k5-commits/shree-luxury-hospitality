/**
 * HotelPro Pricing Engine
 * Computes stay nights, Indian GST tax slabs, promo code discounts, and paise amounts.
 */

export const calculateNights = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  // Zero out time components for date-based night calculation
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
};

export const calculateStayPrice = ({
  basePricePerNight,
  checkIn,
  checkOut,
  numberOfRooms = 1,
  offer = null,
}) => {
  const nights = calculateNights(checkIn, checkOut);
  const totalBaseCharge = Math.round(basePricePerNight * nights * numberOfRooms);

  // Indian Hospitality GST slab:
  // Under ₹7,500/night -> 12% GST
  // ₹7,500/night & above -> 18% GST
  const taxPercent = basePricePerNight >= 7500 ? 18 : 12;

  // Apply promotional offer discount if applicable
  let discountAmount = 0;
  let couponCode = '';

  if (offer && offer.active) {
    if (totalBaseCharge >= (offer.minBookingAmount || 0)) {
      const calculatedDiscount = Math.round(
        (totalBaseCharge * offer.discountPercentage) / 100
      );
      discountAmount = Math.min(
        calculatedDiscount,
        offer.maxDiscountAmount || calculatedDiscount
      );
      couponCode = offer.code;
    }
  }

  const taxableAmount = Math.max(0, totalBaseCharge - discountAmount);
  const taxAmount = Math.round((taxableAmount * taxPercent) / 100);
  const serviceFee = 0; // Transparent zero hidden fees
  const finalAmount = taxableAmount + taxAmount + serviceFee;
  const amountInPaise = finalAmount * 100;

  return {
    basePricePerNight,
    nights,
    roomsCount: numberOfRooms,
    totalBaseCharge,
    taxPercent,
    taxAmount,
    serviceFee,
    discountAmount,
    couponCode,
    finalAmount,
    amountInPaise,
  };
};

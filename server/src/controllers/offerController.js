import { Offer } from '../models/index.js';

export const getActiveOffers = async (req, res) => {
  try {
    const offers = await Offer.find({
      active: true,
      validUntil: { $gte: new Date() },
    }).sort({ discountPercentage: -1 });

    return res.status(200).json({ success: true, offers });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch offers.' });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { code, bookingAmount = 0 } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required.' });
    }

    const offer = await Offer.findOne({
      code: code.trim().toUpperCase(),
      active: true,
      validUntil: { $gte: new Date() },
    });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired promotional code.',
      });
    }

    if (bookingAmount < offer.minBookingAmount) {
      return res.status(400).json({
        success: false,
        message: `This coupon requires a minimum booking amount of ₹${offer.minBookingAmount.toLocaleString('en-IN')}.`,
      });
    }

    const discount = Math.min(
      Math.round((bookingAmount * offer.discountPercentage) / 100),
      offer.maxDiscountAmount || 5000
    );

    return res.status(200).json({
      success: true,
      offer,
      calculatedDiscount: discount,
      message: `Coupon ${offer.code} applied! ₹${discount.toLocaleString('en-IN')} off.`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

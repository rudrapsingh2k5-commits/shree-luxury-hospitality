import { Favorite, Hotel } from '../models/index.js';

export const toggleFavorite = async (req, res) => {
  try {
    const { hotelId } = req.body;
    if (!hotelId || !hotelId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Valid hotelId is required.' });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel || !hotel.active) {
      return res.status(404).json({ success: false, message: 'Hotel not found or inactive.' });
    }

    const existing = await Favorite.findOne({
      userId: req.user._id,
      hotelId: hotel._id,
    });

    if (existing) {
      await Favorite.findByIdAndDelete(existing._id);
      return res.status(200).json({
        success: true,
        isFavorited: false,
        message: 'Removed from saved hotels.',
      });
    } else {
      await Favorite.create({
        userId: req.user._id,
        hotelId: hotel._id,
      });
      return res.status(201).json({
        success: true,
        isFavorited: true,
        message: 'Saved to your favorites.',
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to toggle favorite.' });
  }
};

export const getMyFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user._id })
      .populate('hotelId')
      .sort({ createdAt: -1 });

    const hotels = favorites
      .map((f) => f.hotelId)
      .filter((h) => h && h.active);

    return res.status(200).json({ success: true, favorites: hotels });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch favorites.' });
  }
};

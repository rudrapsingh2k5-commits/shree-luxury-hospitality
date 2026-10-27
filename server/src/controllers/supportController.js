import { SupportTicket, AuditLog } from '../models/index.js';

export const createSupportTicket = async (req, res) => {
  try {
    const { name, email, subject, message, category = 'general' } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, subject, and message are required.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Inquiry message must be at least 10 characters long.',
      });
    }

    const allowedCategories = ['general', 'reservation', 'payment', 'cancellation', 'concierge'];
    const safeCategory = allowedCategories.includes(category) ? category : 'general';

    const ticket = await SupportTicket.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      category: safeCategory,
      message: message.trim(),
      userId: req.user?._id || null,
      ipAddress: req.ip,
      status: 'open',
    });

    return res.status(201).json({
      success: true,
      message: 'Your inquiry has been received by our hospitality desk. A concierge will respond shortly.',
      ticket: {
        _id: ticket._id,
        subject: ticket.subject,
        category: ticket.category,
        createdAt: ticket.createdAt,
      },
    });
  } catch (err) {
    console.error('createSupportTicket error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit support inquiry.' });
  }
};

export const getSupportTickets = async (req, res) => {
  try {
    const { status, category } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    const tickets = await SupportTicket.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({ success: true, tickets });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch tickets.' });
  }
};

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hotelpro_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format error message
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const customMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred. Please try again.';
    
    // Auto logout on token expiration
    if (error.response?.status === 401 && localStorage.getItem('hotelpro_token')) {
      // Don't auto-clear if it was a login attempt
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('hotelpro_token');
        localStorage.removeItem('hotelpro_user');
        window.dispatchEvent(new Event('hotelpro:auth-change'));
      }
    }

    return Promise.reject(new Error(customMessage));
  }
);

/* ==========================================================================
   DOMAIN API CLIENTS
   ========================================================================== */

// Auth
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
};

// Hotels
export const hotelApi = {
  getHotels: (params) => api.get('/hotels', { params }),
  getFeatured: () => api.get('/hotels/featured'),
  getBySlug: (slug) => api.get(`/hotels/slug/${slug}`),
  getById: (id) => api.get(`/hotels/${id}`),
  create: (data) => api.post('/hotels', data),
  update: (id, data) => api.put(`/hotels/${id}`, data),
};

// Rooms
export const roomApi = {
  getByHotel: (hotelId) => api.get(`/rooms/hotel/${hotelId}`),
  getQuote: (roomTypeId, params) => api.get(`/rooms/${roomTypeId}/quote`, { params }),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
};

// Bookings
export const bookingApi = {
  create: (bookingData) => api.post('/bookings', bookingData),
  getMyBookings: () => api.get('/bookings/my-bookings'),
  getByReference: (reference) => api.get(`/bookings/${reference}`),
  cancel: (id, reason) => api.put(`/bookings/${id}/cancel`, { reason }),
};

// Payments (Stripe Gateway with GBP (£) billing and INR (₹) website display)
export const paymentApi = {
  getConfig: () => api.get('/payments/config'),
  createIntent: (bookingId) => api.post('/payments/create-intent', { bookingId }),
  createOrder: (bookingId) => api.post('/payments/create-intent', { bookingId }),
  confirmPayment: (paymentDetails) => api.post('/payments/confirm', paymentDetails),
  verifyPayment: (paymentDetails) => api.post('/payments/confirm', paymentDetails),
  getStatus: (paymentId) => api.get(`/payments/${paymentId}/status`),
  processRefund: (bookingId, amount) => api.post('/payments/refund', { bookingId, amount }),
};

// Reviews
export const reviewApi = {
  create: (reviewData) => api.post('/reviews', reviewData),
  getByHotel: (hotelId) => api.get(`/reviews/hotel/${hotelId}`),
};

// Favorites
export const favoriteApi = {
  toggle: (hotelId) => api.post('/favorites/toggle', { hotelId }),
  getMyFavorites: () => api.get('/favorites/my-favorites'),
};

// Service Requests
export const serviceRequestApi = {
  create: (requestData) => api.post('/service-requests', requestData),
  getMyRequests: () => api.get('/service-requests/my-requests'),
  updateStatus: (id, status, staffNotes) =>
    api.put(`/service-requests/${id}/status`, { status, staffNotes }),
};

// Offers / Coupons
export const offerApi = {
  getActive: () => api.get('/offers'),
  validateCoupon: (code, bookingAmount) =>
    api.post('/offers/validate', { code, bookingAmount }),
};

// Notifications
export const notificationApi = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
};

// Staff
export const staffApi = {
  getMetrics: (hotelId) => api.get('/staff/metrics', { params: { hotelId } }),
  checkIn: (bookingId, roomNumbers) => api.post('/staff/check-in', { bookingId, roomNumbers }),
  checkOut: (bookingId) => api.post('/staff/check-out', { bookingId }),
  updateRoomStatus: (roomId, status, notes) =>
    api.put(`/staff/rooms/${roomId}/status`, { status, notes }),
  getHousekeeping: () => api.get('/staff/housekeeping'),
  updateHousekeeping: (taskId, status, notes) =>
    api.put(`/staff/housekeeping/${taskId}`, { status, notes }),
  updateStatus: (id, status, staffNotes) =>
    api.put(`/service-requests/${id}/status`, { status, staffNotes }),
};

// Support Inquiries
export const supportApi = {
  createTicket: (data) => api.post('/support/tickets', data),
  getTickets: (params) => api.get('/support/tickets', { params }),
};

// Admin
export const adminApi = {
  getAnalytics: (params) => api.get('/admin/analytics', { params }),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (userId, role, assignedHotelId, isActive) =>
    api.put(`/admin/users/${userId}`, { role, assignedHotelId, isActive }),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  exportBookingsCSV: () => api.get('/admin/export-bookings-csv', { responseType: 'blob' }),
};

export default api;

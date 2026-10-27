/**
 * Currency Conversion Utilities
 * SHREE श्री Luxury Hospitality
 * 
 * Website pricing remains in Indian Rupees (INR / ₹).
 * Payments dispatched to Stripe are billed in British Pounds (GBP / £).
 */

const DEFAULT_INR_TO_GBP_RATE = 105.0; // 1 GBP = 105 INR

/**
 * Get current configured exchange rate (INR per 1 GBP)
 * @returns {number}
 */
export const getExchangeRate = () => {
  const envRate = parseFloat(process.env.INR_TO_GBP_EXCHANGE_RATE);
  if (!isNaN(envRate) && envRate > 0) {
    return envRate;
  }
  return DEFAULT_INR_TO_GBP_RATE;
};

/**
 * Convert Indian Rupees (INR) to British Pounds (GBP)
 * @param {number} amountInr - Amount in INR (₹)
 * @param {number} [customRate] - Optional custom exchange rate
 * @returns {{
 *   amountInr: number,
 *   amountGbp: number,
 *   gbpPence: number,
 *   exchangeRate: number,
 *   currency: string,
 *   currencySymbol: string
 * }}
 */
export const convertInrToGbp = (amountInr, customRate = null) => {
  const rate = customRate && customRate > 0 ? customRate : getExchangeRate();
  const safeInr = Math.max(0, Number(amountInr) || 0);

  // Calculate GBP amount with 2 decimal places
  const amountGbp = Number((safeInr / rate).toFixed(2));

  // Stripe requires amount in smallest currency unit (pence for GBP: 1 GBP = 100 pence)
  const gbpPence = Math.round(amountGbp * 100);

  return {
    amountInr: safeInr,
    amountGbp,
    gbpPence,
    exchangeRate: rate,
    currency: 'gbp',
    currencySymbol: '£',
  };
};

/**
 * Convert British Pounds (GBP) to Indian Rupees (INR)
 * @param {number} amountGbp - Amount in GBP (£)
 * @param {number} [customRate] - Optional custom exchange rate
 * @returns {number} Amount in INR
 */
export const convertGbpToInr = (amountGbp, customRate = null) => {
  const rate = customRate && customRate > 0 ? customRate : getExchangeRate();
  return Number(((Number(amountGbp) || 0) * rate).toFixed(2));
};

/**
 * Format currency for display
 */
export const formatInr = (amount) => {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
};

export const formatGbp = (amount) => {
  return `£${Number(amount || 0).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

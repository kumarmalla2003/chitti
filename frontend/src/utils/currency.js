// frontend/src/utils/currency.js

/**
 * Currency formatting utilities.
 * All amounts throughout the project are in RUPEES (integer).
 */

/**
 * Format amount in rupees with Indian locale.
 * @param {number} rupees - Amount in rupees
 * @returns {string} - Formatted string (e.g., "1,00,000")
 */
export const formatRupees = (rupees) => {
    if (rupees === null || rupees === undefined) return "0";
    return Number(rupees).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
};

/**
 * Parse a formatted currency string back to a number.
 * @param {string} value - Formatted currency string (may contain commas)
 * @returns {number} - Parsed number
 */
export const parseCurrencyString = (value) => {
    if (!value) return 0;
    const cleaned = value.toString().replace(/,/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
};

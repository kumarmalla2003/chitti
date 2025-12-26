// frontend/src/features/chits/utils/normalizeChit.js

import { toYearMonth, getFirstDayOfMonth } from "../../../utils/formatters";

/**
 * Transforms API chit data into form-compatible format.
 * @param {Object} chit - Chit data from API
 * @returns {Object} Form-compatible chit data
 */
export const normalizeChitForForm = (chit) => {
  if (!chit) return null;

  return {
    name: chit.name || "",
    chit_value: chit.chit_value || "",
    size: chit.size || "",
    chit_type: chit.chit_type || "fixed",
    base_contribution: chit.base_contribution || 0,
    payout_premium_percent: chit.payout_premium_percent || 0,
    foreman_commission_percent: chit.foreman_commission_percent || 0,
    duration_months: chit.duration_months || "",
    start_date: toYearMonth(chit.start_date),
    end_date: toYearMonth(chit.end_date),
    collection_day: chit.collection_day || "",
    payout_day: chit.payout_day || "",
    notes: chit.notes || "",
  };
};

/**
 * Capitalizes the first letter of a string.
 * @param {string} str - Input string
 * @returns {string} String with first letter capitalized
 */
export const capitalizeFirstLetter = (str) => {
  if (!str || typeof str !== "string") return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Transforms form data into API-compatible format for creation.
 * @param {Object} formData - Form data from react-hook-form
 * @returns {Object} API-compatible chit data
 */
export const normalizeFormDataForApi = (formData) => {
  const apiData = {
    ...formData,
    name: capitalizeFirstLetter(formData.name?.trim()),
    start_date: getFirstDayOfMonth(formData.start_date),
  };

  // Backend calculates end_date, so remove it
  delete apiData.end_date;

  return apiData;
};

/**
 * Compares form data with original data and returns only changed fields.
 * @param {Object} formData - Current form data
 * @param {Object} originalData - Original chit data from API
 * @returns {Object} Object containing only changed fields
 */
export const getChangedFields = (formData, originalData) => {
  if (!originalData) return formData;

  const changes = {};

  for (const key in formData) {
    if (originalData[key] !== undefined && formData[key] != originalData[key]) {
      changes[key] = formData[key];
    }
  }

  // Capitalize name if changed
  if (changes.name) {
    changes.name = capitalizeFirstLetter(changes.name?.trim());
  }

  // Transform start_date if changed
  if (changes.start_date) {
    changes.start_date = getFirstDayOfMonth(changes.start_date);
  }

  // Remove end_date from changes (backend calculates it)
  delete changes.end_date;

  return changes;
};

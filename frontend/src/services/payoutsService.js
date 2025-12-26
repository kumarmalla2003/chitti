import api from '../lib/api';

const BASE_URL = '/payouts';

const handleError = (error, defaultMessage) => {
  if (error.response?.data?.detail) {
    throw new Error(error.response.data.detail);
  }
  throw new Error(defaultMessage);
};

/**
 * Get all slots (payouts). Response uses ChitSlot format.
 * GET /payouts
 */
export const getAllPayouts = async (filters = {}) => {
  const params = {};
  if (filters.status) params.status = filters.status;

  try {
    const response = await api.get(`${BASE_URL}`, { params });
    return response.data;
  } catch (error) {
    handleError(error, "Failed to fetch payouts.");
  }
};

/**
 * Get all slots (payouts) for a specific chit.
 * GET /payouts/chit/{chitId}
 */
export const getPayoutsByChitId = async (chitId) => {
  try {
    const response = await api.get(`${BASE_URL}/chit/${chitId}`);
    return response.data;
  } catch (error) {
    handleError(error, "Failed to fetch payouts for this chit.");
  }
};

/**
 * Get all slots (payouts) for a specific member.
 * GET /payouts/member/{memberId}
 */
export const getPayoutsByMemberId = async (memberId) => {
  try {
    const response = await api.get(`${BASE_URL}/member/${memberId}`);
    return response.data;
  } catch (error) {
    handleError(error, "Failed to fetch payouts for this member.");
  }
};

/**
 * Get a specific slot (payout) by ID.
 * GET /payouts/{slotId}
 */
export const getPayoutById = async (id) => {
  try {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    handleError(error, "Failed to fetch payout details.");
  }
};

/**
 * Update a slot (payout).
 * PUT /payouts/{slotId}
 */
export const updatePayout = async (id, payoutData) => {
  try {
    const response = await api.put(
      `${BASE_URL}/${id}`,
      payoutData
    );
    return response.data;
  } catch (error) {
    handleError(error, "Failed to update payout.");
  }
};

// Note: Payouts (slots) are not deleted, only unassigned via slots API
// This export is kept for backwards compatibility but does nothing
export const deletePayout = async () => {
  console.warn('deletePayout is deprecated. Use slots API to unassign members.');
  return Promise.resolve();
};

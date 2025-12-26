import api from '../lib/api';

const BASE_URL = '/chits';

export const getAllChits = async () => {
  const response = await api.get(BASE_URL);
  return response.data;
};

export const createChit = async (chitData) => {
  const response = await api.post(BASE_URL, chitData);
  return response.data;
};

export const getChitById = async (chitId) => {
  const response = await api.get(`${BASE_URL}/${chitId}`);
  return response.data;
};

export const updateChit = async (chitId, chitData) => {
  const response = await api.put(`${BASE_URL}/${chitId}`, chitData);
  return response.data;
};

export const patchChit = async (chitId, chitData) => {
  const response = await api.patch(`${BASE_URL}/${chitId}`, chitData);
  return response.data;
};

export const deleteChit = async (chitId) => {
  await api.delete(`${BASE_URL}/${chitId}`);
};

/**
 * Check if a chit name is available (not already in use).
 * @param {string} name - Name to check
 * @returns {Promise<{available: boolean}>}
 */
export const checkChitNameAvailability = async (name) => {
  const response = await api.get(`${BASE_URL}/check-name`, { params: { name } });
  return response.data;
};

/**
 * Record an auction for a specific month.
 * @param {number} chitId
 * @param {number} month
 * @param {number} bidAmount
 * @param {number} memberId
 */
export const recordAuction = async (chitId, month, bidAmount, memberId) => {
  const response = await api.post(`${BASE_URL}/${chitId}/auctions`, {
    month,
    bid_amount: bidAmount,
    member_id: memberId
  });
  return response.data;
};

/**
 * Get per-member breakdown for a specific month.
 * Shows all assigned members with their expected contribution and payment status.
 * @param {number} chitId
 * @param {number} month
 * @returns {Promise<{month: number, month_date: string, chit_id: number, chit_name: string, size: number, total_expected: number, total_collected: number, collection_percentage: number, members: Array}>}
 */
export const getMonthMembers = async (chitId, month) => {
  const response = await api.get(`${BASE_URL}/${chitId}/months/${month}/members`);
  return response.data;
};

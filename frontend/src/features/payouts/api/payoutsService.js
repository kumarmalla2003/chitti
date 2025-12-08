// frontend/src/services/payoutsService.js

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/payouts`;

const handleError = async (response, defaultMessage) => {
  try {
    const errorData = await response.json();
    throw new Error(errorData.detail || defaultMessage);
  } catch (e) {
    throw new Error(e.message || defaultMessage);
  }
};

/**
 * Gets all payouts.
 * @param {Object} filters
 * @returns {Promise<Array>}
 */
export const getAllPayouts = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  if (filters.chitId) queryParams.append("chit_id", filters.chitId);
  if (filters.memberId) queryParams.append("member_id", filters.memberId);
  if (filters.startDate) queryParams.append("start_date", filters.startDate);
  if (filters.endDate) queryParams.append("end_date", filters.endDate);

  const response = await fetch(`${API_URL}/all?${queryParams.toString()}`, {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok) await handleError(response, "Failed to fetch payouts.");
  return response.json();
};

/**
 * Gets payouts by chit ID.
 * @param {string} chitId
 * @returns {Promise<Array>}
 */
export const getPayoutsByChitId = async (chitId) => {
  const response = await fetch(`${API_URL}/chit/${chitId}`, {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok)
    await handleError(response, "Failed to fetch payouts for this chit.");
  return response.json();
};

/**
 * Gets payouts by member ID.
 * @param {string} memberId
 * @returns {Promise<Array>}
 */
export const getPayoutsByMemberId = async (memberId) => {
  const response = await fetch(`${API_URL}/member/${memberId}`, {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok)
    await handleError(response, "Failed to fetch payouts for this member.");
  return response.json();
};

/**
 * Gets a payout by ID.
 * @param {string} id
 * @returns {Promise<Object>}
 */
export const getPayoutById = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok)
    await handleError(response, "Failed to fetch payout details.");
  return response.json();
};

/**
 * Updates a payout.
 * @param {string} id
 * @param {Object} payoutData
 * @returns {Promise<Object>}
 */
export const updatePayout = async (id, payoutData) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payoutData),
    credentials: "include",
  });
  if (!response.ok) await handleError(response, "Failed to update payout.");
  return response.json();
};

/**
 * Deletes a payout.
 * @param {string} id
 * @returns {Promise<Object>}
 */
export const deletePayout = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) await handleError(response, "Failed to delete payout.");
  return response.json();
};

// frontend/src/services/payoutsService.js

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/payouts`;

const getAuthHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const handleError = async (response, defaultMessage) => {
  try {
    const errorData = await response.json();
    throw new Error(errorData.detail || defaultMessage);
  } catch (e) {
    throw new Error(e.message || defaultMessage);
  }
};

export const getAllPayouts = async (token, filters = {}) => {
  const queryParams = new URLSearchParams();
  if (filters.chitId) queryParams.append("chit_id", filters.chitId);
  if (filters.memberId) queryParams.append("member_id", filters.memberId);
  if (filters.startDate) queryParams.append("start_date", filters.startDate);
  if (filters.endDate) queryParams.append("end_date", filters.endDate);

  const response = await fetch(`${API_URL}/all?${queryParams.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  if (!response.ok) await handleError(response, "Failed to fetch payouts.");
  return response.json();
};

export const getPayoutsByChitId = async (chitId, token) => {
  const response = await fetch(`${API_URL}/chit/${chitId}`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  if (!response.ok)
    await handleError(response, "Failed to fetch payouts for this chit.");
  return response.json();
};

export const getPayoutsByMemberId = async (memberId, token) => {
  const response = await fetch(`${API_URL}/member/${memberId}`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  if (!response.ok)
    await handleError(response, "Failed to fetch payouts for this member.");
  return response.json();
};

export const getPayoutById = async (id, token) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  if (!response.ok)
    await handleError(response, "Failed to fetch payout details.");
  return response.json();
};

export const updatePayout = async (id, payoutData, token) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payoutData),
  });
  if (!response.ok) await handleError(response, "Failed to update payout.");
  return response.json();
};

export const deletePayout = async (id, token) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
  if (!response.ok) await handleError(response, "Failed to delete payout.");
  return response.json();
};

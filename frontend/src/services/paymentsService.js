// frontend/src/services/paymentsService.js

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/payments`;

const getAuthHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

// Helper to extract specific error messages from the backend
const handleError = async (response, defaultMessage) => {
  try {
    const errorData = await response.json();
    throw new Error(errorData.detail || defaultMessage);
  } catch (e) {
    // Handle cases where .json() fails or errorData.detail doesn't exist
    throw new Error(e.message || defaultMessage);
  }
};

// --- NEW (Phase 2) ---
export const createPayment = async (paymentData, token) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(paymentData),
  });
  if (!response.ok) {
    await handleError(response, "Failed to log payment.");
  }
  return response.json();
};

// --- NEW (Phase 2) ---
export const getAllPayments = async (token, filters = {}) => {
  const queryParams = new URLSearchParams();
  if (filters.groupId) queryParams.append("group_id", filters.groupId);
  if (filters.memberId) queryParams.append("member_id", filters.memberId);

  const response = await fetch(`${API_URL}?${queryParams.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    await handleError(response, "Failed to fetch payments.");
  }
  return response.json();
};

// --- NEW (Phase 2) ---
export const getPaymentById = async (paymentId, token) => {
  const response = await fetch(`${API_URL}/${paymentId}`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    await handleError(response, "Failed to fetch payment details.");
  }
  return response.json();
};

// --- NEW (Phase 2) ---
export const patchPayment = async (paymentId, paymentData, token) => {
  const response = await fetch(`${API_URL}/${paymentId}`, {
    method: "PATCH",
    headers: getAuthHeaders(token),
    body: JSON.stringify(paymentData),
  });
  if (!response.ok) {
    await handleError(response, "Failed to update payment.");
  }
  return response.json();
};

// --- NEW (Phase 2) ---
export const deletePayment = async (paymentId, token) => {
  const response = await fetch(`${API_URL}/${paymentId}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    await handleError(response, "Failed to delete payment.");
  }
  return;
};

// --- Phase 1 (Unchanged) ---
export const getPaymentsByGroupId = async (groupId, token) => {
  const response = await fetch(`${API_URL}/group/${groupId}`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    await handleError(
      response,
      "Failed to fetch payment history for the group."
    );
  }
  return response.json();
};

export const getPaymentsByMemberId = async (memberId, token) => {
  const response = await fetch(`${API_URL}/member/${memberId}`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    await handleError(
      response,
      "Failed to fetch payment history for the member."
    );
  }
  return response.json();
};

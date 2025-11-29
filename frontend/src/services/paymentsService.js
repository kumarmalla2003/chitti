// frontend/src/services/paymentsService.js

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/payments`;

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

// --- MODIFIED FUNCTION ---
export const getAllPayments = async (token, filters = {}) => {
  const queryParams = new URLSearchParams();
  if (filters.chitId) queryParams.append("chit_id", filters.chitId);
  if (filters.memberId) queryParams.append("member_id", filters.memberId);

  // --- DATE FILTERS ADDED ---
  if (filters.startDate) queryParams.append("start_date", filters.startDate);
  if (filters.endDate) queryParams.append("end_date", filters.endDate);

  const response = await fetch(`${API_URL}?${queryParams.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    await handleError(response, "Failed to fetch payments.");
  }
  return response.json();
};

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

export const getPaymentsByChitId = async (chitId, token) => {
  const response = await fetch(`${API_URL}/chit/${chitId}`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    await handleError(
      response,
      "Failed to fetch payment history for the chit."
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

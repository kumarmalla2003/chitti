// frontend/src/services/chitsService.js

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/chits`;

const getAuthHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export const getAllChits = async (token) => {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed. Please log in again.");
    }
    throw new Error("Failed to fetch chits. Please try again.");
  }

  const data = await response.json();
  if (!data.chits) {
    throw new Error("Invalid data format received from the server.");
  }

  return data;
};

export const createChit = async (chitData, token) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(chitData),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed. Please log in again.");
    }
    if (response.status === 422 || response.status === 409) {
      const errorData = await response.json();
      const detail =
        errorData.detail?.[0]?.msg || errorData.detail || "An error occurred.";
      throw new Error(detail);
    }
    throw new Error("Failed to create chit. Please try again.");
  }

  return response.json();
};

export const getChitById = async (chitId, token) => {
  const response = await fetch(`${API_URL}/${chitId}`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed. Please log in again.");
    }
    if (response.status === 404) {
      throw new Error("Chit not found.");
    }
    throw new Error("Failed to fetch chit details. Please try again.");
  }

  return response.json();
};

export const updateChit = async (chitId, chitData, token) => {
  const response = await fetch(`${API_URL}/${chitId}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(chitData),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed. Please log in again.");
    }
    if (response.status === 404) {
      throw new Error("Chit not found.");
    }
    throw new Error("Failed to update chit. Please try again.");
  }

  return response.json();
};

export const patchChit = async (chitId, chitData, token) => {
  const response = await fetch(`${API_URL}/${chitId}`, {
    method: "PATCH",
    headers: getAuthHeaders(token),
    body: JSON.stringify(chitData),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed. Please log in again.");
    }
    if (response.status === 404) {
      throw new Error("Chit not found.");
    }
    if (response.status === 422 || response.status === 409) {
      const errorData = await response.json();
      const detail =
        errorData.detail?.[0]?.msg || errorData.detail || "An error occurred.";
      throw new Error(detail);
    }
    throw new Error("Failed to update chit. Please try again.");
  }

  return response.json();
};

export const deleteChit = async (chitId, token) => {
  const response = await fetch(`${API_URL}/${chitId}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    if (response.status === 409) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "This chit cannot be deleted.");
    }
    throw new Error("Failed to delete chit.");
  }
  return;
};

// --- Payouts Service Functions ---

export const getPayouts = async (chitId, token) => {
  const response = await fetch(`${API_URL}/${chitId}/payouts`, {
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch payouts.");
  }
  return response.json();
};

export const updatePayout = async (payoutId, payoutData, token) => {
  const response = await fetch(`${API_URL}/payouts/${payoutId}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(payoutData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to update payout.");
  }
  return response.json();
};

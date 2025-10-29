// frontend/src/services/chitsService.js

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/chits`;

const getAuthHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export const getAllChitGroups = async (token) => {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed. Please log in again.");
    }
    throw new Error("Failed to fetch chit groups. Please try again.");
  }

  const data = await response.json();
  if (!data.groups) {
    throw new Error("Invalid data format received from the server.");
  }

  return data;
};

export const createChitGroup = async (groupData, token) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(groupData),
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
    throw new Error("Failed to create chit group. Please try again.");
  }

  return response.json();
};

export const getChitGroupById = async (groupId, token) => {
  const response = await fetch(`${API_URL}/${groupId}`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed. Please log in again.");
    }
    if (response.status === 404) {
      throw new Error("Chit group not found.");
    }
    throw new Error("Failed to fetch chit group details. Please try again.");
  }

  return response.json();
};

export const updateChitGroup = async (groupId, groupData, token) => {
  const response = await fetch(`${API_URL}/${groupId}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(groupData),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed. Please log in again.");
    }
    if (response.status === 404) {
      throw new Error("Chit group not found.");
    }
    throw new Error("Failed to update chit group. Please try again.");
  }

  return response.json();
};

export const patchChitGroup = async (groupId, groupData, token) => {
  const response = await fetch(`${API_URL}/${groupId}`, {
    method: "PATCH",
    headers: getAuthHeaders(token),
    body: JSON.stringify(groupData),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication failed. Please log in again.");
    }
    if (response.status === 404) {
      throw new Error("Chit group not found.");
    }
    if (response.status === 422 || response.status === 409) {
      const errorData = await response.json();
      const detail =
        errorData.detail?.[0]?.msg || errorData.detail || "An error occurred.";
      throw new Error(detail);
    }
    throw new Error("Failed to update chit group. Please try again.");
  }

  return response.json();
};

export const deleteChitGroup = async (groupId, token) => {
  const response = await fetch(`${API_URL}/${groupId}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    if (response.status === 409) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "This group cannot be deleted.");
    }
    throw new Error("Failed to delete chit group.");
  }
  return;
};

// --- Payouts Service Functions ---

export const getPayouts = async (groupId, token) => {
  const response = await fetch(`${API_URL}/${groupId}/payouts`, {
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

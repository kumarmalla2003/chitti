// frontend/src/services/collectionsService.js

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/collections`;

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

export const createCollection = async (collectionData, token) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(collectionData),
  });
  if (!response.ok) {
    await handleError(response, "Failed to log collection.");
  }
  return response.json();
};

// --- MODIFIED FUNCTION ---
export const getAllCollections = async (token, filters = {}) => {
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
    await handleError(response, "Failed to fetch collections.");
  }
  return response.json();
};

export const getCollectionById = async (collectionId, token) => {
  const response = await fetch(`${API_URL}/${collectionId}`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    await handleError(response, "Failed to fetch collection details.");
  }
  return response.json();
};

export const patchCollection = async (collectionId, collectionData, token) => {
  const response = await fetch(`${API_URL}/${collectionId}`, {
    method: "PATCH",
    headers: getAuthHeaders(token),
    body: JSON.stringify(collectionData),
  });
  if (!response.ok) {
    await handleError(response, "Failed to update collection.");
  }
  return response.json();
};

export const deleteCollection = async (collectionId, token) => {
  const response = await fetch(`${API_URL}/${collectionId}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    await handleError(response, "Failed to delete collection.");
  }
  return;
};

export const getCollectionsByChitId = async (chitId, token) => {
  const response = await fetch(`${API_URL}/chit/${chitId}`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    await handleError(
      response,
      "Failed to fetch collection history for the chit."
    );
  }
  return response.json();
};

export const getCollectionsByMemberId = async (memberId, token) => {
  const response = await fetch(`${API_URL}/member/${memberId}`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    await handleError(
      response,
      "Failed to fetch collection history for the member."
    );
  }
  return response.json();
};

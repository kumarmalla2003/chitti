// frontend/src/services/collectionsService.js

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/collections`;

const handleError = async (response, defaultMessage) => {
  try {
    const errorData = await response.json();
    throw new Error(errorData.detail || defaultMessage);
  } catch (e) {
    throw new Error(e.message || defaultMessage);
  }
};

/**
 * Creates a collection.
 * @param {Object} collectionData
 * @returns {Promise<Object>}
 */
export const createCollection = async (collectionData) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(collectionData),
    credentials: "include",
  });
  if (!response.ok) {
    await handleError(response, "Failed to log collection.");
  }
  return response.json();
};

/**
 * Gets all collections.
 * @param {Object} filters
 * @returns {Promise<Array>}
 */
export const getAllCollections = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  if (filters.chitId) queryParams.append("chit_id", filters.chitId);
  if (filters.memberId) queryParams.append("member_id", filters.memberId);

  // --- DATE FILTERS ADDED ---
  if (filters.startDate) queryParams.append("start_date", filters.startDate);
  if (filters.endDate) queryParams.append("end_date", filters.endDate);

  const response = await fetch(`${API_URL}?${queryParams.toString()}`, {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok) {
    await handleError(response, "Failed to fetch collections.");
  }
  return response.json();
};

/**
 * Gets a collection by ID.
 * @param {string} collectionId
 * @returns {Promise<Object>}
 */
export const getCollectionById = async (collectionId) => {
  const response = await fetch(`${API_URL}/${collectionId}`, {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok) {
    await handleError(response, "Failed to fetch collection details.");
  }
  return response.json();
};

/**
 * Patches a collection.
 * @param {string} collectionId
 * @param {Object} collectionData
 * @returns {Promise<Object>}
 */
export const patchCollection = async (collectionId, collectionData) => {
  const response = await fetch(`${API_URL}/${collectionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(collectionData),
    credentials: "include",
  });
  if (!response.ok) {
    await handleError(response, "Failed to update collection.");
  }
  return response.json();
};

/**
 * Deletes a collection.
 * @param {string} collectionId
 * @returns {Promise<void>}
 */
export const deleteCollection = async (collectionId) => {
  const response = await fetch(`${API_URL}/${collectionId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    await handleError(response, "Failed to delete collection.");
  }
  return;
};

/**
 * Gets collections by chit ID.
 * @param {string} chitId
 * @returns {Promise<Array>}
 */
export const getCollectionsByChitId = async (chitId) => {
  const response = await fetch(`${API_URL}/chit/${chitId}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    await handleError(
      response,
      "Failed to fetch collection history for the chit."
    );
  }
  return response.json();
};

/**
 * Gets collections by member ID.
 * @param {string} memberId
 * @returns {Promise<Array>}
 */
export const getCollectionsByMemberId = async (memberId) => {
  const response = await fetch(`${API_URL}/member/${memberId}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    await handleError(
      response,
      "Failed to fetch collection history for the member."
    );
  }
  return response.json();
};

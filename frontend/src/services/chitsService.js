// frontend/src/services/chitsService.js

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/chits`;

/**
 * Fetches all chits.
 * @returns {Promise<Array>} List of chits.
 * @throws {Error} If fetch fails.
 */
export const getAllChits = async () => {
  const response = await fetch(API_URL, {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("Authentication failed.");
    throw new Error("Failed to fetch chits.");
  }
  return response.json();
};

/**
 * Creates a new chit.
 * @param {Object} chitData - The chit data.
 * @returns {Promise<Object>} The created chit.
 * @throws {Error} If creation fails.
 */
export const createChit = async (chitData) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(chitData),
    credentials: "include",
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to create chit.");
  }
  return response.json();
};

/**
 * Gets a chit by ID.
 * @param {string} chitId - The chit ID.
 * @returns {Promise<Object>} The chit details.
 * @throws {Error} If fetch fails.
 */
export const getChitById = async (chitId) => {
  const response = await fetch(`${API_URL}/${chitId}`, {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch chit details.");
  return response.json();
};

/**
 * Updates a chit.
 * @param {string} chitId - The chit ID.
 * @param {Object} chitData - The updated chit data.
 * @returns {Promise<Object>} The updated chit.
 * @throws {Error} If update fails.
 */
export const updateChit = async (chitId, chitData) => {
  const response = await fetch(`${API_URL}/${chitId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(chitData),
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to update chit.");
  return response.json();
};

/**
 * Patches a chit.
 * @param {string} chitId - The chit ID.
 * @param {Object} chitData - The partial chit data.
 * @returns {Promise<Object>} The updated chit.
 * @throws {Error} If update fails.
 */
export const patchChit = async (chitId, chitData) => {
  const response = await fetch(`${API_URL}/${chitId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(chitData),
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to update chit.");
  return response.json();
};

/**
 * Deletes a chit.
 * @param {string} chitId - The chit ID.
 * @returns {Promise<void>}
 * @throws {Error} If deletion fails.
 */
export const deleteChit = async (chitId) => {
  const response = await fetch(`${API_URL}/${chitId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to delete chit.");
  return;
};

import api from '../lib/api';

const BASE_URL = '/collections';

const handleError = (error, defaultMessage) => {
  if (error.response?.data?.detail) {
    throw new Error(error.response.data.detail);
  }
  throw new Error(defaultMessage);
};

/**
 * Get all collections (both scheduled and collected) for schedule display.
 */
export const getAllCollections = async (filters = {}) => {
  const params = {};
  if (filters.chitId) params.chit_id = filters.chitId;
  if (filters.memberId) params.member_id = filters.memberId;
  if (filters.startDate) params.start_date = filters.startDate;
  if (filters.endDate) params.end_date = filters.endDate;

  try {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  } catch (error) {
    handleError(error, "Failed to fetch collections.");
  }
};

/**
 * Get collections filtered by status.
 * Use getAllCollections() with status filter instead.
 * Backend supports: ?status=scheduled | partial | collected | overdue
 */

/**
 * Get a single collection by ID.
 */
export const getCollectionById = async (collectionId) => {
  try {
    const response = await api.get(`${BASE_URL}/${collectionId}`);
    return response.data;
  } catch (error) {
    handleError(error, "Failed to fetch collection details.");
  }
};

/**
 * Get all collections for a specific chit.
 */
export const getCollectionsByChitId = async (chitId) => {
  try {
    const response = await api.get(`${BASE_URL}/chit/${chitId}`);
    return response.data;
  } catch (error) {
    handleError(error, "Failed to fetch collection history for the chit.");
  }
};

/**
 * Get all collections for a specific member.
 */
export const getCollectionsByMemberId = async (memberId) => {
  try {
    const response = await api.get(`${BASE_URL}/member/${memberId}`);
    return response.data;
  } catch (error) {
    handleError(error, "Failed to fetch collection history for the member.");
  }
};

/**
 * Update a collection (record actual payment or update expected amount).
 * Uses PUT for the schedule-based workflow.
 */
export const updateCollection = async (collectionId, collectionData) => {
  try {
    const response = await api.put(
      `${BASE_URL}/${collectionId}`,
      collectionData
    );
    return response.data;
  } catch (error) {
    handleError(error, "Failed to update collection.");
  }
};

/**
 * Reset a collection to scheduled state (clears actual payment data).
 * Uses DELETE endpoint which resets instead of deleting.
 */
export const resetCollection = async (collectionId) => {
  try {
    const response = await api.delete(`${BASE_URL}/${collectionId}`);
    return response.data;
  } catch (error) {
    handleError(error, "Failed to reset collection.");
  }
};

// Backward compatibility aliases
export const patchCollection = updateCollection;
export const deleteCollection = resetCollection;
export const createCollection = async (collectionData) => {
  // Note: In the new workflow, collections are created automatically as schedules.
  // This function is kept for backward compatibility but simply updates an existing collection.
  if (collectionData.id) {
    return updateCollection(collectionData.id, collectionData);
  }
  throw new Error("Collection creation is now automatic. Use updateCollection to record payments.");
};

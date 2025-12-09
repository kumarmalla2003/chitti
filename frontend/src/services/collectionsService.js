import api from '../lib/api';

const BASE_URL = '/collections';

const handleError = (error, defaultMessage) => {
  if (error.response?.data?.detail) {
    throw new Error(error.response.data.detail);
  }
  throw new Error(defaultMessage);
};

export const createCollection = async (collectionData) => {
  try {
    const response = await api.post(BASE_URL, collectionData);
    return response.data;
  } catch (error) {
    handleError(error, "Failed to log collection.");
  }
};

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

export const getCollectionById = async (collectionId) => {
  try {
    const response = await api.get(`${BASE_URL}/${collectionId}`);
    return response.data;
  } catch (error) {
    handleError(error, "Failed to fetch collection details.");
  }
};

export const patchCollection = async (collectionId, collectionData) => {
  try {
    const response = await api.patch(`${BASE_URL}/${collectionId}`, collectionData);
    return response.data;
  } catch (error) {
    handleError(error, "Failed to update collection.");
  }
};

export const deleteCollection = async (collectionId) => {
  try {
    await api.delete(`${BASE_URL}/${collectionId}`);
  } catch (error) {
    handleError(error, "Failed to delete collection.");
  }
};

export const getCollectionsByChitId = async (chitId) => {
  try {
    const response = await api.get(`${BASE_URL}/chit/${chitId}`);
    return response.data;
  } catch (error) {
    handleError(error, "Failed to fetch collection history for the chit.");
  }
};

export const getCollectionsByMemberId = async (memberId) => {
  try {
    const response = await api.get(`${BASE_URL}/member/${memberId}`);
    return response.data;
  } catch (error) {
    handleError(error, "Failed to fetch collection history for the member.");
  }
};

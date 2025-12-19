import api from '../lib/api';

const BASE_URL = '/chits';

export const getAllChits = async () => {
  const response = await api.get(BASE_URL);
  return response.data;
};

export const createChit = async (chitData) => {
  const response = await api.post(BASE_URL, chitData);
  return response.data;
};

export const getChitById = async (chitId) => {
  const response = await api.get(`${BASE_URL}/${chitId}`);
  return response.data;
};

export const updateChit = async (chitId, chitData) => {
  const response = await api.put(`${BASE_URL}/${chitId}`, chitData);
  return response.data;
};

export const patchChit = async (chitId, chitData) => {
  const response = await api.patch(`${BASE_URL}/${chitId}`, chitData);
  return response.data;
};

export const deleteChit = async (chitId) => {
  await api.delete(`${BASE_URL}/${chitId}`);
};

/**
 * Check if a chit name is available (not already in use).
 * @param {string} name - Name to check
 * @returns {Promise<{available: boolean}>}
 */
export const checkChitNameAvailability = async (name) => {
  const response = await api.get(`${BASE_URL}/check-name`, { params: { name } });
  return response.data;
};

import api from '../lib/api';

const BASE_URL = '/payouts';

const handleError = (error, defaultMessage) => {
  if (error.response?.data?.detail) {
    throw new Error(error.response.data.detail);
  }
  throw new Error(defaultMessage);
};

export const getAllPayouts = async (filters = {}) => {
  const params = {};
  if (filters.chitId) params.chit_id = filters.chitId;
  if (filters.memberId) params.member_id = filters.memberId;
  if (filters.startDate) params.start_date = filters.startDate;
  if (filters.endDate) params.end_date = filters.endDate;

  try {
    // Call base /payouts endpoint which returns ALL payouts (including unpaid)
    const response = await api.get(`${BASE_URL}`, { params });
    return response.data;
  } catch (error) {
    handleError(error, "Failed to fetch payouts.");
  }
};

export const getPayoutsByChitId = async (chitId) => {
  try {
    const response = await api.get(`${BASE_URL}/chit/${chitId}`);
    return response.data;
  } catch (error) {
    handleError(error, "Failed to fetch payouts for this chit.");
  }
};

export const getPayoutsByMemberId = async (memberId) => {
  try {
    const response = await api.get(`${BASE_URL}/member/${memberId}`);
    return response.data;
  } catch (error) {
    handleError(error, "Failed to fetch payouts for this member.");
  }
};

export const getPayoutById = async (id) => {
  try {
    const response = await api.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    handleError(error, "Failed to fetch payout details.");
  }
};

export const updatePayout = async (id, payoutData) => {
  try {
    const response = await api.put(`${BASE_URL}/${id}`, payoutData);
    return response.data;
  } catch (error) {
    handleError(error, "Failed to update payout.");
  }
};

export const deletePayout = async (id) => {
  try {
    const response = await api.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    handleError(error, "Failed to delete payout.");
  }
};

import api from '../lib/api';

const BASE_URL = '/members';

export const searchMembers = async (query) => {
  try {
    const response = await api.get(`${BASE_URL}/search`, { params: { query } });
    return response.data;
  } catch (error) {
    throw new Error("Failed to search for members.");
  }
};

export const createMember = async (memberData) => {
  try {
    const response = await api.post(BASE_URL, memberData);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      throw new Error(
        error.response.data?.detail || "A member with this phone number already exists."
      );
    }
    throw new Error("Failed to create new member.");
  }
};

export const updateMember = async (memberId, memberData) => {
  try {
    const response = await api.put(`${BASE_URL}/${memberId}`, memberData);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      throw new Error(
        error.response.data?.detail || "This phone number is already in use."
      );
    }
    throw new Error("Failed to update member.");
  }
};

export const patchMember = async (memberId, memberData) => {
  try {
    const response = await api.patch(`${BASE_URL}/${memberId}`, memberData);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      throw new Error(
        error.response.data?.detail || "This phone number is already in use."
      );
    }
    throw new Error("Failed to update member.");
  }
};

export const getAllMembers = async () => {
  try {
    const response = await api.get(BASE_URL);
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch members.");
  }
};

export const getMemberById = async (memberId) => {
  try {
    const response = await api.get(`${BASE_URL}/${memberId}`);
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch member details.");
  }
};

export const deleteMember = async (memberId) => {
  try {
    await api.delete(`${BASE_URL}/${memberId}`);
  } catch (error) {
    if (error.response?.status === 409) {
      throw new Error(error.response.data?.detail || "This member cannot be deleted.");
    }
    throw new Error("Failed to delete member.");
  }
};

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
    throw new Error("Failed to create chit group. Please try again.");
  }

  return response.json();
};

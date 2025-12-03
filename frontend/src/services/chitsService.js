// frontend/src/services/chitsService.js

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/chits`;

const getAuthHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export const getAllChits = async (token) => {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("Authentication failed.");
    throw new Error("Failed to fetch chits.");
  }
  return response.json();
};

export const createChit = async (chitData, token) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(chitData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to create chit.");
  }
  return response.json();
};

export const getChitById = async (chitId, token) => {
  const response = await fetch(`${API_URL}/${chitId}`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to fetch chit details.");
  return response.json();
};

export const updateChit = async (chitId, chitData, token) => {
  const response = await fetch(`${API_URL}/${chitId}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(chitData),
  });
  if (!response.ok) throw new Error("Failed to update chit.");
  return response.json();
};

export const patchChit = async (chitId, chitData, token) => {
  const response = await fetch(`${API_URL}/${chitId}`, {
    method: "PATCH",
    headers: getAuthHeaders(token),
    body: JSON.stringify(chitData),
  });
  if (!response.ok) throw new Error("Failed to update chit.");
  return response.json();
};

export const deleteChit = async (chitId, token) => {
  const response = await fetch(`${API_URL}/${chitId}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });
  if (!response.ok) throw new Error("Failed to delete chit.");
  return;
};

// frontend/src/services/membersService.js

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/members`;

const getAuthHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export const searchMembers = async (query, token) => {
  const response = await fetch(
    `${API_URL}/search?query=${encodeURIComponent(query)}`,
    {
      method: "GET",
      headers: getAuthHeaders(token),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to search for members.");
  }
  return response.json();
};

export const createMember = async (memberData, token) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(memberData),
  });

  if (!response.ok) {
    if (response.status === 409) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || "A member with this phone number already exists."
      );
    }
    throw new Error("Failed to create new member.");
  }
  return response.json();
};

export const updateMember = async (memberId, memberData, token) => {
  const response = await fetch(`${API_URL}/${memberId}`, {
    method: "PUT",
    headers: getAuthHeaders(token),
    body: JSON.stringify(memberData),
  });

  if (!response.ok) {
    if (response.status === 409) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || "This phone number is already in use."
      );
    }
    throw new Error("Failed to update member.");
  }
  return response.json();
};

// --- ADD THIS NEW FUNCTION ---
export const patchMember = async (memberId, memberData, token) => {
  const response = await fetch(`${API_URL}/${memberId}`, {
    method: "PATCH",
    headers: getAuthHeaders(token),
    body: JSON.stringify(memberData),
  });

  if (!response.ok) {
    if (response.status === 409) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail || "This phone number is already in use."
      );
    }
    throw new Error("Failed to update member.");
  }
  return response.json();
};

export const getAllMembers = async (token) => {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch members.");
  }
  return response.json();
};

export const getMemberById = async (memberId, token) => {
  const response = await fetch(`${API_URL}/${memberId}`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch member details.");
  }
  return response.json();
};

export const deleteMember = async (memberId, token) => {
  const response = await fetch(`${API_URL}/${memberId}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    if (response.status === 409) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "This member cannot be deleted.");
    }
    throw new Error("Failed to delete member.");
  }
  // No content is returned on successful deletion (204)
  return;
};

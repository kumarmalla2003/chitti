// frontend/src/services/membersService.js

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/members`;

/**
 * Searches for members.
 * @param {string} query - Search query.
 * @returns {Promise<Array>} List of members.
 */
export const searchMembers = async (query) => {
  const response = await fetch(
    `${API_URL}/search?query=${encodeURIComponent(query)}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to search for members.");
  }
  return response.json();
};

/**
 * Creates a new member.
 * @param {Object} memberData - Member data.
 * @returns {Promise<Object>} Created member.
 */
export const createMember = async (memberData) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(memberData),
    credentials: "include",
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

/**
 * Updates a member.
 * @param {string} memberId - Member ID.
 * @param {Object} memberData - Member data.
 * @returns {Promise<Object>} Updated member.
 */
export const updateMember = async (memberId, memberData) => {
  const response = await fetch(`${API_URL}/${memberId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(memberData),
    credentials: "include",
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

/**
 * Patches a member.
 * @param {string} memberId - Member ID.
 * @param {Object} memberData - Member data.
 * @returns {Promise<Object>} Updated member.
 */
export const patchMember = async (memberId, memberData) => {
  const response = await fetch(`${API_URL}/${memberId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(memberData),
    credentials: "include",
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

/**
 * Fetches all members.
 * @returns {Promise<Array>} List of members.
 */
export const getAllMembers = async () => {
  const response = await fetch(API_URL, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch members.");
  }
  return response.json();
};

/**
 * Gets a member by ID.
 * @param {string} memberId - Member ID.
 * @returns {Promise<Object>} Member details.
 */
export const getMemberById = async (memberId) => {
  const response = await fetch(`${API_URL}/${memberId}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch member details.");
  }
  return response.json();
};

/**
 * Deletes a member.
 * @param {string} memberId - Member ID.
 * @returns {Promise<void>}
 */
export const deleteMember = async (memberId) => {
  const response = await fetch(`${API_URL}/${memberId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 409) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "This member cannot be deleted.");
    }
    throw new Error("Failed to delete member.");
  }
  return;
};

// src/services/assignmentsService.js

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/assignments`;
const MEMBERS_API_URL = `${import.meta.env.VITE_API_BASE_URL}/members`;
const CHITS_API_URL = `${import.meta.env.VITE_API_BASE_URL}/chits`;

// --- ADDED: Helper to extract specific error messages from the backend ---
const handleError = async (response, defaultMessage) => {
  try {
    const errorData = await response.json();
    // Use the 'detail' field from the FastAPI error response
    throw new Error(errorData.detail || defaultMessage);
  } catch (e) {
    // Handle cases where .json() fails or errorData.detail doesn't exist
    throw new Error(e.message || defaultMessage);
  }
};

/**
 * Creates an assignment.
 * @param {Object} assignmentData
 * @returns {Promise<Object>}
 */
export const createAssignment = async (assignmentData) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(assignmentData),
    credentials: "include",
  });

  if (!response.ok) {
    await handleError(response, "Failed to create chit assignment.");
  }
  return response.json();
};

/**
 * Creates bulk assignments.
 * @param {string} chitId
 * @param {Array} assignments
 * @returns {Promise<Object>}
 */
export const createBulkAssignments = async (chitId, assignments) => {
  const response = await fetch(`${API_URL}/chit/${chitId}/bulk-assign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ assignments: assignments }), // Wrap in 'assignments' key
    credentials: "include",
  });

  if (!response.ok) {
    await handleError(response, "Failed to save assignments.");
  }
  return response.json();
};

/**
 * Gets unassigned months for a chit.
 * @param {string} chitId
 * @returns {Promise<Array>}
 */
export const getUnassignedMonths = async (chitId) => {
  const response = await fetch(`${API_URL}/unassigned-months/${chitId}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    await handleError(
      response,
      "Failed to fetch available months for the chit."
    );
  }
  return response.json();
};

/**
 * Gets assignments for a member.
 * @param {string} memberId
 * @returns {Promise<Array>}
 */
export const getAssignmentsForMember = async (memberId) => {
  const response = await fetch(`${MEMBERS_API_URL}/${memberId}/assignments`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    await handleError(response, "Failed to member's assignments.");
  }
  return response.json();
};

/**
 * Gets assignments for a chit.
 * @param {string} chitId
 * @returns {Promise<Array>}
 */
export const getAssignmentsForChit = async (chitId) => {
  const response = await fetch(`${CHITS_API_URL}/${chitId}/assignments`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    await handleError(response, "Failed to fetch assignments for the chit.");
  }
  return response.json();
};

/**
 * Deletes an assignment.
 * @param {string} assignmentId
 * @returns {Promise<void>}
 */
export const deleteAssignment = async (assignmentId) => {
  const response = await fetch(`${API_URL}/${assignmentId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    // This will now catch the 409 error and display the specific message
    await handleError(response, "Failed to unassign member.");
  }
  return;
};

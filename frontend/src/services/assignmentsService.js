// frontend/src/services/assignmentsService.js

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/assignments`;
const MEMBERS_API_URL = `${import.meta.env.VITE_API_BASE_URL}/members`;
const CHITS_API_URL = `${import.meta.env.VITE_API_BASE_URL}/chits`;

const getAuthHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

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

export const createAssignment = async (assignmentData, token) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(assignmentData),
  });

  if (!response.ok) {
    await handleError(response, "Failed to create chit assignment.");
  }
  return response.json();
};

export const getUnassignedMonths = async (groupId, token) => {
  const response = await fetch(`${API_URL}/unassigned-months/${groupId}`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    await handleError(
      response,
      "Failed to fetch available months for the group."
    );
  }
  return response.json();
};

export const getAssignmentsForMember = async (memberId, token) => {
  const response = await fetch(`${MEMBERS_API_URL}/${memberId}/assignments`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    await handleError(response, "Failed to member's assignments.");
  }
  return response.json();
};

export const getAssignmentsForGroup = async (groupId, token) => {
  const response = await fetch(`${CHITS_API_URL}/${groupId}/assignments`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    await handleError(response, "Failed to fetch assignments for the group.");
  }
  return response.json();
};

export const deleteAssignment = async (assignmentId, token) => {
  const response = await fetch(`${API_URL}/${assignmentId}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    // This will now catch the 409 error and display the specific message
    await handleError(response, "Failed to unassign member.");
  }
  return;
};

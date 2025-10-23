// frontend/src/services/assignmentsService.js

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/assignments`;
const MEMBERS_API_URL = `${import.meta.env.VITE_API_BASE_URL}/members`;
const CHITS_API_URL = `${import.meta.env.VITE_API_BASE_URL}/chits`; // <-- ADD THIS

const getAuthHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export const createAssignment = async (assignmentData, token) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: JSON.stringify(assignmentData),
  });

  if (!response.ok) {
    throw new Error("Failed to create chit assignment.");
  }
  return response.json();
};

export const getUnassignedMonths = async (groupId, token) => {
  const response = await fetch(`${API_URL}/unassigned-months/${groupId}`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch available months for the group.");
  }
  return response.json();
};

export const getAssignmentsForMember = async (memberId, token) => {
  const response = await fetch(`${MEMBERS_API_URL}/${memberId}/assignments`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch member's assignments.");
  }
  return response.json();
};

// --- ADD THESE NEW FUNCTIONS ---

export const getAssignmentsForGroup = async (groupId, token) => {
  const response = await fetch(`${CHITS_API_URL}/${groupId}/assignments`, {
    method: "GET",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch assignments for the group.");
  }
  return response.json();
};

export const deleteAssignment = async (assignmentId, token) => {
  const response = await fetch(`${API_URL}/${assignmentId}`, {
    method: "DELETE",
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    throw new Error("Failed to unassign member.");
  }
  // A 204 No Content response is expected
  return;
};

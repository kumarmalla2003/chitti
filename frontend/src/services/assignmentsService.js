import api from '../lib/api';

const BASE_URL = '/assignments';
const MEMBERS_URL = '/members';
const CHITS_URL = '/chits';

const handleError = (error, defaultMessage) => {
  if (error.response && error.response.data && error.response.data.detail) {
    throw new Error(error.response.data.detail);
  }
  throw new Error(defaultMessage);
};

export const createAssignment = async (assignmentData) => {
  try {
    const response = await api.post(BASE_URL, assignmentData);
    return response.data;
  } catch (error) {
    handleError(error, "Failed to create chit assignment.");
  }
};

export const createBulkAssignments = async (chitId, assignments) => {
  try {
    const response = await api.post(`${BASE_URL}/chit/${chitId}/bulk-assign`, { assignments });
    return response.data;
  } catch (error) {
    handleError(error, "Failed to save assignments.");
  }
};

export const getUnassignedMonths = async (chitId) => {
  try {
    const response = await api.get(`${BASE_URL}/unassigned-months/${chitId}`);
    return response.data;
  } catch (error) {
    handleError(error, "Failed to fetch available months for the chit.");
  }
};

export const getAssignmentsForMember = async (memberId) => {
  try {
    const response = await api.get(`${MEMBERS_URL}/${memberId}/assignments`);
    return response.data;
  } catch (error) {
    handleError(error, "Failed to member's assignments.");
  }
};

export const getAssignmentsForChit = async (chitId) => {
  try {
    const response = await api.get(`${CHITS_URL}/${chitId}/assignments`);
    return response.data;
  } catch (error) {
    handleError(error, "Failed to fetch assignments for the chit.");
  }
};

export const deleteAssignment = async (assignmentId) => {
  try {
    await api.delete(`${BASE_URL}/${assignmentId}`);
  } catch (error) {
    handleError(error, "Failed to unassign member.");
  }
};

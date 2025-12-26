import api from '../lib/api';

const SLOTS_URL = '/slots';
const MEMBERS_URL = '/members';
const CHITS_URL = '/chits';

const handleError = (error, defaultMessage) => {
  if (error.response && error.response.data && error.response.data.detail) {
    throw new Error(error.response.data.detail);
  }
  throw new Error(defaultMessage);
};

/**
 * Assign a member to a slot for a specific month.
 * POST /slots/chit/{chitId}/assign/{month}
 */
export const assignMemberToSlot = async (chitId, month, memberId) => {
  try {
    const response = await api.post(`${SLOTS_URL}/chit/${chitId}/assign/${month}`, { member_id: memberId });
    return response.data;
  } catch (error) {
    handleError(error, "Failed to assign member to slot.");
  }
};

/**
 * Bulk assign members to slots.
 * POST /slots/chit/{chitId}/bulk-assign
 */
export const bulkAssignMembers = async (chitId, assignments) => {
  try {
    const response = await api.post(`${SLOTS_URL}/chit/${chitId}/bulk-assign`, { assignments });
    return response.data;
  } catch (error) {
    handleError(error, "Failed to save assignments.");
  }
};

/**
 * Get unassigned months for a chit.
 * GET /slots/chit/{chitId}/unassigned
 */
export const getUnassignedMonths = async (chitId) => {
  try {
    const response = await api.get(`${SLOTS_URL}/chit/${chitId}/unassigned`);
    return response.data;
  } catch (error) {
    handleError(error, "Failed to fetch available months for the chit.");
  }
};

/**
 * Get all slots for a specific chit.
 * GET /chits/{chitId}/slots
 */
export const getSlotsForChit = async (chitId) => {
  try {
    const response = await api.get(`${CHITS_URL}/${chitId}/slots`);
    return response.data;
  } catch (error) {
    handleError(error, "Failed to fetch slots for the chit.");
  }
};

/**
 * Get all slots assigned to a member.
 * GET /members/{memberId}/slots
 */
export const getSlotsForMember = async (memberId) => {
  try {
    const response = await api.get(`${MEMBERS_URL}/${memberId}/slots`);
    return response.data;
  } catch (error) {
    handleError(error, "Failed to fetch member's slots.");
  }
};

/**
 * Unassign a member from a slot.
 * DELETE /slots/chit/{chitId}/unassign/{month}
 */
export const unassignMemberFromSlot = async (chitId, month) => {
  try {
    await api.delete(`${SLOTS_URL}/chit/${chitId}/unassign/${month}`);
  } catch (error) {
    handleError(error, "Failed to unassign member.");
  }
};

// Legacy exports for backwards compatibility
export const createAssignment = assignMemberToSlot;
export const createBulkAssignments = bulkAssignMembers;
export const getAssignmentsForChit = getSlotsForChit;
export const getAssignmentsForMember = getSlotsForMember;
export const deleteAssignment = unassignMemberFromSlot;

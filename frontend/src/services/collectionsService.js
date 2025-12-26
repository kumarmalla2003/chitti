/**
 * Collections Service - DEPRECATED
 * 
 * The Collection table has been removed from the backend.
 * Collections are now calculated dynamically based on ChitSlot data.
 * 
 * For collection payments:
 * - Use the Payment API with payment_type: 'collection'
 * - Payments are linked via chit_id + member_id + month
 * 
 * This file is kept for backwards compatibility but all functions
 * will throw errors directing users to the new approach.
 */

const DEPRECATION_MESSAGE = "The Collection API has been deprecated. " +
  "Use the Payment API with payment_type 'collection' and specify chit_id, member_id, and month.";

export const getAllCollections = async () => {
  throw new Error(DEPRECATION_MESSAGE);
};

export const getCollectionById = async () => {
  throw new Error(DEPRECATION_MESSAGE);
};

export const getCollectionsByChitId = async () => {
  throw new Error(DEPRECATION_MESSAGE);
};

export const getCollectionsByMemberId = async () => {
  throw new Error(DEPRECATION_MESSAGE);
};

export const updateCollection = async () => {
  throw new Error(DEPRECATION_MESSAGE);
};

export const resetCollection = async () => {
  throw new Error(DEPRECATION_MESSAGE);
};

// Backward compatibility aliases
export const patchCollection = updateCollection;
export const deleteCollection = resetCollection;
export const createCollection = async () => {
  throw new Error(DEPRECATION_MESSAGE);
};

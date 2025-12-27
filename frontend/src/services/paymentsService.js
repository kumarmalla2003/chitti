import api from '../lib/api';

const BASE_URL = '/payments';

const handleError = (error, defaultMessage) => {
    if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
    }
    throw new Error(defaultMessage);
};

/**
 * Get payments with optional filters.
 * GET /payments
 * Supports filtering by chit_id, member_id, payment_type, etc.
 */
export const getPayments = async (filters = {}) => {
    const params = { ...filters };
    try {
        const response = await api.get(`${BASE_URL}`, { params });
        return response.data;
    } catch (error) {
        handleError(error, "Failed to fetch payments.");
    }
};

/**
 * Create a new payment.
 * POST /payments
 * Expects: { chit_id, member_id, month, amount, payment_type, ... }
 */
export const createPayment = async (paymentData) => {
    try {
        const response = await api.post(`${BASE_URL}`, paymentData);
        return response.data;
    } catch (error) {
        handleError(error, "Failed to create payment.");
    }
};

/**
 * Get a specific payment by ID.
 * GET /payments/{id}
 */
export const getPaymentById = async (id) => {
    try {
        const response = await api.get(`${BASE_URL}/${id}`);
        return response.data;
    } catch (error) {
        handleError(error, "Failed to fetch payment details.");
    }
};

/**
 * Update a payment.
 * PUT /payments/{id}
 */
export const updatePayment = async (id, paymentData) => {
    try {
        const response = await api.put(`${BASE_URL}/${id}`, paymentData);
        return response.data;
    } catch (error) {
        handleError(error, "Failed to update payment.");
    }
};

/**
 * Delete a payment (if supported).
 * DELETE /payments/{id}
 */
export const deletePayment = async (id) => {
    try {
        await api.delete(`${BASE_URL}/${id}`);
    } catch (error) {
        handleError(error, "Failed to delete payment.");
    }
};

// frontend/src/features/chits/components/sections/TransactionsSection/utils/helpers.js

/**
 * Format amount with Indian locale
 */
export const formatAmount = (value) => {
    if (value === 0) return "0";
    if (!value) return "";
    const num = typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;
    if (isNaN(num)) return "";
    return new Intl.NumberFormat("en-IN").format(num);
};

/**
 * Format date as DD MMM YYYY
 */
export const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

/**
 * Format date as DD/MM/YYYY for inputs
 */
export const formatDateShort = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Payment method options
 */
export const PAYMENT_METHODS = [
    { value: "Cash", label: "Cash" },
    { value: "UPI", label: "UPI" },
    { value: "Bank Transfer", label: "Bank Transfer" },
    { value: "Cheque", label: "Cheque" },
    { value: "Other", label: "Other" },
];

/**
 * Status filter options for collections
 */
export const COLLECTION_STATUS_OPTIONS = [
    { value: "Paid", label: "Paid" },
    { value: "Partial", label: "Partial" },
];

/**
 * Status filter options for payouts
 */
export const PAYOUT_STATUS_OPTIONS = [
    { value: "Paid", label: "Paid" },
    { value: "Pending", label: "Pending" },
];

/**
 * Transaction type filter for "All" tab
 */
export const TRANSACTION_TYPE_OPTIONS = [
    { value: "collection", label: "Collections" },
    { value: "payout", label: "Payouts" },
];

/**
 * Items per page
 */
export const ITEMS_PER_PAGE = 10;

// frontend/src/features/chits/components/sections/AssignmentsSection/utils/helpers.js

/**
 * Format number with Indian locale
 */
export const formatIndianNumber = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    const num = typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;
    if (isNaN(num)) return "";
    return num.toLocaleString("en-IN");
};

/**
 * Parse Indian formatted number to raw number
 */
export const parseIndianNumber = (value) => {
    if (!value) return "";
    return value.toString().replace(/,/g, "");
};

/**
 * Format amount for display
 */
export const formatAmount = (value) => {
    if (value === 0) return "0";
    if (!value) return "-";
    return parseInt(value).toLocaleString("en-IN");
};

/**
 * Format date string to DD/MM/YYYY
 */
export const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Format month with index for dropdown display
 * Returns format like "1. 01/2024"
 * @param {string} dateString - ISO date string
 * @param {string} chitStartDate - Chit's start date to calculate month index
 */
export const formatMonthWithIndex = (dateString, chitStartDate) => {
    if (!dateString || !chitStartDate) return "-";

    const date = new Date(dateString);
    const startDate = new Date(chitStartDate);

    // Calculate month index (1-based)
    const monthsDiff = (date.getFullYear() - startDate.getFullYear()) * 12
        + (date.getMonth() - startDate.getMonth()) + 1;

    // Format as MM/YYYY
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${monthsDiff}. ${month}/${year}`;
};

/**
 * Calculate month date string from start date and month index
 */
export const calculateMonthDate = (startDateStr, monthIndex) => {
    if (!startDateStr) return "-";
    const d = new Date(startDateStr);
    d.setMonth(d.getMonth() + (monthIndex - 1));
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    return `${month}/${year}`;
};

/**
 * Convert MM/YYYY to ISO date string
 */
export const monthLabelToISODate = (monthLabel, startDateStr) => {
    if (!startDateStr) return null;
    const [month, year] = monthLabel.split("/");
    const d = new Date(startDateStr);
    d.setFullYear(parseInt(year));
    d.setMonth(parseInt(month) - 1);
    return d.toISOString().split("T")[0];
};

/**
 * Responsive items per page based on screen size
 */
export const getItemsPerPage = () => {
    if (typeof window === "undefined") return 10;
    if (window.innerWidth >= 1024) return 12; // Desktop
    return 10; // Tablet & Mobile
};

/**
 * Filter options for assignments - individual assigned/unassigned per column
 */
export const FILTER_OPTIONS = [
    { value: "members_assigned", label: "Members Assigned" },
    { value: "members_unassigned", label: "Members Unassigned" },
    { value: "payouts_assigned", label: "Payouts Assigned" },
    { value: "payouts_unassigned", label: "Payouts Unassigned" },
    { value: "auctions_assigned", label: "Auctions Assigned" },
    { value: "auctions_unassigned", label: "Auctions Unassigned" },
    { value: "collections_assigned", label: "Collections Assigned" },
    { value: "collections_unassigned", label: "Collections Unassigned" },
];

/**
 * Get row status for visual indicators
 * @returns {string} - "unassigned" | "assigned" | "completed"
 */
export const getRowStatus = (row) => {
    if (!row.assignment) return "unassigned";
    if (row.collectedAmount > 0 && row.payout?.amount > 0) return "completed";
    return "assigned";
};

/**
 * Get row background class based on status
 */
export const getRowStatusClass = (row) => {
    const status = getRowStatus(row);
    switch (status) {
        case "unassigned":
            return "bg-warning-bg/30";
        case "completed":
            return "bg-success-bg/30";
        case "assigned":
        default:
            return "";
    }
};

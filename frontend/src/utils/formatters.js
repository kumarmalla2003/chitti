export const formatCurrency = (val) => {
    if (val === undefined || val === null) return "";
    const num = Number(val.toString().replace(/,/g, ""));
    return isNaN(num) ? "₹ 0" : `₹ ${num.toLocaleString("en-IN")}`;
};

export const formatDate = (dateString, options = {}) => {
    if (!dateString) return "-";
    const defaultOptions = {
        day: "2-digit",
        month: "short",
        year: "numeric",
    };
    return new Date(dateString).toLocaleDateString("en-IN", { ...defaultOptions, ...options });
};

export const formatMonthYear = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${year}`;
};

export const toYearMonth = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${year}-${month}`;
};

export const getFirstDayOfMonth = (yearMonth) => (yearMonth ? `${yearMonth}-01` : "");

export const formatFullDate = (dateString, options = {}) => {
    if (!dateString) return "-";
    const defaultOptions = {
        day: "2-digit",
        month: "short",
        year: "numeric",
    };
    return new Date(dateString).toLocaleDateString("en-IN", { ...defaultOptions, ...options });
};

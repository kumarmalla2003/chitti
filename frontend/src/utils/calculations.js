import { toYearMonth } from './formatters';

export const calculateEndDate = (startYearMonth, durationMonths) => {
    if (!startYearMonth || !durationMonths || durationMonths <= 0) return "";
    const [year, month] = startYearMonth.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    startDate.setMonth(startDate.getMonth() + parseInt(durationMonths) - 1);
    return toYearMonth(startDate.toISOString());
};

export const calculateStartDate = (endYearMonth, durationMonths) => {
    if (!endYearMonth || !durationMonths || durationMonths <= 0) return "";
    const [year, month] = endYearMonth.split("-").map(Number);
    const endDate = new Date(year, month, 0);
    endDate.setMonth(endDate.getMonth() - parseInt(durationMonths) + 1);
    return toYearMonth(endDate.toISOString());
};

export const calculateDuration = (startYearMonth, endYearMonth) => {
    if (!startYearMonth || !endYearMonth) return "";
    const [startYear, startMonth] = startYearMonth.split("-").map(Number);
    const [endYear, endMonth] = endYearMonth.split("-").map(Number);
    if (endYear < startYear || (endYear === startYear && endMonth < startMonth))
        return "";
    const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
    return totalMonths > 0 ? totalMonths.toString() : "";
};

export const calculatePayoutDate = (startDateStr, monthIndex) => {
    if (!startDateStr) return `Month ${monthIndex}`;
    const d = new Date(startDateStr);
    d.setMonth(d.getMonth() + (monthIndex - 1));
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    return `${month}/${year}`;
};

/**
 * Validate date string (YYYY-MM format, valid month 1-12, in range 01/2000-12/2999)
 */
export const isValidDate = (val) => {
    if (!val || typeof val !== "string") return false;
    if (!/^\d{4}-\d{2}$/.test(val)) return false;

    const [year, month] = val.split("-").map(Number);

    // Valid month check (1-12)
    if (month < 1 || month > 12) return false;

    // Min date check (>= 01/2000)
    if (year < 2000 || (year === 2000 && month < 1)) return false;

    // Max date check (<= 12/2999)
    if (year > 2999 || (year === 2999 && month > 12)) return false;

    return true;
};

// frontend/src/utils/dateUtils.js

export const getFirstDayOfMonth = (yearMonth) =>
  yearMonth ? `${yearMonth}-01` : "";

export const toYearMonth = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}`;
};

export const calculateEndDate = (startYearMonth, durationMonths) => {
  if (!startYearMonth || !durationMonths || durationMonths <= 0) return "";
  const [year, month] = startYearMonth.split("-").map(Number);
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  startDate.setUTCMonth(startDate.getUTCMonth() + parseInt(durationMonths) - 1);
  return toYearMonth(startDate.toISOString());
};

export const calculateStartDate = (endYearMonth, durationMonths) => {
  if (!endYearMonth || !durationMonths || durationMonths <= 0) return "";
  const [year, month] = endYearMonth.split("-").map(Number);
  const endDate = new Date(Date.UTC(year, month, 0));
  endDate.setUTCMonth(endDate.getUTCMonth() - parseInt(durationMonths) + 1);
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

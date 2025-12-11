// frontend/src/components/ui/StatusBadge.jsx

/**
 * StatusBadge - Displays a colored badge for various status types.
 *
 * Chit Statuses: Active (green), Upcoming (blue), Completed (gray)
 * Collection Statuses: Paid (green), Unpaid (red), Partial (yellow)
 * Payout Statuses: Paid (green), Pending (yellow)
 */
const StatusBadge = ({ status }) => {
  const baseClasses =
    "px-2.5 py-1 text-xs font-semibold rounded-full inline-block text-center min-w-[5.5rem]";
  const statusClasses = {
    // Chit Statuses
    Active: "bg-success-bg text-success-accent",
    Upcoming: "bg-warning-bg text-warning-accent",
    Completed: "bg-background-tertiary text-text-secondary",
    Inactive: "bg-error-bg text-error-accent",

    // Collection/Payout Statuses
    Paid: "bg-success-bg text-success-accent",
    Unpaid: "bg-error-bg text-error-accent",
    Partial: "bg-warning-bg text-warning-accent",
    Pending: "bg-warning-bg text-warning-accent",
  };

  return (
    <span
      className={`${baseClasses} ${
        statusClasses[status] || "bg-gray-200 text-gray-800"
      }`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;

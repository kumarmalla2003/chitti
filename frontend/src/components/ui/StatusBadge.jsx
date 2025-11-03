// frontend/src/components/ui/StatusBadge.jsx

const StatusBadge = ({ status }) => {
  const baseClasses = "px-2.5 py-1 text-xs font-semibold rounded-full";
  const statusClasses = {
    // Group Statuses
    Active: "bg-success-bg text-success-accent",
    Inactive: "bg-error-bg text-error-accent",

    // Payment Statuses
    Paid: "bg-success-bg text-success-accent",
    Unpaid: "bg-error-bg text-error-accent",
    Partial: "bg-warning-bg text-warning-accent",
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

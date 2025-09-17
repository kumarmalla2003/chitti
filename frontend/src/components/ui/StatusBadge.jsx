// frontend/src/components/ui/StatusBadge.jsx

const StatusBadge = ({ status }) => {
  const baseClasses = "px-2.5 py-1 text-xs font-semibold rounded-full";
  const statusClasses = {
    Active: "bg-success-bg text-success-accent",
    Inactive: "bg-error-bg text-error-accent",
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

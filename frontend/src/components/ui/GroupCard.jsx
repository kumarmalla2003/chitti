// frontend/src/components/ui/GroupCard.jsx

import {
  FiEye,
  FiEdit,
  FiTrash2,
  FiCalendar,
  FiRepeat,
  FiRefreshCw,
} from "react-icons/fi";
import { RupeeIcon } from "./Icons";
import { useNavigate } from "react-router-dom";

const GroupCard = ({ group, onView, onEdit, onDelete }) => {
  const navigate = useNavigate();

  const statusStyles = {
    Active: {
      dot: "bg-success-accent",
    },
    Inactive: {
      dot: "bg-error-accent",
    },
  };

  const { dot } = statusStyles[group.status] || statusStyles.Inactive;

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });

  return (
    <div
      className="rounded-lg p-4 shadow-md transition-all duration-300 cursor-pointer hover:scale-[1.02] bg-background-secondary"
      onClick={() => navigate(`/groups/view/${group.id}`)}
    >
      {/* Top Row: Name and Actions */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${dot}`}></span>
          <h3 className="font-bold text-lg text-text-primary truncate">
            {group.name}
          </h3>
        </div>
        <div className="flex items-center flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(group);
            }}
            className="p-2 rounded-full text-info-accent hover:bg-info-bg transition-colors duration-200"
            title="View Details"
          >
            <FiEye className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(group);
            }}
            className="p-2 rounded-full text-warning-accent hover:bg-warning-bg transition-colors duration-200"
            title="Edit Group"
          >
            <FiEdit className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(group);
            }}
            className="p-2 rounded-full text-error-accent hover:bg-error-bg transition-colors duration-200"
            title="Delete Group"
          >
            <FiTrash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Middle Row: Values */}
      <div className="flex justify-between items-center text-text-primary mb-3 text-base">
        <div className="flex items-center gap-2">
          <RupeeIcon className="w-5 h-5" />
          <span className="font-semibold">
            {group.chit_value.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <FiRepeat className="w-5 h-5" />
          <span className="font-semibold">
            ₹{group.monthly_installment.toLocaleString("en-IN")} / month
          </span>
        </div>
      </div>

      {/* Bottom Separator */}
      <hr className="border-border mb-3" />

      {/* Bottom Row: Dates and Cycle */}
      <div className="flex justify-between items-center text-text-secondary text-sm">
        <div className="flex items-center gap-2">
          <FiCalendar className="w-4 h-4" />
          <span>
            {formatDate(group.start_date)} - {formatDate(group.end_date)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <FiRefreshCw className="w-4 h-4" />
          <span>Cycle {group.chit_cycle}</span>
        </div>
      </div>
    </div>
  );
};

export default GroupCard;

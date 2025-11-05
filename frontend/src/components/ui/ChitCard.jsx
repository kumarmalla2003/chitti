// frontend/src/components/ui/ChitCard.jsx

import {
  FiEdit,
  FiTrash2,
  FiCalendar,
  FiRepeat,
  FiRefreshCw,
} from "react-icons/fi";
import { RupeeIcon } from "./Icons";
import { useNavigate } from "react-router-dom";

const ChitCard = ({ chit, onView, onEdit, onDelete }) => {
  const navigate = useNavigate();

  const statusStyles = {
    Active: {
      dot: "bg-success-accent",
    },
    Inactive: {
      dot: "bg-error-accent",
    },
  };

  const { dot } = statusStyles[chit.status] || statusStyles.Inactive;

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });

  return (
    <div
      className="rounded-lg p-4 shadow-md transition-all duration-300 cursor-pointer hover:scale-[1.02] bg-background-secondary"
      onClick={() => navigate(`/chits/view/${chit.id}`)}
    >
      {/* Top Row: Name and Actions */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${dot}`}></span>
          <h3 className="font-bold text-lg text-text-primary truncate">
            {chit.name}
          </h3>
        </div>
        <div className="flex items-center flex-shrink-0">
          {/* --- "VIEW" BUTTON REMOVED --- */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(chit);
            }}
            className="p-2 rounded-full text-warning-accent hover:bg-warning-bg transition-colors duration-200"
            title="Edit Chit"
          >
            <FiEdit className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(chit);
            }}
            className="p-2 rounded-full text-error-accent hover:bg-error-bg transition-colors duration-200"
            title="Delete Chit"
          >
            <FiTrash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Middle Row: Values */}
      <div className="flex justify-between items-center text-text-primary mb-3 text-base">
        <div className="flex items-center gap-2" title="Total Chit Value">
          <RupeeIcon className="w-5 h-5" />
          <span className="font-semibold">
            {chit.chit_value.toLocaleString("en-IN")}
          </span>
        </div>
        {/* --- MODIFICATION: Removed all extra text --- */}
        <div className="flex items-center gap-2" title="Monthly Installment">
          <FiRepeat className="w-5 h-5" />
          <span className="font-semibold">
            ₹{chit.monthly_installment.toLocaleString("en-IN")}
          </span>
        </div>
        {/* --- END MODIFICATION --- */}
      </div>

      {/* Bottom Separator */}
      <hr className="border-border mb-3" />

      {/* Bottom Row: Dates and Cycle */}
      <div className="flex justify-between items-center text-text-secondary text-sm">
        <div className="flex items-center gap-2">
          <FiCalendar className="w-4 h-4" />
          <span>
            {formatDate(chit.start_date)} - {formatDate(chit.end_date)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <FiRefreshCw className="w-4 h-4" />
          <span>Cycle {chit.chit_cycle}</span>
        </div>
      </div>
    </div>
  );
};

export default ChitCard;

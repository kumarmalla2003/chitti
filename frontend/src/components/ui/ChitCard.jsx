// frontend/src/components/ui/ChitCard.jsx

import {
  SquarePen,
  Trash2,
  Calendar,
  Repeat,
  RefreshCw,
  Printer,
  Loader2,
  IndianRupee,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const ChitCard = ({ chit, onView, onEdit, onDelete, onPrint, isPrinting }) => {
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
              onPrint(chit);
            }}
            disabled={isPrinting}
            className="p-2 rounded-full text-info-accent hover:bg-info-bg transition-colors duration-200 disabled:opacity-50"
            title="Download PDF Report"
          >
            {isPrinting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Printer className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(chit);
            }}
            className="p-2 rounded-full text-warning-accent hover:bg-warning-bg transition-colors duration-200"
            title="Edit Chit"
          >
            <SquarePen className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(chit);
            }}
            className="p-2 rounded-full text-error-accent hover:bg-error-bg transition-colors duration-200"
            title="Delete Chit"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Middle Row: Values */}
      <div className="flex justify-between items-center text-text-primary mb-3 text-base">
        <div className="flex items-center gap-2" title="Total Chit Value">
          <IndianRupee className="w-5 h-5" />
          <span className="font-semibold">
            {chit.chit_value.toLocaleString("en-IN")}
          </span>
        </div>
        {/* --- MODIFICATION: Removed all extra text --- */}
        <div className="flex items-center gap-2" title="Monthly Installment">
          <Repeat className="w-5 h-5" />
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
          <Calendar className="w-4 h-4" />
          <span>
            {formatDate(chit.start_date)} - {formatDate(chit.end_date)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          <span>Cycle {chit.chit_cycle}</span>
        </div>
      </div>
    </div>
  );
};

export default ChitCard;

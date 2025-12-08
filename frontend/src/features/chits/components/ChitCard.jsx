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
import { Link } from "react-router-dom";
import PropTypes from 'prop-types';

const ChitCard = ({ chit, onEdit, onDelete, onPrint, isPrinting }) => {
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
    <article className="rounded-lg p-4 shadow-md bg-background-secondary relative group transition-all duration-300 hover:scale-[1.02]">
      {/* Make the title a clickable link instead of the whole card */}
      <Link
        to={`/chits/view/${chit.id}`}
        className="absolute inset-0 z-10 focus:outline-none focus:ring-2 focus:ring-accent rounded-lg"
      >
        <span className="sr-only">View details for {chit.name}</span>
      </Link>

      {/* Top Row: Name and Actions */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${dot}`}></span>
          <h3 className="font-bold text-lg text-text-primary truncate">
            {chit.name}
          </h3>
        </div>
        <div className="flex items-center flex-shrink-0 relative z-20">
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
        <div className="flex items-center gap-2" title="Monthly Installment">
          <Repeat className="w-5 h-5" />
          <span className="font-semibold">
            ₹{chit.monthly_installment.toLocaleString("en-IN")}
          </span>
        </div>
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
    </article>
  );
};

ChitCard.propTypes = {
  chit: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    chit_value: PropTypes.number.isRequired,
    monthly_installment: PropTypes.number.isRequired,
    start_date: PropTypes.string.isRequired,
    end_date: PropTypes.string.isRequired,
    chit_cycle: PropTypes.number.isRequired,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onPrint: PropTypes.func.isRequired,
  isPrinting: PropTypes.bool,
};

export default ChitCard;

// frontend/src/components/ui/PayoutCard.jsx

import React from "react";
import {
  User,
  Layers,
  Calendar,
  TrendingUp,
  SquarePen,
  Trash2,
  IndianRupee,
} from "lucide-react";

const PayoutCard = ({ payout, onEdit, onDelete }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="bg-background-secondary rounded-lg shadow-sm border border-border p-4 hover:shadow-md transition-shadow duration-200 flex flex-col justify-between h-full relative group">
      {/* Top Section */}
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2 text-text-primary font-bold">
            <User className="text-text-secondary w-4 h-4" />
            <span className="truncate">
              {payout.member?.full_name || "Unknown"}
            </span>
          </div>
          <div className="bg-error-bg text-error-accent text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Payout
          </div>
        </div>

        <div className="flex items-center gap-2 text-text-secondary text-sm mb-3">
          <Layers className="w-4 h-4" /> {/* Added size */}
          <span className="truncate">{payout.chit?.name || "Unknown"}</span>
        </div>

        <div className="flex items-baseline gap-1 text-2xl font-bold text-error-accent mb-1">
          <IndianRupee className="w-5 h-5" />
          {(payout.amount || 0).toLocaleString("en-IN")}
        </div>

        <div className="text-xs text-text-secondary mb-4">
          via {payout.method || "-"}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="pt-3 border-t border-border flex justify-between items-center">
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <Calendar className="w-4 h-4" />
          {formatDate(payout.paid_date)}
        </div>

        <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 text-warning-accent hover:bg-warning-bg rounded-full transition-colors"
            title="Edit"
          >
            <SquarePen className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 text-error-accent hover:bg-error-bg rounded-full transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayoutCard;

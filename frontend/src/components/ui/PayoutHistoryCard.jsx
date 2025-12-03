// frontend/src/components/ui/PayoutHistoryCard.jsx

import { Calendar, TrendingUp, IndianRupee } from "lucide-react";

const PayoutHistoryCard = ({ payout, viewType, onClick }) => {
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  // If viewing on Chit page, show Member name.
  // If viewing on Member page, show Chit name.
  const title =
    viewType === "chit" ? payout.member.full_name : payout.chit.name;

  return (
    <div
      className="rounded-lg p-4 shadow-md transition-all duration-300 cursor-pointer hover:scale-[1.02] bg-background-primary border-l-4 border-error-accent"
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg text-text-primary truncate">
          {title}
        </h3>
        <span className="text-xs bg-error-bg text-error-accent px-2 py-1 rounded-full flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> Payout
        </span>
      </div>

      <hr className="border-border mb-3" />

      <div className="flex justify-between items-center text-text-secondary text-sm">
        <div className="flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-error-accent" />
          <span className="font-bold text-error-accent">
            {payout.amount.toLocaleString("en-IN")}/-
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(payout.payout_date)}</span>
        </div>
      </div>
    </div>
  );
};

export default PayoutHistoryCard;

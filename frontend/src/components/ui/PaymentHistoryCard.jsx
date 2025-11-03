// frontend/src/components/ui/PaymentHistoryCard.jsx

import { FiCalendar } from "react-icons/fi";
import { RupeeIcon } from "./Icons";

const PaymentHistoryCard = ({ payment, viewType, onClick }) => {
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  // Determine the title based on the context
  // If we are on a Group's page (viewType 'group'), show the Member's name.
  // If we are on a Member's page (viewType 'member'), show the Group's name.
  const title =
    viewType === "group" ? payment.member.full_name : payment.chit_group.name;

  return (
    <div
      // --- MODIFICATION: Changed background to primary ---
      className="rounded-lg p-4 shadow-md transition-all duration-300 cursor-pointer hover:scale-[1.02] bg-background-primary"
      // --- END MODIFICATION ---
      onClick={onClick}
    >
      {/* Top Row: Title (Context-aware) */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg text-text-primary truncate">
          {title}
        </h3>
        {/* No actions here, as this is a history list */}
      </div>

      {/* Bottom Separator */}
      <hr className="border-border mb-3" />

      {/* Bottom Row: Stats (Amount & Date) */}
      <div className="flex justify-between items-center text-text-secondary text-sm">
        <div className="flex items-center gap-2">
          <RupeeIcon className="w-4 h-4" />
          <span>{payment.amount_paid.toLocaleString("en-IN")}/-</span>
        </div>
        <div className="flex items-center gap-2">
          <FiCalendar className="w-4 h-4" />
          <span>{formatDate(payment.payment_date)}</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryCard;

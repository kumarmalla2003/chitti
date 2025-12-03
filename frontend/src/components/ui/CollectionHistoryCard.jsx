// frontend/src/components/ui/CollectionHistoryCard.jsx

import { Calendar, IndianRupee } from "lucide-react";

const CollectionHistoryCard = ({ collection, viewType, onClick }) => {
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  // Determine the title based on the context
  // If we are on a Chit's page (viewType 'chit'), show the Member's name.
  // If we are on a Member's page (viewType 'member'), show the Chit's name.
  const title =
    viewType === "chit" ? collection.member.full_name : collection.chit.name; // <-- MODIFIED

  return (
    <div
      className="rounded-lg p-4 shadow-md transition-all duration-300 cursor-pointer hover:scale-[1.02] bg-background-primary"
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
          <IndianRupee className="w-4 h-4" />
          <span>{collection.amount_paid.toLocaleString("en-IN")}/-</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(collection.collection_date)}</span>
        </div>
      </div>
    </div>
  );
};

export default CollectionHistoryCard;

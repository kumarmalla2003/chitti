// frontend/src/components/ui/CollectionHistoryCard.jsx

import { Calendar, IndianRupee } from "lucide-react";

const CollectionHistoryCard = ({
  collection,
  viewType,
  onClick,
  centered = false,
}) => {
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const title =
    viewType === "chit" ? collection.member.full_name : collection.chit.name;

  return (
    <div
      className="rounded-lg p-4 shadow-md transition-all duration-300 cursor-pointer hover:scale-[1.02] bg-background-primary"
      onClick={onClick}
    >
      {/* Top Row: Title */}
      <div
        className={`flex items-center mb-3 ${
          centered ? "justify-center" : "justify-between"
        }`}
      >
        <h3
          className={`font-bold text-lg text-text-primary truncate ${
            centered ? "text-center" : ""
          }`}
        >
          {title}
        </h3>
        {/* No Actions for Collection History, so no complex logic needed here yet */}
      </div>

      {/* Bottom Separator */}
      <hr className="border-border mb-3" />

      {/* Bottom Row: Stats (Amount & Date) */}
      <div className="flex justify-between items-center text-text-secondary text-sm">
        <div className="flex items-center gap-2">
          <IndianRupee className="w-4 h-4" />
          {/* UPDATED: Green color and font weight */}
          <span className="text-green-600 font-medium">
            {collection.amount_paid.toLocaleString("en-IN")}/-
          </span>
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

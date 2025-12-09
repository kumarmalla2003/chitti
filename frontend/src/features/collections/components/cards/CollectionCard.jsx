// frontend/src/components/ui/CollectionCard.jsx

import {
  SquarePen,
  Trash2,
  Layers,
  Calendar,
  CreditCard,
  IndianRupee,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const CollectionCard = ({ collection, onView, onEdit, onDelete }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div
      className="rounded-lg p-4 shadow-md transition-all duration-300 cursor-pointer hover:scale-[1.02] bg-background-secondary"
      onClick={() => navigate(`/collections/view/${collection.id}`)}
    >
      {/* Top Row: Name and Actions */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-bold text-lg text-text-primary truncate">
            {collection.member.full_name}
          </h3>
        </div>
        <div className="flex items-center flex-shrink-0">
          {/* --- "VIEW" BUTTON REMOVED --- */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(collection);
            }}
            className="p-2 rounded-full text-warning-accent hover:bg-warning-bg transition-colors duration-200"
            title="Edit Collection"
          >
            <SquarePen className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(collection);
            }}
            className="p-2 rounded-full text-error-accent hover:bg-error-bg transition-colors duration-200"
            title="Delete Collection"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* --- MODIFIED: Middle Row (Combined & Resized) --- */}
      <div className="flex justify-between items-center text-text-primary mb-3 text-base">
        <div className="flex items-center gap-2">
          <IndianRupee className="w-5 h-5" />
          {/* --- MODIFICATION: Added /- --- */}
          <span className="font-semibold">
            {collection.amount_paid.toLocaleString("en-IN")}/-
          </span>
          {/* --- END MODIFICATION --- */}
        </div>
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5" />
          <span className="font-semibold">{collection.chit.name}</span>
        </div>
      </div>
      {/* --- END MODIFICATION --- */}

      {/* Bottom Separator */}
      <hr className="border-border mb-3" />

      {/* --- MODIFIED: Bottom Row (Icon & Style) --- */}
      <div className="flex justify-between items-center text-text-secondary text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(collection.collection_date)}</span>
        </div>
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          <span>{collection.collection_method}</span>
        </div>
      </div>
      {/* --- END MODIFICATION --- */}
    </div>
  );
};

export default CollectionCard;

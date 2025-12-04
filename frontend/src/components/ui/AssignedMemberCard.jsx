// frontend/src/components/ui/AssignedMemberCard.jsx

import { Trash2, Calendar, IndianRupee } from "lucide-react";

const AssignedMemberCard = ({
  assignment,
  onDelete,
  onLogCollection,
  centered = false,
}) => {
  const member = assignment.member;

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
    });

  const paidAmount = assignment.total_paid;

  const handleLogCollection = (e) => {
    e.stopPropagation();
    if (onLogCollection) onLogCollection(assignment);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(assignment);
  };

  // Determine if any actions are available to show
  const showActions = !!onLogCollection || !!onDelete;

  const renderActions = () => (
    <>
      {onLogCollection && (
        <button
          onClick={handleLogCollection}
          className="p-2 rounded-full text-success-accent hover:bg-success-bg transition-colors duration-200"
          title="Log Collection"
        >
          <IndianRupee className="w-5 h-5" />
        </button>
      )}
      {onDelete && (
        <button
          onClick={handleDelete}
          className="p-2 rounded-full text-error-accent hover:bg-error-bg transition-colors duration-200"
          title="Unassign Member"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}
    </>
  );

  return (
    <div className="rounded-lg p-4 shadow-md transition-all duration-300 bg-background-primary relative">
      {/* Top Row: Layout depends on 'centered' prop */}
      {centered ? (
        // --- CENTERED LAYOUT (Dashboard) ---
        <div className="flex justify-center items-center mb-3 min-h-[2rem]">
          <h3
            className={`font-bold text-lg text-text-primary truncate text-center w-full ${
              showActions ? "px-16" : ""
            }`}
          >
            {member.full_name}
          </h3>
          {showActions && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center pr-2">
              {renderActions()}
            </div>
          )}
        </div>
      ) : (
        // --- STANDARD LAYOUT (Other Pages) ---
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-bold text-lg text-text-primary truncate">
              {member.full_name}
            </h3>
          </div>
          {showActions && (
            <div className="flex items-center flex-shrink-0">
              {renderActions()}
            </div>
          )}
        </div>
      )}

      {/* Bottom Separator */}
      <hr className="border-border mb-3" />

      {/* Bottom Row */}
      <div className="flex items-center justify-between text-text-secondary text-sm">
        {/* Left Side: Assigned Month */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(assignment.chit_month)}</span>
        </div>
        {/* Right Side: Paid Amount */}
        <div className="flex items-center gap-2">
          <IndianRupee className="w-4 h-4" />
          <span>
            Paid:{" "}
            <span className="text-success-accent">
              {paidAmount.toLocaleString("en-IN")}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default AssignedMemberCard;

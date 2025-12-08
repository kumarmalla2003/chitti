// frontend/src/components/ui/AssignedChitCard.jsx

import { Trash2, Calendar, IndianRupee } from "lucide-react";
// import { useNavigate } from "react-router-dom"; // <-- REMOVED

const AssignedChitCard = ({ assignment, onDelete, onLogCollection }) => {
  // <-- Prop added
  // const navigate = useNavigate(); // <-- REMOVED

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short", // <-- MODIFIED
    });

  const dueAmount = assignment.due_amount;

  // --- MODIFIED ---
  const handleLogCollection = (e) => {
    e.stopPropagation();
    onLogCollection(assignment); // <-- Use prop
  };
  // --- END MODIFICATION ---

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(assignment);
  };

  return (
    <div className="rounded-lg p-4 shadow-md transition-all duration-300 bg-background-primary">
      {/* Top Row: Title & Actions */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-bold text-lg text-text-primary truncate">
            {assignment.chit.name}
          </h3>
        </div>
        <div className="flex items-center flex-shrink-0">
          <button
            onClick={handleLogCollection} // <-- Use handler
            className="p-2 rounded-full text-success-accent hover://bg-success-bg transition-colors duration-200"
            title="Log Collection"
          >
            <IndianRupee className="w-5 h-5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-full text-error-accent hover:bg-error-bg transition-colors duration-200"
            title="Unassign Member"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Separator */}
      <hr className="border-border mb-3" />

      {/* Bottom Row: Stats (Assigned Month & Due Amount) */}
      <div className="flex justify-between items-center text-text-secondary text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(assignment.chit_month)}</span>
        </div>
        <div className="flex items-center gap-2">
          <IndianRupee className="w-4 h-4" />
          <span>
            Due:{" "}
            <span
              className={
                dueAmount > 0 ? "text-error-accent" : "text-text-secondary"
              }
            >
              {dueAmount.toLocaleString("en-IN")}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default AssignedChitCard;

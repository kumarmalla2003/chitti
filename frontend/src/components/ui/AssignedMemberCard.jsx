// frontend/src/components/ui/AssignedMemberCard.jsx

import { FiTrash2, FiCalendar } from "react-icons/fi"; // <-- IMPORT FiCalendar
import { RupeeIcon } from "./Icons";
// import { useNavigate } from "react-router-dom"; // No longer needed

const AssignedMemberCard = ({
  assignment,
  onDelete,
  // installmentAmount, // <-- REMOVED
  onLogPayment,
}) => {
  const member = assignment.member;

  // --- MODIFIED: month: "short" ---
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short", // <-- MODIFIED
    });
  // --- END MODIFICATION ---

  const dueAmount = assignment.due_amount;
  // const totalAmount = installmentAmount || 0; // <-- REMOVED

  const handleLogPayment = (e) => {
    e.stopPropagation();
    onLogPayment(assignment);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(assignment);
  };

  return (
    <div className="rounded-lg p-4 shadow-md transition-all duration-300 bg-background-primary">
      {/* Top Row: Name and Actions (Unchanged) */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-bold text-lg text-text-primary truncate">
            {member.full_name}
          </h3>
        </div>
        <div className="flex items-center flex-shrink-0">
          <button
            onClick={handleLogPayment}
            className="p-2 rounded-full text-success-accent hover:bg-success-bg transition-colors duration-200"
            title="Log Payment"
          >
            <RupeeIcon className="w-5 h-5" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-full text-error-accent hover:bg-error-bg transition-colors duration-200"
            title="Unassign Member"
          >
            <FiTrash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Separator (Unchanged) */}
      <hr className="border-border mb-3" />

      {/* --- MODIFIED Bottom Row (date format updated, but component structure kept) --- */}
      <div className="flex items-center justify-between text-text-secondary text-sm">
        {/* Left Side: Assigned Month */}
        <div className="flex items-center gap-2">
          <FiCalendar className="w-4 h-4" />
          <span>{formatDate(assignment.chit_month)}</span>
        </div>
        {/* Right Side: Due Amount */}
        <div className="flex items-center gap-2">
          <RupeeIcon className="w-4 h-4" />
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
      {/* --- END MODIFICATION --- */}
    </div>
  );
};

export default AssignedMemberCard;

// frontend/src/components/ui/AssignedMemberCard.jsx

import { FiPhone, FiTrash2 } from "react-icons/fi";
import { RupeeIcon } from "./Icons";

const AssignedMemberCard = ({ assignment, onDelete, installmentAmount }) => {
  const member = assignment.member;

  // --- Use real data from props ---
  const dueAmount = assignment.due_amount;
  const totalAmount = installmentAmount || 0; // Passed from parent
  // --- End of change ---

  return (
    <div className="rounded-lg p-4 shadow-md transition-all duration-300 bg-background-primary">
      {/* Top Row: Name and Actions */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-bold text-lg text-text-primary truncate">
            {member.full_name}
          </h3>
        </div>
        <div className="flex items-center flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(assignment);
            }}
            className="p-2 rounded-full text-error-accent hover:bg-error-bg transition-colors duration-200"
            title="Unassign Member"
          >
            <FiTrash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Middle Row: Phone Number */}
      <div className="flex items-center gap-2 text-text-primary mb-3 text-base">
        <FiPhone className="w-5 h-5" />
        <span className="font-semibold">{member.phone_number}</span>
      </div>

      {/* Bottom Separator */}
      <hr className="border-border mb-3" />

      {/* Bottom Row: Payment Status */}
      <div className="flex items-center justify-between text-text-secondary text-sm">
        <div className="flex items-center gap-2">
          <RupeeIcon className="w-4 h-4" />
          <span>
            Due: {/* --- Update styling based on due amount --- */}
            <span
              className={`font-semibold ${
                dueAmount > 0 ? "text-error-accent" : "text-text-primary"
              }`}
            >
              {dueAmount.toLocaleString("en-IN")}
            </span>
          </span>
        </div>
        <div className="text-right">
          <span>
            Total:{" "}
            <span className="font-semibold text-text-primary">
              {totalAmount.toLocaleString("en-IN")}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default AssignedMemberCard;

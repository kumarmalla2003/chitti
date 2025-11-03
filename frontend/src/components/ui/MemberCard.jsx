// frontend/src/components/ui/MemberCard.jsx

import { FiEdit, FiTrash2, FiPhone, FiBox } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";

const MemberCard = ({ member, onView, onEdit, onDelete }) => {
  const navigate = useNavigate();

  // This logic is correct and calculates the active count
  const activeChitsCount = useMemo(() => {
    if (!member.assignments || member.assignments.length === 0) {
      return 0;
    }
    const today = new Date().toISOString().split("T")[0];
    return member.assignments.filter((a) => {
      if (!a.chit_group || !a.chit_group.start_date || !a.chit_group.end_date) {
        return false;
      }
      const { start_date, end_date } = a.chit_group;
      return today >= start_date && today <= end_date;
    }).length;
  }, [member.assignments]);

  return (
    <div
      className="rounded-lg p-4 shadow-md transition-all duration-300 cursor-pointer hover:scale-[1.02] bg-background-secondary"
      onClick={() => navigate(`/members/view/${member.id}`)}
    >
      {/* Top Row: Name and Actions */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-bold text-lg text-text-primary truncate">
            {member.full_name}
          </h3>
        </div>
        <div className="flex items-center flex-shrink-0">
          {/* --- "VIEW" BUTTON REMOVED --- */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(member);
            }}
            className="p-2 rounded-full text-warning-accent hover:bg-warning-bg transition-colors duration-200"
            title="Edit Member"
          >
            <FiEdit className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(member);
            }}
            className="p-2 rounded-full text-error-accent hover:bg-error-bg transition-colors duration-200"
            title="Delete Member"
          >
            <FiTrash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* --- <hr> ADDED FOR CONSISTENCY --- */}
      <hr className="border-border mb-3" />

      {/* --- MODIFIED: Bottom Row (Combined, styled as bottom row) --- */}
      <div className="flex justify-between items-center text-text-secondary text-sm">
        <div className="flex items-center gap-2">
          <FiPhone className="w-4 h-4" />
          <span>{member.phone_number}</span>
        </div>
        <div className="flex items-center gap-2">
          <FiBox className="w-4 h-4" />
          <span>Active: {activeChitsCount}</span>
        </div>
      </div>
      {/* --- END MODIFICATION --- */}
    </div>
  );
};

export default MemberCard;

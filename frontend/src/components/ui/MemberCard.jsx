// frontend/src/components/ui/MemberCard.jsx

import { FiEye, FiEdit, FiTrash2, FiPhone, FiBox } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const MemberCard = ({ member, onView, onEdit, onDelete }) => {
  const navigate = useNavigate();

  // Calculate number of active assignments
  const activeChitsCount = member.assignments
    ? member.assignments.filter((a) => a.chit_group?.status === "Active").length
    : 0;

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
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(member);
            }}
            className="p-2 rounded-full text-info-accent hover:bg-info-bg transition-colors duration-200"
            title="View Details"
          >
            <FiEye className="w-5 h-5" />
          </button>
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

      {/* Middle Row: Phone Number */}
      <div className="flex items-center gap-2 text-text-primary mb-3 text-base">
        <FiPhone className="w-5 h-5" />
        <span className="font-semibold">{member.phone_number}</span>
      </div>

      {/* Bottom Separator */}
      <hr className="border-border mb-3" />

      {/* Bottom Row: Active Chits Count */}
      <div className="flex items-center gap-2 text-text-secondary text-sm">
        <FiBox className="w-4 h-4" />
        <span>
          {activeChitsCount === 0
            ? "No active chits assigned"
            : `${activeChitsCount} active ${
                activeChitsCount === 1 ? "chit" : "chits"
              } assigned`}
        </span>
      </div>
    </div>
  );
};

export default MemberCard;

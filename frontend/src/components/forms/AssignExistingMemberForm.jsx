// frontend/src/components/forms/AssignExistingMemberForm.jsx

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import Button from "../ui/Button";
import Message from "../ui/Message";
import { User, Check, Loader2, Calendar } from "lucide-react";
import { getAllMembers } from "../../services/membersService";

const AssignExistingMemberForm = forwardRef(
  (
    {
      token,
      chitId,
      availableMonths,
      onAssignment,
      formatDate,
      assignedMemberIds,
      onMemberNameChange,
      onBackToList,
    },
    ref
  ) => {
    const [allMembers, setAllMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [selectedMemberId, setSelectedMemberId] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");

    useImperativeHandle(ref, () => ({
      goBack: () => {
        onMemberNameChange("");
        onBackToList();
      },
    }));

    useEffect(() => {
      const fetchAllMembers = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await getAllMembers(token);
          setAllMembers(data.members);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchAllMembers();
    }, [token]);

    const handleConfirmAssignment = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!selectedMemberId || !selectedMonth) {
        setError("Please select a member and a month.");
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        await onAssignment({
          member_id: selectedMemberId,
          chit_id: chitId,
          chit_month: selectedMonth,
        });
      } catch (err) {
        setError(err.message);
        setIsSubmitting(false);
      }
    };

    const isFormInvalid = !selectedMemberId || !selectedMonth;

    return (
      <form className="my-4" onSubmit={handleConfirmAssignment}>
        {error && (
          <Message type="error" onClose={() => setError(null)}>
            {error}
          </Message>
        )}

        {loading && (
          <div className="flex justify-center p-4">
            <Loader2 className="animate-spin" />
          </div>
        )}

        {!loading && (
          <div className="space-y-6">
            {/* Member Dropdown */}
            <div>
              <label
                htmlFor="member_id"
                className="block text-lg font-medium text-text-secondary mb-1"
              >
                Select Member
              </label>
              <div className="relative flex items-center">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="w-5 h-5 text-text-secondary" />
                </span>
                <div className="absolute left-10 h-6 w-px bg-border"></div>
                <select
                  id="member_id"
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                >
                  <option value="">
                    {allMembers.length > 0
                      ? "Select a member..."
                      : "No members found"}
                  </option>
                  {allMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Month Dropdown */}
            <div>
              <label
                htmlFor="chit_month"
                className="block text-lg font-medium text-text-secondary mb-1"
              >
                Select Month
              </label>
              <div className="relative flex items-center">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="w-5 h-5 text-text-secondary" />
                </span>
                <div className="absolute left-10 h-6 w-px bg-border"></div>
                <select
                  id="chit_month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  // --- ADDED text-center ---
                  className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-center"
                  required
                >
                  <option value="">
                    {availableMonths.length > 0
                      ? "Select an available month..."
                      : "No available months for this chit"}
                  </option>
                  {availableMonths.map((month) => (
                    <option key={month} value={month}>
                      {formatDate(month)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              {" "}
              {/* Removed flex justify-end */}
              <Button
                type="submit"
                variant="success"
                disabled={isFormInvalid || isSubmitting}
                className="w-full flex items-center justify-center" // Added full width & centering
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <>
                    <Check className="mr-2 w-5 h-5" /> {/* Added fix size */}
                    Confirm Assignment
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </form>
    );
  }
);

export default AssignExistingMemberForm;

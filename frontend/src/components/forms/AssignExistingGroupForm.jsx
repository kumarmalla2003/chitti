// frontend/src/components/forms/AssignExistingGroupForm.jsx

import {
  useState,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import Button from "../ui/Button";
import Message from "../ui/Message";
import { FiBox, FiCheck, FiLoader, FiCalendar } from "react-icons/fi";
import { getAllChitGroups } from "../../services/chitsService";
import { getUnassignedMonths } from "../../services/assignmentsService";

const AssignExistingGroupForm = forwardRef(
  (
    {
      token,
      memberId,
      onAssignment,
      formatDate,
      existingAssignments, // This prop is now only used for the info message
      onGroupNameChange, // Kept to clear header on back
      onBackToList,
    },
    ref
  ) => {
    const [allGroups, setAllGroups] = useState([]);
    const [loading, setLoading] = useState(true); // Initial page load
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for cascading dropdowns
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const [availableMonths, setAvailableMonths] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState("");
    const [isMonthLoading, setIsMonthLoading] = useState(false);

    // Expose a simplified goBack function
    useImperativeHandle(ref, () => ({
      goBack: () => {
        onGroupNameChange(""); // Clear header
        onBackToList();
      },
    }));

    // Fetch all groups on load
    useEffect(() => {
      const fetchAllGroups = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await getAllChitGroups(token);
          // Filter only for "Active" (which includes upcoming)
          const availableGroups = data.groups.filter(
            (g) => g.status === "Active"
          );
          setAllGroups(availableGroups);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchAllGroups();
    }, [token]);

    // Cascading logic: Fetch months when a group is selected
    const handleGroupChange = async (e) => {
      const newGroupId = e.target.value;
      setSelectedGroupId(newGroupId);
      setSelectedMonth(""); // Reset month selection
      setAvailableMonths([]); // Clear old months

      if (!newGroupId) {
        return;
      }

      setIsMonthLoading(true);
      setError(null);
      try {
        const data = await getUnassignedMonths(newGroupId, token);
        setAvailableMonths(data.available_months);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsMonthLoading(false);
      }
    };

    // Form submission handler
    const handleConfirmAssignment = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!selectedGroupId || !selectedMonth) {
        setError("Please select a group and a month.");
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        await onAssignment({
          member_id: memberId,
          chit_group_id: selectedGroupId,
          chit_month: selectedMonth,
        });
      } catch (err) {
        setError(err.message);
        setIsSubmitting(false);
      }
    };

    // Helper to show an info message if the member is already in the selected group
    const assignmentsInSelectedGroup = useMemo(() => {
      if (!selectedGroupId || !existingAssignments) return [];
      return existingAssignments.filter(
        (a) => a.chit_group.id === parseInt(selectedGroupId)
      );
    }, [selectedGroupId, existingAssignments]);

    const isFormInvalid = !selectedMonth;

    return (
      <form className="my-4" onSubmit={handleConfirmAssignment}>
        {error && (
          <Message type="error" onClose={() => setError(null)}>
            {error}
          </Message>
        )}

        {loading && (
          <div className="flex justify-center p-4">
            <FiLoader className="animate-spin" />
          </div>
        )}

        {!loading && (
          <div className="space-y-6">
            {/* Group Dropdown */}
            <div>
              <label
                htmlFor="group_id"
                className="block text-lg font-medium text-text-secondary mb-1"
              >
                Select Group
              </label>
              <div className="relative flex items-center">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <FiBox className="w-5 h-5 text-text-secondary" />
                </span>
                <div className="absolute left-10 h-6 w-px bg-border"></div>
                <select
                  id="group_id"
                  value={selectedGroupId}
                  onChange={handleGroupChange}
                  className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                >
                  <option value="">
                    {allGroups.length > 0
                      ? "Select an active group..."
                      : "No active groups available"}
                  </option>
                  {allGroups.map((group) => (
                    // --- MODIFICATION ---
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                    // --- END MODIFICATION ---
                  ))}
                </select>
              </div>
            </div>

            {/* Info Message */}
            {assignmentsInSelectedGroup.length > 0 && (
              <div className="p-3 bg-info-bg border-l-4 border-info-accent rounded">
                <p className="text-sm text-info-accent">
                  <strong>Note:</strong> This member is already assigned to this
                  group for:{" "}
                  {assignmentsInSelectedGroup
                    .map((a) => formatDate(a.chit_month))
                    .join(", ")}
                </p>
              </div>
            )}

            {/* Month Dropdown (Cascading) */}
            <div>
              <label
                htmlFor="chit_month"
                className="block text-lg font-medium text-text-secondary mb-1"
              >
                Select Month
              </label>
              <div className="relative flex items-center">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <FiCalendar className="w-5 h-5 text-text-secondary" />
                </span>
                <div className="absolute left-10 h-6 w-px bg-border"></div>
                <select
                  id="chit_month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  disabled={isMonthLoading || !selectedGroupId}
                  required
                >
                  <option value="">
                    {isMonthLoading
                      ? "Loading available months..."
                      : availableMonths.length > 0
                      ? "Select an available month..."
                      : !selectedGroupId
                      ? "Select a group first"
                      : "No available months"}
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
            <div className="flex justify-end mt-6">
              <Button
                type="submit"
                variant="success"
                disabled={isFormInvalid || isSubmitting}
                className="flex items-center justify-center"
              >
                {isSubmitting ? (
                  <FiLoader className="animate-spin" />
                ) : (
                  <>
                    <FiCheck className="mr-2" /> Confirm Assignment
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

export default AssignExistingGroupForm;

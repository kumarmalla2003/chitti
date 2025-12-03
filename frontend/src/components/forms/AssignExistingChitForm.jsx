// frontend/src/components/forms/AssignExistingChitForm.jsx

import {
  useState,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import Button from "../ui/Button";
import Message from "../ui/Message";
import { Layers, Check, Loader2, Calendar } from "lucide-react";
import { getAllChits } from "../../services/chitsService";
import { getUnassignedMonths } from "../../services/assignmentsService";

const AssignExistingChitForm = forwardRef(
  (
    {
      token,
      memberId,
      onAssignment,
      formatDate,
      existingAssignments, // This prop is now only used for the info message
      onChitNameChange, // Kept to clear header on back
      onBackToList,
    },
    ref
  ) => {
    const [allChits, setAllChits] = useState([]);
    const [loading, setLoading] = useState(true); // Initial page load
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for cascading dropdowns
    const [selectedChitId, setSelectedChitId] = useState("");
    const [availableMonths, setAvailableMonths] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState("");
    const [isMonthLoading, setIsMonthLoading] = useState(false);

    // Expose a simplified goBack function
    useImperativeHandle(ref, () => ({
      goBack: () => {
        onChitNameChange(""); // Clear header
        onBackToList();
      },
    }));

    // Fetch all chits on load
    useEffect(() => {
      const fetchAllChits = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await getAllChits(token);
          // Filter only for "Active" (which includes upcoming)
          const availableChits = data.chits.filter(
            (c) => c.status === "Active"
          );
          setAllChits(availableChits);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchAllChits();
    }, [token]);

    // Cascading logic: Fetch months when a chit is selected
    const handleChitChange = async (e) => {
      const newChitId = e.target.value;
      setSelectedChitId(newChitId);
      setSelectedMonth(""); // Reset month selection
      setAvailableMonths([]); // Clear old months

      if (!newChitId) {
        return;
      }

      setIsMonthLoading(true);
      setError(null);
      try {
        const data = await getUnassignedMonths(newChitId, token);
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

      if (!selectedChitId || !selectedMonth) {
        setError("Please select a chit and a month.");
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        await onAssignment({
          member_id: memberId,
          chit_id: selectedChitId,
          chit_month: selectedMonth,
        });
      } catch (err) {
        setError(err.message);
        setIsSubmitting(false);
      }
    };

    // Helper to show an info message if the member is already in the selected chit
    const assignmentsInSelectedChit = useMemo(() => {
      if (!selectedChitId || !existingAssignments) return [];
      return existingAssignments.filter(
        (a) => a.chit.id === parseInt(selectedChitId)
      );
    }, [selectedChitId, existingAssignments]);

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
            <Loader2 className="animate-spin" />
          </div>
        )}

        {!loading && (
          <div className="space-y-6">
            {/* Chit Dropdown */}
            <div>
              <label
                htmlFor="chit_id"
                className="block text-lg font-medium text-text-secondary mb-1"
              >
                Select Chit
              </label>
              <div className="relative flex items-center">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Layers className="w-5 h-5 text-text-secondary" />
                </span>
                <div className="absolute left-10 h-6 w-px bg-border"></div>
                <select
                  id="chit_id"
                  value={selectedChitId}
                  onChange={handleChitChange}
                  className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                >
                  <option value="">
                    {allChits.length > 0
                      ? "Select an active chit..."
                      : "No active chits available"}
                  </option>
                  {allChits.map((chit) => (
                    // --- MODIFICATION ---
                    <option key={chit.id} value={chit.id}>
                      {chit.name}
                    </option>
                    // --- END MODIFICATION ---
                  ))}
                </select>
              </div>
            </div>

            {/* Info Message */}
            {assignmentsInSelectedChit.length > 0 && (
              <div className="p-3 bg-info-bg border-l-4 border-info-accent rounded">
                <p className="text-sm text-info-accent">
                  <strong>Note:</strong> This member is already assigned to this
                  chit for:{" "}
                  {assignmentsInSelectedChit
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
                  <Calendar className="w-5 h-5 text-text-secondary" />
                </span>
                <div className="absolute left-10 h-6 w-px bg-border"></div>
                <select
                  id="chit_month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  disabled={isMonthLoading || !selectedChitId}
                  required
                >
                  <option value="">
                    {isMonthLoading
                      ? "Loading available months..."
                      : availableMonths.length > 0
                      ? "Select an available month..."
                      : !selectedChitId
                      ? "Select a chit first"
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

export default AssignExistingChitForm;

// frontend/src/components/forms/PayoutDetailsForm.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import {
  Layers,
  User,
  Calendar,
  FileText,
  CreditCard,
  IndianRupee,
} from "lucide-react";
import { getAllChits } from "../../services/chitsService";
import { getAllMembers } from "../../services/membersService";
import {
  getAssignmentsForMember,
  getAssignmentsForChit,
} from "../../services/assignmentsService";
import CustomDateInput from "../ui/CustomDateInput";
import ViewOnlyField from "../ui/ViewOnlyField";
import useCursorTracking from "../../hooks/useCursorTracking";

const PayoutDetailsForm = ({
  mode,
  formData,
  onFormChange,
  defaultAssignmentId,
  payoutData,
  defaultChitId = null,
  defaultMemberId = null,
}) => {
  const { token } = useSelector((state) => state.auth);
  const isFormDisabled = mode === "view";

  const amountInputRef = useRef(null);

  // Helper to format value for display
  const getFormattedValue = (val) => {
    if (!val) return "";
    const num = parseInt(val.toString().replace(/,/g, ""));
    return isNaN(num) ? "" : num.toLocaleString("en-IN");
  };

  const formattedAmount = getFormattedValue(formData.amount);

  const trackAmountCursor = useCursorTracking(
    amountInputRef,
    formattedAmount,
    /\d/
  );

  const [allChits, setAllChits] = useState([]);
  const [allMembers, setAllMembers] = useState([]);

  const [filteredChits, setFilteredChits] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);

  const [selectedChitId, setSelectedChitId] = useState(defaultChitId || "");
  const [selectedMemberId, setSelectedMemberId] = useState(
    defaultMemberId || ""
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);

  const formatMonthYear = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString + "T00:00:00Z");
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
    });
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "-";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      if (mode !== "view") {
        setIsLoading(true);
        try {
          const [chitsData, membersData] = await Promise.all([
            getAllChits(token),
            getAllMembers(token),
          ]);
          setAllChits(chitsData.chits);
          setAllMembers(membersData.members);

          setFilteredChits(chitsData.chits);
          setFilteredMembers(membersData.members);
        } catch (err) {
          console.error("Failed to load dropdown data", err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchInitialData();
  }, [mode, token]);

  useEffect(() => {
    if (payoutData && (mode === "edit" || mode === "view")) {
      setSelectedChitId(String(payoutData.chit.id));
      setSelectedMemberId(String(payoutData.member?.id || ""));
    }
  }, [payoutData, mode]);

  const handleChitChange = async (e) => {
    const newChitId = e.target.value;
    setSelectedChitId(newChitId);
    onFormChange(e); // Propagate chit_id change
    onFormChange({ target: { name: "chit_assignment_id", value: "" } });
    setFilteredAssignments([]);

    if (newChitId) {
      setIsLoading(true);
      try {
        const chitAssignments = await getAssignmentsForChit(newChitId, token);
        const validMemberIds = new Set(
          chitAssignments.assignments.map((a) => a.member.id)
        );
        setFilteredMembers(allMembers.filter((m) => validMemberIds.has(m.id)));
      } catch (err) {
        console.error("Failed to fetch chit assignments", err);
      } finally {
        setIsLoading(false);
      }
    } else {
      setFilteredMembers(allMembers);
    }
  };

  const handleMemberChange = (e) => {
    const newMemberId = e.target.value;
    setSelectedMemberId(newMemberId);
    onFormChange(e); // <--- FIXED: Propagate member_id change to parent
    onFormChange({ target: { name: "chit_assignment_id", value: "" } });
  };

  useEffect(() => {
    if (selectedChitId && selectedMemberId && mode !== "view") {
      const fetchAssignments = async () => {
        setIsAssignmentsLoading(true);
        try {
          const assignments = await getAssignmentsForMember(
            selectedMemberId,
            token
          );
          const finalAssignments = assignments.filter(
            (a) => a.chit.id === parseInt(selectedChitId)
          );
          setFilteredAssignments(finalAssignments);
        } catch (err) {
          console.error("Failed to filter assignments", err);
        } finally {
          setIsAssignmentsLoading(false);
        }
      };
      fetchAssignments();
    }
  }, [selectedChitId, selectedMemberId, mode, token]);

  const assignmentOptions = useMemo(() => {
    return filteredAssignments.map((a) => ({
      ...a,
      label: `${formatMonthYear(a.chit_month)}`,
    }));
  }, [filteredAssignments]);

  if (mode === "view" && payoutData) {
    return (
      <fieldset disabled={isFormDisabled} className="space-y-6">
        <ViewOnlyField
          label="Member"
          value={payoutData.member?.full_name || "Unknown"}
          icon={User}
        />
        <ViewOnlyField
          label="Chit"
          value={payoutData.chit?.name}
          icon={Layers}
        />
        <ViewOnlyField
          label="Winning Month"
          value={
            payoutData.assignment
              ? formatMonthYear(payoutData.assignment.chit_month)
              : "-"
          }
          icon={Calendar}
        />
        <div className="grid sm:grid-cols-2 gap-6">
          <ViewOnlyField
            label="Amount Disbursed"
            value={`₹${(payoutData.amount || 0).toLocaleString("en-IN")}`}
            icon={IndianRupee}
          />
          <ViewOnlyField
            label="Payout Date"
            value={formatDisplayDate(payoutData.paid_date)}
            icon={Calendar}
          />
        </div>
        <ViewOnlyField
          label="Method"
          value={payoutData.method}
          icon={CreditCard}
        />
        <ViewOnlyField
          label="Notes"
          value={payoutData.notes || "-"}
          icon={FileText}
        />
      </fieldset>
    );
  }

  return (
    <fieldset disabled={isFormDisabled} className="space-y-6">
      <div>
        <label
          htmlFor="chit_id"
          className="block text-lg font-medium text-text-secondary mb-1"
        >
          Chit
        </label>
        <div className="relative flex items-center">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Layers className="w-5 h-5 text-text-secondary" />
          </span>
          <div className="absolute left-10 h-6 w-px bg-border"></div>
          <select
            id="chit_id"
            name="chit_id"
            value={selectedChitId}
            onChange={handleChitChange}
            className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70"
            required
            disabled={isLoading}
          >
            <option value="">
              {isLoading ? "Loading..." : "Select a chit..."}
            </option>
            {filteredChits.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="member_id"
          className="block text-lg font-medium text-text-secondary mb-1"
        >
          Winning Member
        </label>
        <div className="relative flex items-center">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <User className="w-5 h-5 text-text-secondary" />
          </span>
          <div className="absolute left-10 h-6 w-px bg-border"></div>
          <select
            id="member_id"
            name="member_id"
            value={selectedMemberId}
            onChange={handleMemberChange}
            className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70"
            required
            disabled={!selectedChitId}
          >
            <option value="">Select a member...</option>
            {filteredMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="chit_assignment_id"
          className="block text-lg font-medium text-text-secondary mb-1"
        >
          Winning Month
        </label>
        <div className="relative flex items-center">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Calendar className="w-5 h-5 text-text-secondary" />
          </span>
          <div className="absolute left-10 h-6 w-px bg-border"></div>
          <select
            id="chit_assignment_id"
            name="chit_assignment_id"
            value={formData.chit_assignment_id}
            onChange={onFormChange}
            className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70"
            required
            disabled={isAssignmentsLoading || !selectedMemberId}
          >
            <option value="">
              {isAssignmentsLoading
                ? "Loading assignments..."
                : "Select winning month..."}
            </option>
            {assignmentOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="amount"
            className="block text-lg font-medium text-text-secondary mb-1"
          >
            Payout Amount
          </label>
          <div className="relative flex items-center">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <IndianRupee className="w-5 h-5 text-text-secondary" />
            </span>
            <div className="absolute left-10 h-6 w-px bg-border"></div>
            <input
              ref={amountInputRef}
              type="text"
              id="amount"
              name="amount"
              value={formattedAmount}
              onChange={(e) => {
                trackAmountCursor(e);
                // Standardize input update for parent
                let value = e.target.value.replace(/[^0-9.]/g, "");
                const parts = value.split(".");
                if (parts.length > 2) {
                  value = parts[0] + "." + parts.slice(1).join("");
                }
                onFormChange({ target: { name: "amount", value } });
              }}
              className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              required
              placeholder="50,000"
              inputMode="decimal"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="paid_date"
            className="block text-lg font-medium text-text-secondary mb-1"
          >
            Payout Date
          </label>
          <CustomDateInput
            name="paid_date"
            value={formData.paid_date}
            onChange={onFormChange}
            required
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="method"
          className="block text-lg font-medium text-text-secondary mb-1"
        >
          Payment Method
        </label>
        <div className="relative flex items-center">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <CreditCard className="w-5 h-5 text-text-secondary" />
          </span>
          <div className="absolute left-10 h-6 w-px bg-border"></div>
          <select
            id="method"
            name="method"
            value={formData.method}
            onChange={onFormChange}
            className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            required
          >
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="notes"
          className="block text-lg font-medium text-text-secondary mb-1"
        >
          Notes (Optional)
        </label>
        <div className="relative flex items-center">
          <span className="absolute top-4 left-0 flex items-center pl-3 pointer-events-none">
            <FileText className="w-5 h-5 text-text-secondary" />
          </span>
          <div className="absolute top-2.5 left-10 h-6 w-px bg-border pointer-events-none"></div>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={onFormChange}
            rows="3"
            className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="e.g., Disbursed via Bank Transfer"
          />
        </div>
      </div>
    </fieldset>
  );
};

export default PayoutDetailsForm;

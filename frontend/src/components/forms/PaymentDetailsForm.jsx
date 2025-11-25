// frontend/src/components/forms/PaymentDetailsForm.jsx

import { useState, useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import {
  FiBox,
  FiUser,
  FiCalendar,
  FiFileText,
  FiCreditCard,
} from "react-icons/fi";
import { RupeeIcon } from "../ui/Icons";
import { getAllChits } from "../../services/chitsService";
import { getAllMembers } from "../../services/membersService";
import {
  getAssignmentsForMember,
  getAssignmentsForChit,
} from "../../services/assignmentsService";
import CustomDateInput from "../ui/CustomDateInput";
import ViewOnlyField from "../ui/ViewOnlyField";
import useCursorTracking from "../../hooks/useCursorTracking"; // <--- Import Hook

const PaymentDetailsForm = ({
  mode,
  formData,
  onFormChange,
  defaultAssignmentId,
  paymentData,
  defaultChitId = null,
  defaultMemberId = null,
}) => {
  const { token } = useSelector((state) => state.auth);
  const isFormDisabled = mode === "view";

  const amountInputRef = useRef(null);
  // Track cursor for Amount Paid (tracks digits and decimal points)
  const trackAmountCursor = useCursorTracking(
    amountInputRef,
    formData.amount_paid,
    /[\d.]/
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

          if (defaultMemberId) {
            const memberAssignments = await getAssignmentsForMember(
              defaultMemberId,
              token
            );
            const validChitIds = new Set(
              memberAssignments.map((a) => a.chit.id)
            );
            setFilteredChits(
              chitsData.chits.filter((c) => validChitIds.has(c.id))
            );
            setFilteredMembers(
              membersData.members.filter(
                (m) => m.id === parseInt(defaultMemberId)
              )
            );
          } else if (defaultChitId) {
            const chitAssignments = await getAssignmentsForChit(
              defaultChitId,
              token
            );
            const validMemberIds = new Set(
              chitAssignments.assignments.map((a) => a.member.id)
            );
            setFilteredMembers(
              membersData.members.filter((m) => validMemberIds.has(m.id))
            );
            setFilteredChits(
              chitsData.chits.filter((c) => c.id === parseInt(defaultChitId))
            );
          } else {
            setFilteredChits(chitsData.chits);
            setFilteredMembers(membersData.members);
          }
        } catch (err) {
          console.error("Failed to load dropdown data", err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchInitialData();
  }, [mode, token, defaultChitId, defaultMemberId]);

  useEffect(() => {
    if (paymentData && (mode === "edit" || mode === "view")) {
      const chitId = String(paymentData.chit.id);
      const memberId = String(paymentData.member.id);
      setSelectedChitId(chitId);
      setSelectedMemberId(memberId);
    }
  }, [paymentData, mode]);

  const handleMemberChange = async (e) => {
    const newMemberId = e.target.value;
    setSelectedMemberId(newMemberId);
    onFormChange(e);
    onFormChange({ target: { name: "chit_assignment_id", value: "" } });
    setFilteredAssignments([]);

    if (newMemberId) {
      setIsLoading(true);
      try {
        const memberAssignments = await getAssignmentsForMember(
          newMemberId,
          token
        );
        const validChitIds = new Set(memberAssignments.map((a) => a.chit.id));
        if (!defaultChitId) {
          setFilteredChits(allChits.filter((c) => validChitIds.has(c.id)));
        }
      } catch (err) {
        console.error("Failed to fetch member assignments", err);
      } finally {
        setIsLoading(false);
      }
    } else {
      setFilteredChits(allChits);
    }
  };

  const handleChitChange = async (e) => {
    const newChitId = e.target.value;
    setSelectedChitId(newChitId);
    onFormChange(e);
    onFormChange({ target: { name: "chit_assignment_id", value: "" } });
    setFilteredAssignments([]);

    if (newChitId) {
      setIsLoading(true);
      try {
        const chitAssignments = await getAssignmentsForChit(newChitId, token);
        const validMemberIds = new Set(
          chitAssignments.assignments.map((a) => a.member.id)
        );
        if (!defaultMemberId) {
          setFilteredMembers(
            allMembers.filter((m) => validMemberIds.has(m.id))
          );
        }
      } catch (err) {
        console.error("Failed to fetch chit assignments", err);
      } finally {
        setIsLoading(false);
      }
    } else {
      setFilteredMembers(allMembers);
    }
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
          if (
            defaultAssignmentId &&
            finalAssignments.some((a) => a.id === parseInt(defaultAssignmentId))
          ) {
            onFormChange({
              target: {
                name: "chit_assignment_id",
                value: defaultAssignmentId,
              },
            });
          }
        } catch (err) {
          console.error("Failed to filter assignments", err);
        } finally {
          setIsAssignmentsLoading(false);
        }
      };
      fetchAssignments();
    }
  }, [selectedChitId, selectedMemberId, mode, token, defaultAssignmentId]);

  useEffect(() => {
    const prefillFromAssignmentId = async () => {
      if (
        defaultAssignmentId &&
        mode === "create" &&
        allChits.length > 0 &&
        allMembers.length > 0
      ) {
        // Prefill logic
      }
    };
    if (!paymentData && !defaultChitId && !defaultMemberId) {
      prefillFromAssignmentId();
    }
  }, [
    defaultAssignmentId,
    mode,
    allChits,
    allMembers,
    token,
    paymentData,
    defaultChitId,
    defaultMemberId,
  ]);

  const assignmentOptions = useMemo(() => {
    return filteredAssignments.map((a) => ({
      ...a,
      label: `${formatMonthYear(a.chit_month)}`,
    }));
  }, [filteredAssignments]);

  if (mode === "view" && paymentData) {
    const assignmentLabel = `${formatMonthYear(paymentData.chit_month)}`;
    return (
      <fieldset disabled={isFormDisabled} className="space-y-6">
        <ViewOnlyField
          label="Member"
          value={paymentData.member.full_name}
          icon={FiUser}
        />
        <ViewOnlyField
          label="Chit"
          value={paymentData.chit.name}
          icon={FiBox}
        />
        <ViewOnlyField
          label="Assignment Month"
          value={assignmentLabel}
          icon={FiCalendar}
        />
        <div className="grid sm:grid-cols-2 gap-6">
          <ViewOnlyField
            label="Amount Paid"
            value={`₹${paymentData.amount_paid.toLocaleString("en-IN")}`}
            icon={RupeeIcon}
          />
          <ViewOnlyField
            label="Payment Date"
            value={formatDisplayDate(paymentData.payment_date)}
            icon={FiCalendar}
          />
        </div>
        <ViewOnlyField
          label="Payment Method"
          value={paymentData.payment_method}
          icon={FiCreditCard}
        />
        <ViewOnlyField
          label="Notes"
          value={formData.notes || "-"}
          icon={FiFileText}
        />
      </fieldset>
    );
  }

  return (
    <fieldset disabled={isFormDisabled} className="space-y-6">
      {/* Member & Chit Selectors (Unchanged) */}
      <div>
        <label
          htmlFor="member_id"
          className="block text-lg font-medium text-text-secondary mb-1"
        >
          Member
        </label>
        <div className="relative flex items-center">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <FiUser className="w-5 h-5 text-text-secondary" />
          </span>
          <div className="absolute left-10 h-6 w-px bg-border"></div>
          <select
            id="member_id"
            name="member_id"
            value={selectedMemberId}
            onChange={handleMemberChange}
            className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
            required
            disabled={isLoading || !!defaultMemberId}
          >
            <option value="">
              {isLoading ? "Loading..." : "Select a member..."}
            </option>
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
          htmlFor="chit_id"
          className="block text-lg font-medium text-text-secondary mb-1"
        >
          Chit
        </label>
        <div className="relative flex items-center">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <FiBox className="w-5 h-5 text-text-secondary" />
          </span>
          <div className="absolute left-10 h-6 w-px bg-border"></div>
          <select
            id="chit_id"
            name="chit_id"
            value={selectedChitId}
            onChange={handleChitChange}
            className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
            required
            disabled={isLoading || !!defaultChitId}
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
          htmlFor="chit_assignment_id"
          className="block text-lg font-medium text-text-secondary mb-1"
        >
          Assignment Month
        </label>
        <div className="relative flex items-center">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <FiCalendar className="w-5 h-5 text-text-secondary" />
          </span>
          <div className="absolute left-10 h-6 w-px bg-border"></div>
          <select
            id="chit_assignment_id"
            name="chit_assignment_id"
            value={formData.chit_assignment_id}
            onChange={onFormChange}
            className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
            required
            disabled={
              isAssignmentsLoading || !selectedChitId || !selectedMemberId
            }
          >
            <option value="">
              {isAssignmentsLoading
                ? "Loading assignments..."
                : "Select an assignment..."}
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
        {/* Amount Paid - FIX APPLIED HERE */}
        <div>
          <label
            htmlFor="amount_paid"
            className="block text-lg font-medium text-text-secondary mb-1"
          >
            Amount Paid
          </label>
          <div className="relative flex items-center">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <RupeeIcon className="w-5 h-5 text-text-secondary" />
            </span>
            <div className="absolute left-10 h-6 w-px bg-border"></div>
            <input
              ref={amountInputRef} // <--- Attach Ref
              type="text"
              id="amount_paid"
              name="amount_paid"
              value={formData.amount_paid}
              onChange={(e) => {
                trackAmountCursor(e); // <--- Track Cursor
                let value = e.target.value.replace(/[^0-9.]/g, "");
                const parts = value.split(".");
                if (parts.length > 2) {
                  value = parts[0] + "." + parts.slice(1).join("");
                }
                onFormChange({ target: { name: "amount_paid", value } });
              }}
              className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
              required
              placeholder="5000"
              inputMode="decimal"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="payment_date"
            className="block text-lg font-medium text-text-secondary mb-1"
          >
            Payment Date
          </label>
          <CustomDateInput
            name="payment_date"
            value={formData.payment_date}
            onChange={onFormChange}
            required
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="payment_method"
          className="block text-lg font-medium text-text-secondary mb-1"
        >
          Payment Method
        </label>
        <div className="relative flex items-center">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <FiCreditCard className="w-5 h-5 text-text-secondary" />
          </span>
          <div className="absolute left-10 h-6 w-px bg-border"></div>
          <select
            id="payment_method"
            name="payment_method"
            value={formData.payment_method}
            onChange={onFormChange}
            className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
            required
          >
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Other">Other</option>
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
            <FiFileText className="w-5 h-5 text-text-secondary" />
          </span>
          <div className="absolute top-2.5 left-10 h-6 w-px bg-border pointer-events-none"></div>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={onFormChange}
            rows="3"
            className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
            placeholder="e.g., Paid via GPay"
          />
        </div>
      </div>
    </fieldset>
  );
};

export default PaymentDetailsForm;

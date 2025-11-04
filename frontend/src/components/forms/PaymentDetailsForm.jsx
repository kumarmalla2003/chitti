// frontend/src/components/forms/PaymentDetailsForm.jsx

import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  FiBox,
  FiUser,
  FiCalendar,
  FiFileText,
  FiCreditCard,
} from "react-icons/fi";
import { RupeeIcon } from "../ui/Icons";
import { getAllChitGroups } from "../../services/chitsService";
import { getAllMembers } from "../../services/membersService";
import {
  getAssignmentsForMember,
  getAssignmentsForGroup,
} from "../../services/assignmentsService";
import CustomDateInput from "../ui/CustomDateInput";
import ViewOnlyField from "../ui/ViewOnlyField";

const PaymentDetailsForm = ({
  mode,
  formData,
  onFormChange,
  defaultAssignmentId,
  paymentData, // Full payment object for view/edit
  // --- NEW PROPS ---
  defaultGroupId = null,
  defaultMemberId = null,
}) => {
  const { token } = useSelector((state) => state.auth);
  const isFormDisabled = mode === "view";

  // --- State for fetched data ---
  const [allGroups, setAllGroups] = useState([]);
  const [allMembers, setAllMembers] = useState([]);

  // --- State for dropdown options ---
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);

  // --- State for selected IDs ---
  // --- MODIFICATION: Initialize from new props ---
  const [selectedGroupId, setSelectedGroupId] = useState(defaultGroupId || "");
  const [selectedMemberId, setSelectedMemberId] = useState(
    defaultMemberId || ""
  );

  // --- State for loading indicators ---
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);

  // --- Helper function for "Invalid Date" bug ---
  const formatMonthYear = (dateString) => {
    if (!dateString) return "-";
    // Create date as UTC to avoid timezone issues
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

  // --- Initial Data Fetching ---
  useEffect(() => {
    const fetchInitialData = async () => {
      if (mode !== "view") {
        setIsLoading(true);
        try {
          const [groupsData, membersData] = await Promise.all([
            getAllChitGroups(token),
            getAllMembers(token),
          ]);
          setAllGroups(groupsData.groups);
          setAllMembers(membersData.members);

          // --- MODIFICATION: Pre-filter based on default props ---
          if (defaultMemberId) {
            // If member is pre-selected, filter groups
            const memberAssignments = await getAssignmentsForMember(
              defaultMemberId,
              token
            );
            const validGroupIds = new Set(
              memberAssignments.map((a) => a.chit_group.id)
            );
            setFilteredGroups(
              groupsData.groups.filter((g) => validGroupIds.has(g.id))
            );
            setFilteredMembers(
              membersData.members.filter(
                (m) => m.id === parseInt(defaultMemberId)
              )
            );
          } else if (defaultGroupId) {
            // If group is pre-selected, filter members
            const groupAssignments = await getAssignmentsForGroup(
              defaultGroupId,
              token
            );
            const validMemberIds = new Set(
              groupAssignments.assignments.map((a) => a.member.id)
            );
            setFilteredMembers(
              membersData.members.filter((m) => validMemberIds.has(m.id))
            );
            setFilteredGroups(
              groupsData.groups.filter((g) => g.id === parseInt(defaultGroupId))
            );
          } else {
            // No defaults, show all
            setFilteredGroups(groupsData.groups);
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
  }, [mode, token, defaultGroupId, defaultMemberId]);

  // --- Pre-fill logic for edit/view modes ---
  useEffect(() => {
    if (paymentData && (mode === "edit" || mode === "view")) {
      const groupId = String(paymentData.chit_group.id);
      const memberId = String(paymentData.member.id);
      setSelectedGroupId(groupId);
      setSelectedMemberId(memberId);
      // Assignments will be fetched by the effect below
    }
  }, [paymentData, mode]);

  // --- CASCADING DROPDOWN LOGIC (REBUILT) ---

  // 1. Handle MEMBER selection
  const handleMemberChange = async (e) => {
    const newMemberId = e.target.value;
    setSelectedMemberId(newMemberId);
    onFormChange(e); // Update form data's member_id

    // Reset dependent fields
    onFormChange({ target: { name: "chit_assignment_id", value: "" } });
    setFilteredAssignments([]);

    if (newMemberId) {
      setIsLoading(true);
      try {
        const memberAssignments = await getAssignmentsForMember(
          newMemberId,
          token
        );
        const validGroupIds = new Set(
          memberAssignments.map((a) => a.chit_group.id)
        );
        // --- MODIFICATION: Don't reset if defaultGroup is set ---
        if (!defaultGroupId) {
          setFilteredGroups(allGroups.filter((g) => validGroupIds.has(g.id)));
        }
      } catch (err) {
        console.error("Failed to fetch member assignments", err);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Reset groups to all
      setFilteredGroups(allGroups);
    }
  };

  // 2. Handle GROUP selection
  const handleGroupChange = async (e) => {
    const newGroupId = e.target.value;
    setSelectedGroupId(newGroupId);
    onFormChange(e); // Update form data's chit_group_id

    // Reset dependent fields
    onFormChange({ target: { name: "chit_assignment_id", value: "" } });
    setFilteredAssignments([]);

    if (newGroupId) {
      setIsLoading(true);
      try {
        const groupAssignments = await getAssignmentsForGroup(
          newGroupId,
          token
        );
        const validMemberIds = new Set(
          groupAssignments.assignments.map((a) => a.member.id)
        );
        // --- MODIFICATION: Don't reset if defaultMember is set ---
        if (!defaultMemberId) {
          setFilteredMembers(
            allMembers.filter((m) => validMemberIds.has(m.id))
          );
        }
      } catch (err) {
        console.error("Failed to fetch group assignments", err);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Reset members to all
      setFilteredMembers(allMembers);
    }
  };

  // 3. Populate ASSIGNMENTS when *both* are selected
  useEffect(() => {
    if (selectedGroupId && selectedMemberId && mode !== "view") {
      const fetchAssignments = async () => {
        setIsAssignmentsLoading(true);
        try {
          // --- MODIFICATION: Use allMembers to find assignments ---
          const assignments = await getAssignmentsForMember(
            selectedMemberId,
            token
          );
          const finalAssignments = assignments.filter(
            (a) => a.chit_group.id === parseInt(selectedGroupId)
          );
          setFilteredAssignments(finalAssignments);

          // If there's a default ID, check if it's in this list
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
  }, [selectedGroupId, selectedMemberId, mode, token, defaultAssignmentId]);

  // 4. Pre-fill from defaultAssignmentId (e.g., from 'Log Payment' button)
  useEffect(() => {
    const prefillFromAssignmentId = async () => {
      if (
        defaultAssignmentId &&
        mode === "create" &&
        allGroups.length > 0 &&
        allMembers.length > 0
      ) {
        // Find the assignment to pre-fill both dropdowns
        let found = false;
        for (const member of allMembers) {
          const assignments = await getAssignmentsForMember(member.id, token);
          const matchingAssignment = assignments.find(
            (a) => a.id === parseInt(defaultAssignmentId)
          );
          if (matchingAssignment) {
            setSelectedMemberId(String(member.id));
            setSelectedGroupId(String(matchingAssignment.chit_group.id));
            onFormChange({
              target: { name: "member_id", value: String(member.id) },
            });
            onFormChange({
              target: {
                name: "chit_group_id",
                value: String(matchingAssignment.chit_group.id),
              },
            });
            onFormChange({
              target: {
                name: "chit_assignment_id",
                value: defaultAssignmentId,
              },
            });
            found = true;
            break;
          }
        }
      }
    };
    // Only run if the form isn't already populated from edit/view mode
    // --- MODIFICATION: Also check default props ---
    if (!paymentData && !defaultGroupId && !defaultMemberId) {
      prefillFromAssignmentId();
    }
  }, [
    defaultAssignmentId,
    mode,
    allGroups,
    allMembers,
    token,
    paymentData,
    defaultGroupId,
    defaultMemberId,
  ]);
  // --- END CASCADING DROPDOWN LOGIC ---

  // Memoize assignment options
  const assignmentOptions = useMemo(() => {
    return filteredAssignments.map((a) => ({
      ...a,
      label: `${formatMonthYear(a.chit_month)}`,
    }));
  }, [filteredAssignments]);

  // --- VIEW MODE ---
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
          label="Chit Group"
          value={paymentData.chit_group.name}
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
        <div>
          <label className="block text-lg font-medium text-text-secondary mb-1">
            Notes
          </label>
          <div className="relative flex items-center">
            <span className="absolute top-4 left-0 flex items-center pl-3 pointer-events-none">
              <FiFileText className="w-5 h-5 text-text-secondary" />
            </span>
            <div className="absolute top-2.5 left-10 h-6 w-px bg-border pointer-events-none"></div>
            <div className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md text-text-primary min-h-[84px] whitespace-pre-wrap break-words">
              {formData.notes || "-"}
            </div>
          </div>
        </div>
      </fieldset>
    );
  }

  // --- CREATE/EDIT MODE ---
  return (
    <fieldset disabled={isFormDisabled} className="space-y-6">
      {/* Member Selector */}
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
            disabled={isLoading || !!defaultMemberId} // --- MODIFICATION: Disable if defaultId
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

      {/* Group Selector */}
      <div>
        <label
          htmlFor="chit_group_id"
          className="block text-lg font-medium text-text-secondary mb-1"
        >
          Chit Group
        </label>
        <div className="relative flex items-center">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <FiBox className="w-5 h-5 text-text-secondary" />
          </span>
          <div className="absolute left-10 h-6 w-px bg-border"></div>
          <select
            id="chit_group_id"
            name="chit_group_id"
            value={selectedGroupId}
            onChange={handleGroupChange}
            className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
            required
            disabled={isLoading || !!defaultGroupId} // --- MODIFICATION: Disable if defaultId
          >
            <option value="">
              {isLoading ? "Loading..." : "Select a group..."}
            </option>
            {filteredGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignment Selector */}
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
              isAssignmentsLoading || !selectedGroupId || !selectedMemberId
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
        {/* Amount Paid */}
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
              type="text"
              id="amount_paid"
              name="amount_paid"
              value={formData.amount_paid}
              onChange={(e) => {
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

        {/* Payment Date */}
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

      {/* Payment Method */}
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

      {/* Notes */}
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

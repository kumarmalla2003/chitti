// frontend/src/features/payouts/components/forms/PayoutDetailsForm.jsx

import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useWatch, Controller } from "react-hook-form";
import {
  Layers,
  User,
  Calendar,
  FileText,
  CreditCard,
  IndianRupee,
} from "lucide-react";
import { getAllChits } from "../../../../services/chitsService";
import { getAllMembers } from "../../../../services/membersService";
import {
  getAssignmentsForMember,
  getAssignmentsForChit,
} from "../../../../services/assignmentsService";
import CustomDateInput from "../../../../components/ui/CustomDateInput";
import ViewOnlyField from "../../../../components/ui/ViewOnlyField";
import FormattedInput from "../../../../components/ui/FormattedInput";
import Skeleton from "../../../../components/ui/Skeleton";

const PayoutDetailsForm = ({
  mode,
  control,
  register,
  setValue,
  errors,
  defaultAssignmentId,
  payoutData,
  defaultChitId = null,
  defaultMemberId = null,
}) => {
  const { token } = useSelector((state) => state.auth);
  const isFormDisabled = mode === "view";

  const selectedChitId = useWatch({ control, name: "chit_id" });
  const selectedMemberId = useWatch({ control, name: "member_id" });

  const [allChits, setAllChits] = useState([]);
  const [allMembers, setAllMembers] = useState([]);

  const [filteredChits, setFilteredChits] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);

  // Initial Data Fetch
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

  // Filter Members based on Chit
  useEffect(() => {
    if (mode === "view") return;

    const filterMembers = async () => {
      if (selectedChitId) {
        try {
          const chitAssignments = await getAssignmentsForChit(selectedChitId, token);
          const validMemberIds = new Set(
            chitAssignments.assignments.map((a) => a.member.id)
          );

          // Keep all members if defaultMemberId is set (logic preserved?)
          // Actually usually we want to filter to only members in that chit.
          if (!defaultMemberId) {
            const newFilteredMembers = allMembers.filter((m) => validMemberIds.has(m.id));
            setFilteredMembers(newFilteredMembers);

            // If current member is not in the list, clear it
            if (selectedMemberId && !validMemberIds.has(Number(selectedMemberId))) {
              setValue("member_id", "");
            }
          }
        } catch (err) {
          console.error("Failed to fetch chit assignments", err);
        }
      } else {
        setFilteredMembers(allMembers);
      }
    }

    if (!isLoading && allMembers.length > 0) {
      filterMembers();
    }
  }, [selectedChitId, allMembers, defaultMemberId, mode, token, setValue, isLoading]);

  // Filter Chits based on Member (Optional, usually Payout starts with Chit?)
  // Logic in original code allowed Member selection to filter Chits too?
  // Original `handleMemberChange` logic did NOT filtering Chits.
  // Wait, let's look at original `handleMemberChange`:
  // It only sets selectedMemberId and clears assignment.
  // BUT `handleChitChange` filtered Members.
  // So validation implies: Select Chit -> Filter Members.
  // There was NO reverse filtering (Select Member -> Filter Chits) in PayoutDetailsForm?
  // Original `handleMemberChange` only did `setSelectedMemberId`.
  // CHECK LINES 138-143:
  // const handleMemberChange = (e) => { setSelectedMemberId... onFormChange... }
  // Only Chit change had the filtering logic.
  // So I should NOT implement reverse filtering here to match original behavior.

  // Assignments Fetching
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
    } else {
      setFilteredAssignments([]);
    }
  }, [selectedChitId, selectedMemberId, mode, token]);

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
            {...register("chit_id")}
            id="chit_id"
            className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 ${errors.chit_id ? "border-red-500" : "border-border"}`}
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
        {errors.chit_id && <p className="text-red-500 text-sm mt-1">{errors.chit_id.message}</p>}
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
            {...register("member_id")}
            id="member_id"
            className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 ${errors.member_id ? "border-red-500" : "border-border"}`}
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
        {errors.member_id && <p className="text-red-500 text-sm mt-1">{errors.member_id.message}</p>}
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
            {...register("chit_assignment_id")}
            id="chit_assignment_id"
            className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 ${errors.chit_assignment_id ? "border-red-500" : "border-border"}`}
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
          {isAssignmentsLoading && (
            <div className="absolute inset-0 z-10">
              <Skeleton.Input />
            </div>
          )}
        </div>
        {errors.chit_assignment_id && <p className="text-red-500 text-sm mt-1">{errors.chit_assignment_id.message}</p>}
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
            <FormattedInput
              name="amount"
              control={control}
              format={(val) => val}
              parse={(val) => {
                const raw = val.replace(/[^0-9.]/g, "");
                return raw ? Number(raw) : "";
              }}
              className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent ${errors.amount ? "border-red-500" : "border-border"}`}
              placeholder="50,000"
            />
          </div>
          {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>}
        </div>

        <div>
          <label
            htmlFor="paid_date"
            className="block text-lg font-medium text-text-secondary mb-1"
          >
            Payout Date
          </label>
          <Controller
            name="paid_date"
            control={control}
            render={({ field }) => (
              <CustomDateInput
                {...field}
                value={field.value || ""}
                onChange={(val) => field.onChange(val)}
                className={errors.paid_date ? "border-red-500" : ""}
              />
            )}
          />
          {errors.paid_date && <p className="text-red-500 text-sm mt-1">{errors.paid_date.message}</p>}
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
            {...register("method")}
            id="method"
            className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent ${errors.method ? "border-red-500" : "border-border"}`}
          >
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>
        {errors.method && <p className="text-red-500 text-sm mt-1">{errors.method.message}</p>}
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
            {...register("notes")}
            id="notes"
            rows="3"
            className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="e.g., Disbursed via Bank Transfer"
            autoComplete="off"
            autoCorrect="off"
          />
        </div>
      </div>
    </fieldset>
  );
};

export default PayoutDetailsForm;

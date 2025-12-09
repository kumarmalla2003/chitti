// frontend/src/features/collections/components/forms/CollectionDetailsForm.jsx

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

const CollectionDetailsForm = ({
  mode,
  control,
  register,
  setValue,
  errors,
  paymentData, // Can be used for 'view' mode data
  defaultChitId = null,
  defaultMemberId = null,
  defaultAssignmentId = null,
}) => {
  const { token } = useSelector((state) => state.auth);
  const isFormDisabled = mode === "view";

  // Watch fields to trigger side-effects
  const selectedMemberId = useWatch({ control, name: "member_id" });
  const selectedChitId = useWatch({ control, name: "chit_id" });
  // We need to watch assignment ID for enabling fields or just rely on RHF
  const selectedAssignmentId = useWatch({ control, name: "chit_assignment_id" });

  const [allChits, setAllChits] = useState([]);
  const [allMembers, setAllMembers] = useState([]);

  const [filteredChits, setFilteredChits] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);

  // Initial Fetch
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

  // Effect: When Member changes (and not View mode)
  useEffect(() => {
    if (mode === "view") return;

    const filterChitsByMember = async () => {
      if (selectedMemberId) {
        // If we have a default Chit ID and it matches, we might not need to filter or clearing
        // But generally if Member changes, we filter available chits
        try {
          const memberAssignments = await getAssignmentsForMember(
            selectedMemberId,
            token
          );
          const validChitIds = new Set(memberAssignments.map((a) => a.chit.id));

          if (!defaultChitId) {
            const newFilteredChits = allChits.filter((c) => validChitIds.has(c.id));
            setFilteredChits(newFilteredChits);

            // If selected Chit is no longer valid, clear it
            if (selectedChitId && !validChitIds.has(Number(selectedChitId))) {
              setValue("chit_id", "");
            }
          }
        } catch (err) {
          console.error("Failed to fetch member assignments", err);
        }
      } else {
        // Reset filters if no member selected (and no default)
        if (!defaultChitId) setFilteredChits(allChits);
      }
    };

    // Defer to avoid conflict with initial load
    if (!isLoading && allChits.length > 0) {
      filterChitsByMember();
    }
  }, [selectedMemberId, allChits, defaultChitId, mode, token, setValue, isLoading]); // Removed selectedChitId from filtered deps to avoid loops?

  // Effect: When Chit changes
  useEffect(() => {
    if (mode === "view") return;

    const filterMembersByChit = async () => {
      if (selectedChitId) {
        try {
          const chitAssignments = await getAssignmentsForChit(selectedChitId, token);
          const validMemberIds = new Set(
            chitAssignments.assignments.map((a) => a.member.id)
          );

          if (!defaultMemberId) {
            const newFilteredMembers = allMembers.filter((m) => validMemberIds.has(m.id));
            setFilteredMembers(newFilteredMembers);

            if (selectedMemberId && !validMemberIds.has(Number(selectedMemberId))) {
              setValue("member_id", "");
            }
          }
        } catch (err) {
          console.error("Failed to fetch chit assignments", err);
        }
      } else {
        if (!defaultMemberId) setFilteredMembers(allMembers);
      }
    };

    if (!isLoading && allMembers.length > 0) {
      filterMembersByChit();
    }
  }, [selectedChitId, allMembers, defaultMemberId, mode, token, setValue, isLoading]);

  // Effect: Fetch Assignments when both selected
  useEffect(() => {
    if (selectedChitId && selectedMemberId && mode !== "view") {
      const fetchAssignments = async () => {
        setIsAssignmentsLoading(true);
        try {
          // We can fetch assignments for Member and filter by Chit
          // Or getAssignmentsForChit and filter by Member.
          // Original used getAssignmentsForMember(selectedMemberId)
          const assignments = await getAssignmentsForMember(
            selectedMemberId,
            token
          );
          const finalAssignments = assignments.filter(
            (a) => a.chit.id === parseInt(selectedChitId)
          );
          setFilteredAssignments(finalAssignments);

          // Auto-select assignment if only one? OR check defaultAssignmentId
          // NOTE: CollectionHistoryList sets defaults. RHF 'reset' should handle value.
          // IF defaultAssignmentId is passed prop (e.g. from container resetting form),
          // checking it here might be redundant if 'reset' sets the value.
          // BUT: 'reset' sets the value in form state. The OPTIONS must be available for it to show correctly.
          // So fetching assignments is critical.

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

  if (mode === "view" && paymentData) {
    // ... View Mode render (unchanged logic just using props)
    const assignmentLabel = `${formatMonthYear(paymentData.chit_month)}`;
    return (
      <fieldset disabled={isFormDisabled} className="space-y-6">
        <ViewOnlyField
          label="Member"
          value={paymentData.member.full_name}
          icon={User}
        />
        <ViewOnlyField
          label="Chit"
          value={paymentData.chit.name}
          icon={Layers}
        />
        <ViewOnlyField
          label="Assignment Month"
          value={assignmentLabel}
          icon={Calendar}
        />
        <div className="grid sm:grid-cols-2 gap-6">
          <ViewOnlyField
            label="Amount Paid"
            value={`₹${paymentData.amount_paid.toLocaleString("en-IN")}`}
            icon={IndianRupee}
          />
          <ViewOnlyField
            label="Collection Date"
            value={formatDisplayDate(
              paymentData.collection_date || paymentData.payment_date
            )}
            icon={Calendar}
          />
        </div>
        <ViewOnlyField
          label="Collection Method"
          value={paymentData.collection_method || paymentData.payment_method}
          icon={CreditCard}
        />
        <ViewOnlyField
          label="Notes"
          value={paymentData.notes || "-"}
          icon={FileText}
        />
      </fieldset>
    );
  }

  // --- CREATE / EDIT FORM ---
  return (
    <fieldset disabled={isFormDisabled} className="space-y-6">
      {/* MEMBER */}
      <div>
        <label
          htmlFor="member_id"
          className="block text-lg font-medium text-text-secondary mb-1"
        >
          Member
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
        {errors.member_id && <p className="text-red-500 text-sm mt-1">{errors.member_id.message}</p>}
      </div>

      {/* CHIT */}
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

      {/* ASSIGNMENT */}
      <div>
        <label
          htmlFor="chit_assignment_id"
          className="block text-lg font-medium text-text-secondary mb-1"
        >
          Assignment Month
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
        {errors.chit_assignment_id && <p className="text-red-500 text-sm mt-1">{errors.chit_assignment_id.message}</p>}
      </div>

      {/* AMOUNT & DATE */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="amount_paid"
            className="block text-lg font-medium text-text-secondary mb-1"
          >
            Amount Paid
          </label>
          <div className="relative flex items-center">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <IndianRupee className="w-5 h-5 text-text-secondary" />
            </span>
            <div className="absolute left-10 h-6 w-px bg-border"></div>
            <FormattedInput
              name="amount_paid"
              control={control}
              format={(val) => val}
              parse={(val) => {
                const raw = val.replace(/[^0-9.]/g, "");
                // Optional: logic to keep one dot
                return raw ? Number(raw) : "";
              }}
              className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent ${errors.amount_paid ? "border-red-500" : "border-border"}`}
              placeholder="5000"
            />
          </div>
          {errors.amount_paid && <p className="text-red-500 text-sm mt-1">{errors.amount_paid.message}</p>}
        </div>

        <div>
          <label
            htmlFor="collection_date"
            className="block text-lg font-medium text-text-secondary mb-1"
          >
            Collection Date
          </label>
          <Controller
            name="collection_date"
            control={control}
            render={({ field }) => (
              <CustomDateInput
                {...field}
                value={field.value || ""}
                onChange={(val) => field.onChange(val)} // CustomDateInput expects direct value usually
                className={errors.collection_date ? "border-red-500" : ""}
              />
            )}
          />
          {errors.collection_date && <p className="text-red-500 text-sm mt-1">{errors.collection_date.message}</p>}
        </div>
      </div>

      {/* METHOD */}
      <div>
        <label
          htmlFor="collection_method"
          className="block text-lg font-medium text-text-secondary mb-1"
        >
          Collection Method
        </label>
        <div className="relative flex items-center">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <CreditCard className="w-5 h-5 text-text-secondary" />
          </span>
          <div className="absolute left-10 h-6 w-px bg-border"></div>
          <select
            {...register("collection_method")}
            id="collection_method"
            className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent ${errors.collection_method ? "border-red-500" : "border-border"}`}
          >
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Other">Other</option>
          </select>
        </div>
        {errors.collection_method && <p className="text-red-500 text-sm mt-1">{errors.collection_method.message}</p>}
      </div>

      {/* NOTES */}
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
            placeholder="e.g., Paid via GPay"
          />
        </div>
      </div>
    </fieldset>
  );
};

export default CollectionDetailsForm;

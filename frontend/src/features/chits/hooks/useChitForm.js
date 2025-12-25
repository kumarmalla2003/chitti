// frontend/src/features/chits/hooks/useChitForm.js

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { chitSchema } from "../schemas/chitSchema";
import { useCreateChit, useUpdateChit } from "./useChits";
import { getChitById } from "../../../services/chitsService";
import {
  normalizeChitForForm,
  normalizeFormDataForApi,
  getChangedFields,
} from "../utils/normalizeChit";
import {
  calculateEndDate,
  calculateStartDate,
  calculateDuration,
} from "../../../utils/calculations";

/**
 * Default form values for chit creation
 */
const DEFAULT_VALUES = {
  name: "",
  chit_value: "",
  size: "",
  chit_type: "fixed",
  monthly_installment: "",
  payout_premium_percent: "",
  foreman_commission_percent: "",
  duration_months: "",
  start_date: "",
  end_date: "",
  collection_day: "",
  payout_day: "",
  notes: "",
};

// --- Inline Validation Helpers (match schema rules) ---

/**
 * Validate size/duration value (must be positive integer 1-100)
 */
const isValidSizeDuration = (val) => {
  if (val === "" || val === null || val === undefined) return false;
  const num = Number(val);
  return !Number.isNaN(num) && Number.isInteger(num) && num > 0 && num <= 100;
};

/**
 * Validate date string (YYYY-MM format, valid month 1-12, in range 01/2000-12/2999)
 */
const isValidDate = (val) => {
  if (!val || typeof val !== "string") return false;
  if (!/^\d{4}-\d{2}$/.test(val)) return false;

  const [year, month] = val.split("-").map(Number);

  // Valid month check (1-12)
  if (month < 1 || month > 12) return false;

  // Min date check (>= 01/2000)
  if (year < 2000 || (year === 2000 && month < 1)) return false;

  // Max date check (<= 12/2999)
  if (year > 2999 || (year === 2999 && month > 12)) return false;

  return true;
};

/**
 * Validate chit_value (must be positive, <= 1,000,000,000)
 */
const isValidChitValue = (val) => {
  if (val === "" || val === null || val === undefined) return false;
  const num = Number(val);
  return !Number.isNaN(num) && num > 0 && num <= 1000000000;
};


/**
 * Custom hook for managing chit form state and submission.
 *
 * @param {string|number} id - Chit ID for edit/view modes (null for create)
 * @param {string} mode - Form mode: 'create', 'edit', or 'view'
 * @returns {Object} Form state and handlers
 */
export const useChitForm = (id, mode) => {
  // --- State ---
  const [originalData, setOriginalData] = useState(null);
  const [createdChitId, setCreatedChitId] = useState(null);
  const [pageLoading, setPageLoading] = useState(mode !== "create");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // --- React Query Mutations ---
  const createChitMutation = useCreateChit();
  const updateChitMutation = useUpdateChit();

  // --- React Hook Form ---
  const form = useForm({
    resolver: zodResolver(chitSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onTouched",
  });

  const { reset, setValue, getValues, trigger, handleSubmit } = form;

  // --- Watched Fields for Auto-Calculations ---
  const wSize = useWatch({ control: form.control, name: "size" });
  const wChitValue = useWatch({ control: form.control, name: "chit_value" });
  const wDuration = useWatch({ control: form.control, name: "duration_months" });
  const wStartDate = useWatch({ control: form.control, name: "start_date" });
  const wEndDate = useWatch({ control: form.control, name: "end_date" });
  const watchedChitType = useWatch({ control: form.control, name: "chit_type" });
  const watchedName = useWatch({ control: form.control, name: "name" });

  // --- Derived State ---
  const createdChitName = useMemo(
    () => originalData?.name || null,
    [originalData]
  );

  const isPostCreation = useMemo(
    () => mode === "create" && createdChitId !== null,
    [mode, createdChitId]
  );

  // --- Compute if chit has active operations (should lock most fields in edit mode) ---
  const hasActiveOperations = useMemo(() => {
    if (!originalData) return false;
    // Lock only when members are assigned (they are affected by changes)
    // Note: status check removed - if no members, changes affect no one
    return (originalData.members_count ?? 0) > 0;
  }, [originalData]);

  // --- Memoized TABS ---
  const TABS = useMemo(() => {
    // New simplified 3-tab structure
    return ["details", "assignments", "transactions"];
  }, []);

  // --- Auto-Calculation Effects ---

  // Track which field was last edited by user (for Size <-> Duration sync)
  const lastEditedField = useRef(null);

  // Track previous chit_type for clearing fields
  const prevChitType = useRef(watchedChitType);

  // Handlers to track which field user is editing
  const handleSizeChange = useCallback(() => {
    lastEditedField.current = "size";
  }, []);

  const handleDurationChange = useCallback(() => {
    lastEditedField.current = "duration";
  }, []);

  // Auto-calculate monthly_installment for Variable chits (base installment = chit_value / size)
  useEffect(() => {
    if (watchedChitType !== "variable") return;

    const chitValue = Number(wChitValue);
    const size = Number(wSize);

    // Only calculate if BOTH chit_value AND size are VALID
    if (isValidChitValue(wChitValue) && isValidSizeDuration(wSize)) {
      const calculated = Math.floor(chitValue / size);
      setValue("monthly_installment", calculated, { shouldValidate: true });
    }
  }, [wChitValue, wSize, watchedChitType, setValue]);

  // Clear type-specific fields when chit_type changes
  // Note: We do NOT trigger validation here to avoid showing 'required' errors on untouched fields
  // Validation will run when user interacts with the relevant field or submits the form
  useEffect(() => {
    // Skip on initial render or if type hasn't changed
    if (prevChitType.current === watchedChitType) return;

    // Update ref for next comparison
    prevChitType.current = watchedChitType;

    // Clear irrelevant fields and their errors based on new chit_type
    if (watchedChitType === "fixed") {
      // Fixed: clear variable and auction fields
      setValue("payout_premium_percent", "", { shouldValidate: false });
      setValue("foreman_commission_percent", "", { shouldValidate: false });
      form.clearErrors(["payout_premium_percent", "foreman_commission_percent"]);
      // Do NOT trigger monthly_installment validation - let user interact first
    } else if (watchedChitType === "variable") {
      // Variable: clear ONLY fixed fields (monthly_installment)
      // Keep foreman_commission_percent - Variable chits also require it!
      setValue("monthly_installment", "", { shouldValidate: false });
      form.clearErrors(["monthly_installment"]);
      // Do NOT trigger payout_premium_percent or foreman_commission_percent validation - let user interact first
    } else if (watchedChitType === "auction") {
      // Auction: clear fixed and variable fields
      setValue("monthly_installment", "", { shouldValidate: false });
      setValue("payout_premium_percent", "", { shouldValidate: false });
      form.clearErrors(["monthly_installment", "payout_premium_percent"]);
      // Do NOT trigger foreman_commission_percent validation - let user interact first
    }
  }, [watchedChitType, setValue, form]);

  // Sync Size <-> Duration based on which field was last edited
  // Also clears BOTH dates if size/duration is cleared to prevent orphaned data
  useEffect(() => {
    // Skip if no field has been edited yet
    if (!lastEditedField.current) return;

    const sizeVal = wSize;
    const durationVal = wDuration;
    const sizeEmpty = sizeVal === "" || sizeVal === null || sizeVal === undefined || Number.isNaN(sizeVal);
    const durationEmpty = durationVal === "" || durationVal === null || durationVal === undefined || Number.isNaN(durationVal);

    if (lastEditedField.current === "size") {
      // User is editing size - sync to duration
      if (sizeEmpty) {
        if (!durationEmpty) {
          setValue("duration_months", "", { shouldValidate: true });
        }
        // Clear BOTH dates if size is cleared
        if (wStartDate) {
          setValue("start_date", "", { shouldValidate: true });
        }
        if (wEndDate) {
          setValue("end_date", "", { shouldValidate: true });
        }
      } else if (isValidSizeDuration(sizeVal) && Number(sizeVal) !== Number(durationVal)) {
        // Only sync if size is VALID
        setValue("duration_months", Number(sizeVal), { shouldValidate: true });
      }
    } else if (lastEditedField.current === "duration") {
      // User is editing duration - sync to size
      if (durationEmpty) {
        if (!sizeEmpty) {
          setValue("size", "", { shouldValidate: true });
        }
        // Clear BOTH dates if duration is cleared
        if (wStartDate) {
          setValue("start_date", "", { shouldValidate: true });
        }
        if (wEndDate) {
          setValue("end_date", "", { shouldValidate: true });
        }
      } else if (isValidSizeDuration(durationVal) && Number(durationVal) !== Number(sizeVal)) {
        // Only sync if duration is VALID
        setValue("size", Number(durationVal), { shouldValidate: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wSize, wDuration, setValue]); // REMOVED wStartDate, wEndDate to prevent infinite clearing loop when entering dates

  // Track which date field was last edited to prevent loops
  const lastEditedDateField = useRef(null);

  // Recalculate End Date when Duration changes (only if start_date exists and user is not editing end_date)
  useEffect(() => {
    // Skip if user is currently editing end_date (they want to change it manually)
    if (lastEditedDateField.current === "end_date") return;

    // Only calculate if duration is valid AND start_date is valid
    if (!isValidSizeDuration(wDuration) || !isValidDate(wStartDate)) return;

    const newEndDate = calculateEndDate(wStartDate, wDuration);
    if (newEndDate && newEndDate !== wEndDate) {
      setValue("end_date", newEndDate, { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wDuration]); // Only trigger on duration changes

  // Handlers to track which date field user is editing
  const handleStartDateChange = useCallback(() => {
    lastEditedDateField.current = "start_date";
  }, []);

  const handleEndDateChange = useCallback(() => {
    lastEditedDateField.current = "end_date";
  }, []);

  // Calculate End Date from Start Date + Duration (only when start date is being edited)
  // Also clears end_date if start_date is cleared
  useEffect(() => {
    if (lastEditedDateField.current === "start_date") {
      // If start_date is cleared, also clear end_date
      if (!wStartDate || wStartDate === "") {
        if (wEndDate && wEndDate !== "") {
          setValue("end_date", "", { shouldValidate: true });
        }
        return;
      }

      // Only calculate if start_date is VALID and duration is VALID
      if (isValidDate(wStartDate) && isValidSizeDuration(wDuration)) {
        const newEndDate = calculateEndDate(wStartDate, wDuration);
        if (newEndDate && newEndDate !== wEndDate) {
          setValue("end_date", newEndDate, { shouldValidate: true });
          // Re-trigger start_date validation to clear stale cross-field errors
          setTimeout(() => trigger("start_date"), 0);
        }
      }
    }
  }, [wStartDate, wDuration, wEndDate, setValue, trigger]);

  // Calculate Start Date from End Date - Duration (when end date is being edited)
  // Duration stays fixed, Start Date recalculates (symmetric with Start Date → End Date behavior)
  // Also clears start_date if end_date is cleared
  useEffect(() => {
    if (lastEditedDateField.current === "end_date") {
      // If end_date is cleared, clear start_date only (size/duration remain intact)
      if (!wEndDate || wEndDate === "") {
        if (wStartDate && wStartDate !== "") {
          setValue("start_date", "", { shouldValidate: true });
        }
        return;
      }

      // Only proceed if end_date is VALID and duration is VALID
      if (!isValidDate(wEndDate) || !isValidSizeDuration(wDuration)) return;

      // Calculate start_date from end_date - duration (keeping duration fixed)
      const newStartDate = calculateStartDate(wEndDate, wDuration);
      if (newStartDate && newStartDate !== wStartDate) {
        setValue("start_date", newStartDate, { shouldValidate: true });
        // Re-trigger end_date validation to clear stale cross-field errors
        setTimeout(() => trigger("end_date"), 0);
      }
    }
  }, [wEndDate, wStartDate, wDuration, setValue, trigger]);

  // Calculate Duration/Size from Start Date and End Date (only when both dates are set and no duration yet)
  useEffect(() => {
    // Only calculate if no duration/size exists yet
    const durationEmpty = !wDuration || Number.isNaN(wDuration);
    const sizeEmpty = !wSize || Number.isNaN(wSize);

    // Only calculate if BOTH dates are VALID
    if (
      (durationEmpty || sizeEmpty) &&
      isValidDate(wStartDate) &&
      isValidDate(wEndDate)
    ) {
      const calculatedDuration = calculateDuration(wStartDate, wEndDate);
      if (calculatedDuration && Number(calculatedDuration) > 0) {
        // Reset the date tracking ref BEFORE setting values to prevent race condition (Bug 2 fix)
        // This prevents subsequent date effects from running with stale tracking state
        lastEditedDateField.current = null;

        setValue("duration_months", Number(calculatedDuration), { shouldValidate: true });
        setValue("size", Number(calculatedDuration), { shouldValidate: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wStartDate, wEndDate, setValue]); // REMOVED wSize, wDuration to prevent "cannot clear" loop

  // --- Fetch Chit Data for Edit/View Modes ---
  useEffect(() => {
    const fetchChit = async () => {
      if (!id || mode === "create") {
        setPageLoading(false);
        return;
      }

      setPageLoading(true);
      try {
        const chit = await getChitById(id);
        const formData = normalizeChitForForm(chit);
        reset(formData);
        setOriginalData(chit);
      } catch (err) {
        setError(err.message);
      } finally {
        setPageLoading(false);
      }
    };

    fetchChit();
  }, [id, mode, reset]);

  // --- Clear Success Message After Timeout ---
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // --- Form Submission Handler ---
  const onSubmit = useCallback(
    async (data, { onSuccessCallback } = {}) => {
      setError(null);
      setSuccess(null);

      // --- Sanitization Step ---
      // Ensure notes start with a capital letter before sending to backend
      if (data.notes && typeof data.notes === "string" && data.notes.length > 0) {
        data.notes = data.notes.charAt(0).toUpperCase() + data.notes.slice(1);
      }

      try {
        if (mode === "create" && !createdChitId) {
          // --- Create New Chit ---
          const apiData = normalizeFormDataForApi(data);
          const newChit = await createChitMutation.mutateAsync(apiData);

          setCreatedChitId(newChit.id);
          setOriginalData(newChit);
          setSuccess("Chit details saved. You can now manage payouts.");

          if (onSuccessCallback) {
            onSuccessCallback(newChit);
          }
        } else if (mode === "create" && createdChitId) {
          // --- Update After Initial Creation ---
          const changes = getChangedFields(data, originalData);

          if (Object.keys(changes).length > 0) {
            const updatedChit = await updateChitMutation.mutateAsync({
              chitId: createdChitId,
              chitData: changes,
            });
            setOriginalData(updatedChit);
          }

          setSuccess("Chit details updated successfully!");

          if (onSuccessCallback) {
            onSuccessCallback(originalData);
          }
        } else if (mode === "edit") {
          // --- Edit Existing Chit ---
          const apiData = normalizeFormDataForApi(data);

          await updateChitMutation.mutateAsync({
            chitId: id,
            chitData: apiData,
          });

          setSuccess("Chit updated successfully!");

          if (onSuccessCallback) {
            onSuccessCallback({ ...originalData, ...data });
          }
        }
      } catch (err) {
        console.error("Submit Error:", err);
        let errorMessage = err.message;

        if (err.response?.data?.detail) {
          if (Array.isArray(err.response.data.detail)) {
            errorMessage = err.response.data.detail
              .map((e) => `${e.loc[1]}: ${e.msg}`)
              .join(", ");
          } else {
            errorMessage = err.response.data.detail;
          }
        }

        setError(errorMessage);
      }
    },
    [
      mode,
      id,
      createdChitId,
      originalData,
      createChitMutation,
      updateChitMutation,
    ]
  );

  // --- Loading State ---
  const isSubmitting =
    createChitMutation.isPending || updateChitMutation.isPending;

  return {
    // Form instance
    form,
    // Form helpers
    register: form.register,
    control: form.control,
    errors: form.formState.errors,
    isValid: form.formState.isValid,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    setFormError: form.setError,  // For inline field validation
    clearFormErrors: form.clearErrors,  // For clearing inline field errors
    reset,
    // State
    originalData,
    createdChitId,
    createdChitName,
    isPostCreation,
    pageLoading,
    isSubmitting,
    error,
    success,
    setError,
    setSuccess,
    // Derived
    TABS,
    watchedChitType,
    watchedName,
    hasActiveOperations,
    membersCount: originalData?.members_count ?? 0,
    // Handlers
    onSubmit,
    handleSizeChange,
    handleDurationChange,
    handleStartDateChange,
    handleEndDateChange,
  };
};

export default useChitForm;
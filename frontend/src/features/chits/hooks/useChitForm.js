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
  payout_premium_percent: 0,
  foreman_commission_percent: 0,
  duration_months: "",
  start_date: "",
  end_date: "",
  collection_day: "",
  payout_day: "",
  notes: "",
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

  // --- Memoized TABS ---
  const TABS = useMemo(() => {
    const base = ["details", "payouts", "members", "collections"];
    if (watchedChitType === "auction") {
      return ["details", "auctions", ...base.slice(1)];
    }
    return base;
  }, [watchedChitType]);

  // --- Auto-Calculation Effects ---

  // Track which field was last edited by user (for Size <-> Duration sync)
  const lastEditedField = useRef(null);

  // Handlers to track which field user is editing
  const handleSizeChange = useCallback(() => {
    lastEditedField.current = "size";
  }, []);

  const handleDurationChange = useCallback(() => {
    lastEditedField.current = "duration";
  }, []);

  // Sync Size <-> Duration based on which field was last edited
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
      } else if (Number(sizeVal) !== Number(durationVal)) {
        setValue("duration_months", Number(sizeVal), { shouldValidate: true });
      }
    } else if (lastEditedField.current === "duration") {
      // User is editing duration - sync to size
      if (durationEmpty) {
        if (!sizeEmpty) {
          setValue("size", "", { shouldValidate: true });
        }
      } else if (Number(durationVal) !== Number(sizeVal)) {
        setValue("size", Number(durationVal), { shouldValidate: true });
      }
    }
  }, [wSize, wDuration, setValue]);

  // Track which date field was last edited to prevent loops
  const lastEditedDateField = useRef(null);

  // Handlers to track which date field user is editing
  const handleStartDateChange = useCallback(() => {
    lastEditedDateField.current = "start_date";
  }, []);

  const handleEndDateChange = useCallback(() => {
    lastEditedDateField.current = "end_date";
  }, []);

  // Calculate End Date from Start Date + Duration (only when start date is being edited)
  useEffect(() => {
    if (
      lastEditedDateField.current === "start_date" &&
      wStartDate &&
      wStartDate.match(/^\d{4}-\d{2}$/) &&
      wDuration
    ) {
      const newEndDate = calculateEndDate(wStartDate, wDuration);
      if (newEndDate && newEndDate !== wEndDate) {
        setValue("end_date", newEndDate, { shouldValidate: true });
      }
    }
  }, [wStartDate, wDuration, wEndDate, setValue]);

  // Calculate Start Date from End Date - Duration (only when end date is being edited)
  useEffect(() => {
    if (
      lastEditedDateField.current === "end_date" &&
      wEndDate &&
      wEndDate.match(/^\d{4}-\d{2}$/) &&
      wDuration
    ) {
      const newStartDate = calculateStartDate(wEndDate, wDuration);
      if (newStartDate && newStartDate !== wStartDate) {
        setValue("start_date", newStartDate, { shouldValidate: true });
      }
    }
  }, [wEndDate, wDuration, wStartDate, setValue]);

  // Calculate Duration/Size from Start Date and End Date (only when both dates are set and no duration yet)
  useEffect(() => {
    // Only calculate if no duration/size exists yet
    const durationEmpty = !wDuration || Number.isNaN(wDuration);
    const sizeEmpty = !wSize || Number.isNaN(wSize);

    if (
      (durationEmpty || sizeEmpty) &&
      wStartDate &&
      wStartDate.match(/^\d{4}-\d{2}$/) &&
      wEndDate &&
      wEndDate.match(/^\d{4}-\d{2}$/)
    ) {
      const calculatedDuration = calculateDuration(wStartDate, wEndDate);
      if (calculatedDuration && Number(calculatedDuration) > 0) {
        setValue("duration_months", Number(calculatedDuration), { shouldValidate: true });
        setValue("size", Number(calculatedDuration), { shouldValidate: true });
      }
    }
  }, [wStartDate, wEndDate, wDuration, wSize, setValue]);

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
    // Handlers
    onSubmit,
    handleSizeChange,
    handleDurationChange,
    handleStartDateChange,
    handleEndDateChange,
  };
};

export default useChitForm;
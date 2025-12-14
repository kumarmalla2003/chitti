// frontend/src/features/chits/hooks/useChitForm.js

import { useState, useEffect, useMemo, useCallback } from "react";
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
import { calculateEndDate } from "../../../utils/calculations";

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

  // Sync Size <-> Duration
  useEffect(() => {
    if (wSize && Number(wSize) !== Number(wDuration)) {
      setValue("duration_months", Number(wSize), { shouldValidate: true });
    }
  }, [wSize, setValue]);

  useEffect(() => {
    if (wDuration && Number(wDuration) !== Number(wSize)) {
      setValue("size", Number(wDuration), { shouldValidate: true });
    }
  }, [wDuration, setValue]);

  // Calculate End Date from Start Date + Duration
  useEffect(() => {
    if (wStartDate && wStartDate.match(/^\d{4}-\d{2}$/) && wDuration) {
      const newEndDate = calculateEndDate(wStartDate, wDuration);
      if (newEndDate !== wEndDate) {
        setValue("end_date", newEndDate, { shouldValidate: true });
      }
    }
  }, [wStartDate, wDuration, setValue]);

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
    // Handlers
    onSubmit,
  };
};

export default useChitForm;

// frontend/src/features/payouts/hooks/usePayoutForm.js

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { payoutSchema } from "../schemas/payoutSchema";
import { useUpdatePayout } from "./usePayouts";
import {
  getPayoutById,
  getPayoutsByChitId,
} from "../../../services/payoutsService";
import { getChitById } from "../../../services/chitsService";
import { getAssignmentsForChit } from "../../../services/assignmentsService";

/**
 * Custom hook for managing payout form state and submission.
 *
 * @param {string|number} id - Payout ID for edit/view modes (null for create)
 * @param {string} mode - Form mode: 'create', 'edit', or 'view'
 * @param {string|null} defaultAssignmentId - Default assignment ID from URL params
 * @returns {Object} Form state and handlers
 */
export const usePayoutForm = (id, mode, defaultAssignmentId = null) => {
  // --- State ---
  const [payoutDetails, setPayoutDetails] = useState(null);
  const [pageLoading, setPageLoading] = useState(mode !== "create");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // --- React Query Mutations ---
  const updatePayoutMutation = useUpdatePayout();

  // --- React Hook Form ---
  const form = useForm({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      chit_id: "",
      member_id: "",
      chit_assignment_id: defaultAssignmentId || "",
      amount: "",
      paid_date: new Date().toISOString().split("T")[0],
      method: "Cash",
      notes: "",
    },
    mode: "onTouched",
  });

  const { reset, setValue, getValues, handleSubmit } = form;

  // --- Fetch Payout Data for Edit/View Modes ---
  useEffect(() => {
    const fetchPayout = async () => {
      if (!id || mode === "create") {
        setPageLoading(false);
        // Reset to defaults for create mode
        if (mode === "create") {
          reset({
            chit_id: "",
            member_id: "",
            chit_assignment_id: defaultAssignmentId || "",
            amount: "",
            paid_date: new Date().toISOString().split("T")[0],
            method: "Cash",
            notes: "",
          });
        }
        return;
      }

      setPageLoading(true);
      try {
        const payout = await getPayoutById(id);
        const formData = {
          chit_id: payout.chit_id ? String(payout.chit_id) : "",
          member_id: payout.member_id ? String(payout.member_id) : "",
          chit_assignment_id: payout.chit_assignment_id
            ? String(payout.chit_assignment_id)
            : "",
          amount: payout.amount ? Number(payout.amount) : "",
          paid_date: payout.paid_date || new Date().toISOString().split("T")[0],
          method: payout.method || "Cash",
          notes: payout.notes || "",
        };
        reset(formData);
        setPayoutDetails(payout);
      } catch (err) {
        setError(err.message);
      } finally {
        setPageLoading(false);
      }
    };

    fetchPayout();
  }, [id, mode, reset, defaultAssignmentId]);

  // --- Clear Success Message After Timeout ---
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // --- Form Submission Handler ---
  const onSubmit = useCallback(
    async (data, { navigate } = {}) => {
      setError(null);
      setSuccess(null);

      try {
        const dataToSend = {
          ...data,
          amount: Number(data.amount),
          chit_assignment_id: parseInt(data.chit_assignment_id),
          member_id: data.member_id ? parseInt(data.member_id) : null,
          chit_id: data.chit_id ? parseInt(data.chit_id) : null,
        };

        if (mode === "create") {
          if (!dataToSend.chit_id || !dataToSend.chit_assignment_id) {
            throw new Error("Please select a Chit and a Winning Month.");
          }

          // Fetch assignment to get the winning month date
          const assignmentsData = await getAssignmentsForChit(dataToSend.chit_id);
          const assignment = assignmentsData.assignments.find(
            (a) => a.id === dataToSend.chit_assignment_id
          );

          if (!assignment) {
            throw new Error("Selected assignment not found.");
          }

          // Fetch chit details to get start date
          const chit = await getChitById(dataToSend.chit_id);

          // Calculate month index (1-based)
          const startDate = new Date(chit.start_date);
          const assignDate = new Date(assignment.chit_month);
          const monthIndex =
            (assignDate.getFullYear() - startDate.getFullYear()) * 12 +
            (assignDate.getMonth() - startDate.getMonth()) +
            1;

          // Find the corresponding pre-created payout row
          const payoutsData = await getPayoutsByChitId(dataToSend.chit_id);
          const targetPayout = payoutsData.payouts.find(
            (p) => p.month === monthIndex
          );

          if (!targetPayout) {
            throw new Error(
              `No scheduled payout found for Month ${monthIndex}. Check chit duration.`
            );
          }

          // Update the existing schedule row
          await updatePayoutMutation.mutateAsync({
            payoutId: targetPayout.id,
            payoutData: dataToSend,
          });

          setSuccess("Payout recorded successfully!");

          if (navigate) {
            navigate(`/payouts/view/${targetPayout.id}`, {
              state: { success: "Payout recorded successfully!" },
            });
          }
        } else if (mode === "edit") {
          const updatedPayout = await updatePayoutMutation.mutateAsync({
            payoutId: id,
            payoutData: dataToSend,
          });

          reset(updatedPayout);
          setSuccess("Payout updated successfully!");
          setPayoutDetails(updatedPayout);
        }
      } catch (err) {
        console.error("Submit Error:", err);
        setError(err.message);
      }
    },
    [mode, id, updatePayoutMutation, reset]
  );

  // --- Loading State ---
  const isSubmitting = updatePayoutMutation.isPending;

  return {
    // Form instance
    form,
    // Form helpers
    register: form.register,
    control: form.control,
    errors: form.formState.errors,
    dirtyFields: form.formState.dirtyFields,
    handleSubmit,
    setValue,
    getValues,
    reset,
    // State
    payoutDetails,
    pageLoading,
    isSubmitting,
    error,
    success,
    setError,
    setSuccess,
    // Handlers
    onSubmit,
  };
};

export default usePayoutForm;

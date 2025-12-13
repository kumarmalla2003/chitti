// frontend/src/features/collections/hooks/useCollectionForm.js

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateCollection, useUpdateCollection } from "./useCollections";
import { getCollectionById } from "../../../services/collectionsService";

/**
 * Schema for collection form validation
 */
const collectionSchema = z.object({
  member_id: z.string().min(1, "Member is required"),
  chit_id: z.string().min(1, "Chit is required"),
  chit_assignment_id: z.string().min(1, "Assignment is required"),
  amount_paid: z.number({ invalid_type_error: "Amount must be a number" }).positive("Amount must be positive"),
  collection_date: z.string().min(1, "Collection Date is required"),
  collection_method: z.string().min(1, "Collection Method is required"),
  notes: z.string().optional(),
});

/**
 * Custom hook for managing collection form state and submission.
 *
 * @param {string|number} id - Collection ID for edit/view modes (null for create)
 * @param {string} mode - Form mode: 'create', 'edit', or 'view'
 * @param {string|null} defaultAssignmentId - Default assignment ID from URL params
 * @returns {Object} Form state and handlers
 */
export const useCollectionForm = (id, mode, defaultAssignmentId = null) => {
  // --- UI State ---
  const [collectionDetails, setCollectionDetails] = useState(null);
  const [pageLoading, setPageLoading] = useState(mode !== "create");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // --- React Query Mutations ---
  const createCollectionMutation = useCreateCollection();
  const updateCollectionMutation = useUpdateCollection();

  // --- React Hook Form ---
  const form = useForm({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      member_id: "",
      chit_id: "",
      chit_assignment_id: defaultAssignmentId || "",
      amount_paid: "",
      collection_date: new Date().toISOString().split("T")[0],
      collection_method: "Cash",
      notes: "",
    },
    mode: "onTouched",
  });

  const { reset, getValues, handleSubmit, setValue } = form;

  // --- Fetch Collection Data for Edit/View Modes ---
  useEffect(() => {
    const fetchCollection = async () => {
      if (!id || mode === "create") {
        setPageLoading(false);
        return;
      }

      setPageLoading(true);
      try {
        const collection = await getCollectionById(id);
        const formData = {
          member_id: collection.member_id ? String(collection.member_id) : "",
          chit_id: collection.chit_id ? String(collection.chit_id) : "",
          chit_assignment_id: collection.chit_assignment_id ? String(collection.chit_assignment_id) : "",
          amount_paid: collection.amount_paid ? Number(collection.amount_paid) : "",
          collection_date: collection.collection_date || new Date().toISOString().split("T")[0],
          collection_method: collection.collection_method || "Cash",
          notes: collection.notes || "",
        };
        reset(formData);
        setCollectionDetails(collection);
      } catch (err) {
        setError(err.message);
      } finally {
        setPageLoading(false);
      }
    };

    fetchCollection();
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
    async (data, { navigate } = {}) => {
      setError(null);
      setSuccess(null);

      try {
        const dataToSend = {
          ...data,
          amount_paid: parseFloat(String(data.amount_paid).replace(/,/g, "")),
          chit_assignment_id: parseInt(data.chit_assignment_id),
        };

        if (mode === "create") {
          const newCollection = await createCollectionMutation.mutateAsync(dataToSend);
          
          if (navigate) {
            navigate(`/collections/view/${newCollection.id}`, {
              state: { success: "Collection logged successfully!" },
            });
          }
        } else if (mode === "edit") {
          const updatedCollection = await updateCollectionMutation.mutateAsync({
            collectionId: id,
            collectionData: dataToSend,
          });
          setSuccess("Collection updated successfully!");
          setCollectionDetails(updatedCollection);
        }
      } catch (err) {
        console.error("Submit Error:", err);
        setError(err.message);
      }
    },
    [mode, id, createCollectionMutation, updateCollectionMutation]
  );

  // --- Loading State ---
  const isSubmitting =
    createCollectionMutation.isPending || updateCollectionMutation.isPending;

  return {
    // Form instance
    form,
    // Form helpers (for react-hook-form)
    register: form.register,
    control: form.control,
    errors: form.formState.errors,
    handleSubmit,
    setValue,
    getValues,
    reset,
    // Data
    collectionDetails,
    // UI state
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

export default useCollectionForm;

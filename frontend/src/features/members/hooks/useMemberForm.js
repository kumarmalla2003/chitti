// frontend/src/features/members/hooks/useMemberForm.js

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { memberSchema } from "../schemas/memberSchema";
import { useCreateMember, usePatchMember } from "./useMembers";
import { getMemberById } from "../../../services/membersService";

/**
 * Default form values for member creation
 */
const DEFAULT_VALUES = {
  full_name: "",
  phone_number: "",
};

/**
 * Custom hook for managing member form state and submission.
 *
 * @param {string|number} id - Member ID for edit/view modes (null for create)
 * @param {string} mode - Form mode: 'create', 'edit', or 'view'
 * @returns {Object} Form state and handlers
 */
export const useMemberForm = (id, mode) => {
  // --- State ---
  const [originalData, setOriginalData] = useState(null);
  const [createdMemberId, setCreatedMemberId] = useState(null);
  const [createdMemberName, setCreatedMemberName] = useState(null);
  const [pageLoading, setPageLoading] = useState(mode !== "create");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // --- React Query Mutations ---
  const createMemberMutation = useCreateMember();
  const patchMemberMutation = usePatchMember();

  // --- React Hook Form ---
  const form = useForm({
    resolver: zodResolver(memberSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onTouched",
  });

  const { reset, getValues, handleSubmit, trigger } = form;

  // --- Fetch Member Data for Edit/View Modes ---
  useEffect(() => {
    const fetchMember = async () => {
      if (!id || mode === "create") {
        setPageLoading(false);
        return;
      }

      setPageLoading(true);
      try {
        const member = await getMemberById(id);
        const formData = {
          full_name: member.full_name || "",
          phone_number: member.phone_number || "",
        };
        reset(formData);
        setOriginalData(member);
      } catch (err) {
        setError({ context: "page", message: err.message });
      } finally {
        setPageLoading(false);
      }
    };

    fetchMember();
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
        if (mode === "create" && !createdMemberId) {
          // --- Create New Member ---
          const newMember = await createMemberMutation.mutateAsync(data);

          setCreatedMemberId(newMember.id);
          setCreatedMemberName(newMember.full_name);
          setOriginalData(newMember);
          setSuccess("Member details saved. You can now assign them to a chit.");

          if (onSuccessCallback) {
            onSuccessCallback(newMember);
          }
        } else if (mode === "create" && createdMemberId) {
          // --- Update After Initial Creation ---
          const changes = {};
          for (const key in data) {
            if (data[key] !== originalData[key]) {
              changes[key] = data[key];
            }
          }

          if (Object.keys(changes).length > 0) {
            const updatedMember = await patchMemberMutation.mutateAsync({
              memberId: createdMemberId,
              memberData: changes,
            });
            setCreatedMemberName(updatedMember.full_name);
            setOriginalData(updatedMember);
            setSuccess("Member details updated.");
          }

          if (onSuccessCallback) {
            onSuccessCallback(originalData);
          }
        } else if (mode === "edit") {
          // --- Edit Existing Member ---
          const changes = {};
          for (const key in data) {
            if (data[key] !== originalData[key]) {
              changes[key] = data[key];
            }
          }

          if (Object.keys(changes).length > 0) {
            await patchMemberMutation.mutateAsync({
              memberId: id,
              memberData: changes,
            });
            setOriginalData({ ...originalData, ...data });
            setSuccess("Member details updated.");
          }

          if (onSuccessCallback) {
            onSuccessCallback({ ...originalData, ...data });
          }
        }
      } catch (err) {
        console.error("Submit Error:", err);
        setError({ context: "details", message: err.message });
      }
    },
    [mode, id, createdMemberId, originalData, createMemberMutation, patchMemberMutation]
  );

  // --- Loading State ---
  const isSubmitting = createMemberMutation.isPending || patchMemberMutation.isPending;

  // --- Derived State ---
  const isPostCreation = mode === "create" && createdMemberId !== null;

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
    reset,
    // State
    originalData,
    createdMemberId,
    createdMemberName,
    isPostCreation,
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

export default useMemberForm;

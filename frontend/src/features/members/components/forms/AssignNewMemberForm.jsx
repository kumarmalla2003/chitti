// frontend/src/features/members/components/forms/AssignNewMemberForm.jsx

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import MemberDetailsForm from "./MemberDetailsForm";
import Button from "../../../../components/ui/Button";
import Message from "../../../../components/ui/Message";
import { Save, Calendar, Check, Loader2 } from "lucide-react";
import { createMember } from "../../../../services/membersService";
import { memberSchema } from "../../schemas/memberSchema";

const AssignNewMemberForm = forwardRef(
  (
    {
      token,
      chitId,
      availableMonths,
      onAssignment,
      formatDate,
      onMemberNameChange,
      onBackToList,
    },
    ref
  ) => {
    // Stage 1: Member Creation Form
    const {
      register,
      handleSubmit,
      control,
      getValues,
      watch,
      formState: { errors },
    } = useForm({
      resolver: zodResolver(memberSchema),
      defaultValues: {
        full_name: "",
        phone_number: "",
      },
      mode: "onTouched"
    });

    // Watch name for header update
    const watchedName = watch("full_name");
    useEffect(() => {
      if (onMemberNameChange) {
        onMemberNameChange(watchedName || "");
      }
    }, [watchedName, onMemberNameChange]);

    const [createdMember, setCreatedMember] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState("");
    const [loading, setLoading] = useState(false);
    const [pageError, setPageError] = useState(null); // General errors
    const [memberCreatedSuccess, setMemberCreatedSuccess] = useState(null);

    useImperativeHandle(ref, () => ({
      goBack: () => {
        if (createdMember) {
          setCreatedMember(null);
          // Check if we need to reset name?
          // If we go back from Stage 2 to Stage 1, we might want to keep the name?
          // The prompt said: "if createdMember... setCreatedMember(null); onMemberNameChange('');".
          // If we reset createdMember, we show the form again.
          onMemberNameChange(getValues("full_name"));
        } else {
          onBackToList();
        }
      },
    }));

    useEffect(() => {
      if (memberCreatedSuccess) {
        const timer = setTimeout(() => {
          setMemberCreatedSuccess(null);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }, [memberCreatedSuccess]);

    // Focus handling handled by MemberDetailsForm logic or autoFocus

    const handleCreateMember = async (data) => {
      setLoading(true);
      setPageError(null);
      try {
        const newMember = await createMember(data, token);
        setCreatedMember(newMember);
        setMemberCreatedSuccess(
          `Member "${newMember.full_name}" created successfully!`
        );
      } catch (err) {
        setPageError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const handleConfirmAssignment = async (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (!selectedMonth) {
        setPageError("Please select a chit month to assign.");
        return;
      }

      await onAssignment({
        member_id: createdMember.id,
        chit_id: chitId,
        chit_month: selectedMonth,
      });
    };

    return (
      <div className="my-4">
        {pageError && (
          <Message type="error" onClose={() => setPageError(null)}>
            {pageError}
          </Message>
        )}

        {!createdMember ? (
          <form onSubmit={handleSubmit(handleCreateMember)}>
            <MemberDetailsForm
              mode="create"
              control={control}
              register={register}
              errors={errors}
            />
            <div className="flex justify-end gap-2 mt-6">
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Save className="mr-2" /> Save
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div>
            {memberCreatedSuccess && (
              <Message type="success">{memberCreatedSuccess}</Message>
            )}
            <h3 className="text-lg font-semibold text-text-primary mb-4 text-center">
              Assign Month for {createdMember.full_name}
            </h3>
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Calendar className="w-5 h-5 text-text-secondary" />
              </span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-center"
              >
                <option value="">Select an available month...</option>
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {formatDate(month)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                type="button"
                onClick={handleConfirmAssignment}
                variant="success"
                disabled={!selectedMonth}
                className="flex items-center justify-center"
              >
                <Check className="mr-2" /> Confirm Assignment
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default AssignNewMemberForm;

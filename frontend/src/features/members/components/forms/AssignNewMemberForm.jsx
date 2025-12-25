// frontend/src/features/members/components/forms/AssignNewMemberForm.jsx

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import MemberDetailsForm from "./MemberDetailsForm";
import Button from "../../../../components/ui/Button";
import Message from "../../../../components/ui/Message";
import { Save, Loader2 } from "lucide-react";
import { createMember } from "../../../../services/membersService";
import { memberSchema } from "../../schemas/memberSchema";

const AssignNewMemberForm = forwardRef(
  (
    {
      token,
      onMemberCreated,
      onMemberNameChange,
      onBackToList,
    },
    ref
  ) => {
    const {
      register,
      handleSubmit,
      control,
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

    const [loading, setLoading] = useState(false);
    const [pageError, setPageError] = useState(null);
    const [success, setSuccess] = useState(null);

    useImperativeHandle(ref, () => ({
      goBack: () => {
        onBackToList();
      },
    }));

    useEffect(() => {
      if (success) {
        const timer = setTimeout(() => {
          onBackToList();
        }, 1500);
        return () => clearTimeout(timer);
      }
    }, [success, onBackToList]);

    const handleCreateMember = async (data) => {
      setLoading(true);
      setPageError(null);
      try {
        const newMember = await createMember(data, token);
        setSuccess(`Member "${newMember.full_name}" created successfully!`);
        if (onMemberCreated) {
          onMemberCreated(newMember);
        }
      } catch (err) {
        setPageError(err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="my-4">
        {pageError && (
          <Message type="error" onClose={() => setPageError(null)}>
            {pageError}
          </Message>
        )}
        {success && (
          <Message type="success">{success}</Message>
        )}

        <MemberDetailsForm
          mode="create"
          control={control}
          register={register}
          errors={errors}
          onEnterKeyOnLastInput={handleSubmit(handleCreateMember)}
        />
        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            variant="success"
            onClick={handleSubmit(handleCreateMember)}
            disabled={loading || success}
            className="flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" /> Save
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }
);

export default AssignNewMemberForm;

// frontend/src/features/members/components/forms/AssignExistingMemberForm.jsx

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../../../../components/ui/Button";
import Message from "../../../../components/ui/Message";
import { User, Check, Loader2, Calendar } from "lucide-react";
import { getAllMembers } from "../../../../services/membersService";
import { assignmentSchema } from "../../../assignments/schemas/assignmentSchema";
import Skeleton from "../../../../components/ui/Skeleton";

const AssignExistingMemberForm = forwardRef(
  (
    {
      token,
      chitId,
      availableMonths,
      onAssignment,
      formatDate,
      assignedMemberIds,
      onMemberNameChange,
      onBackToList,
    },
    ref
  ) => {
    const [allMembers, setAllMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState(null);
    const [submitError, setSubmitError] = useState(null);

    const {
      register,
      handleSubmit,
      formState: { errors, isValid, isSubmitting },
    } = useForm({
      resolver: zodResolver(assignmentSchema),
      defaultValues: {
        chit_id: String(chitId),
        member_id: "",
        chit_month: "",
      },
      mode: "onTouched",
    });

    useImperativeHandle(ref, () => ({
      goBack: () => {
        onMemberNameChange("");
        onBackToList();
      },
    }));

    useEffect(() => {
      const fetchAllMembers = async () => {
        setLoading(true);
        setPageError(null);
        try {
          const data = await getAllMembers(token);
          setAllMembers(data.members);
        } catch (err) {
          setPageError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchAllMembers();
    }, [token]);

    const onSubmit = async (data) => {
      setSubmitError(null);
      try {
        await onAssignment({
          member_id: data.member_id,
          chit_id: data.chit_id,
          chit_month: data.chit_month,
        });
      } catch (err) {
        setSubmitError(err.message);
      }
    };

    return (
      <form className="my-4" onSubmit={handleSubmit(onSubmit)}>
        {(pageError || submitError || Object.keys(errors).length > 0) && (
          <div className="mb-4">
            {pageError && <Message type="error" onClose={() => setPageError(null)}>{pageError}</Message>}
            {submitError && <Message type="error" onClose={() => setSubmitError(null)}>{submitError}</Message>}
            {errors.member_id && <Message type="error">{errors.member_id.message}</Message>}
            {errors.chit_month && <Message type="error">{errors.chit_month.message}</Message>}
          </div>
        )}

        {loading && (
          <div className="space-y-6 p-4">
            <div className="space-y-1">
                 <Skeleton.Text width="w-32" />
                 <Skeleton.Input />
            </div>
             <div className="space-y-1">
                 <Skeleton.Text width="w-32" />
                 <Skeleton.Input />
            </div>
          </div>
        )}

        {!loading && (
          <div className="space-y-6">
            {/* Member Dropdown */}
            <div>
              <label
                htmlFor="member_id"
                className="block text-lg font-medium text-text-secondary mb-1"
              >
                Select Member
              </label>
              <div className="relative flex items-center">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="w-5 h-5 text-text-secondary" />
                </span>
                <div className="absolute left-10 h-6 w-px bg-border"></div>
                <select
                  {...register("member_id")}
                  id="member_id"
                  className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent ${errors.member_id ? "border-red-500" : "border-border"}`}
                >
                  <option value="">
                    {allMembers.length > 0
                      ? "Select a member..."
                      : "No members found"}
                  </option>
                  {allMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Month Dropdown */}
            <div>
              <label
                htmlFor="chit_month"
                className="block text-lg font-medium text-text-secondary mb-1"
              >
                Select Month
              </label>
              <div className="relative flex items-center">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="w-5 h-5 text-text-secondary" />
                </span>
                <div className="absolute left-10 h-6 w-px bg-border"></div>
                <select
                  {...register("chit_month")}
                  id="chit_month"
                  className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-center ${errors.chit_month ? "border-red-500" : "border-border"}`}
                >
                  <option value="">
                    {availableMonths.length > 0
                      ? "Select an available month..."
                      : "No available months for this chit"}
                  </option>
                  {availableMonths.map((month) => (
                    <option key={month} value={month}>
                      {formatDate(month)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <Button
                type="submit"
                variant="success"
                disabled={!isValid || isSubmitting}
                className="w-full flex items-center justify-center"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <>
                    <Check className="mr-2 w-5 h-5" />
                    Confirm Assignment
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </form>
    );
  }
);

export default AssignExistingMemberForm;

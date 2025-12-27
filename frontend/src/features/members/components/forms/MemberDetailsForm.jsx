// frontend/src/features/members/components/forms/MemberDetailsForm.jsx

import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import Message from "../../../../components/ui/Message";
import Button from "../../../../components/ui/Button";
import { User, Phone, Loader2, Plus, SquarePen } from "lucide-react";
import FormattedInput from "../../../../components/ui/FormattedInput";

const MemberDetailsForm = ({
  mode,
  control,
  register,
  errors,
  success,
  isPostCreation = false,
  isSubmitting = false,
  onEnterKeyOnLastInput,
  onCancel,
}) => {
  const nameInputRef = useRef(null);
  const isFormDisabled = mode === "view";
  const isEditMode = mode === "edit";

  useEffect(() => {
    if (mode === "create" && !isPostCreation) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [mode, isPostCreation]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isFormDisabled) {
      const inputName = e.target.name;
      if (inputName === "full_name") {
        // Move focus to phone number field instead of submitting
        e.preventDefault();
        const phoneInput = document.getElementById("phone_number");
        if (phoneInput) phoneInput.focus();
      } else if (inputName === "phone_number") {
        // Only submit on Enter from the last field
        if (onEnterKeyOnLastInput) {
          e.preventDefault();
          onEnterKeyOnLastInput();
        }
      }
    }
  };

  return (
    <>
      {success && <Message type="success">{success}</Message>}
      {errors.root && (
        <Message type="error" onClose={() => { }}>
          {errors.root.message}
        </Message>
      )}
      <fieldset
        disabled={isFormDisabled}
        className="space-y-6"
        onKeyDown={handleKeyDown}
      >
        <div>
          <label
            htmlFor="full_name"
            className="block text-lg font-medium text-text-secondary mb-1"
          >
            Full Name
          </label>
          <div className="relative flex items-center">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <User className="w-5 h-5 text-text-secondary" />
            </span>
            <div className="absolute left-10 h-6 w-px bg-border"></div>
            <input
              {...register("full_name")}
              ref={(e) => {
                register("full_name").ref(e);
                nameInputRef.current = e;
              }}
              type="text"
              id="full_name"
              className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${errors.full_name ? "border-red-500" : "border-border"
                }`}
              required
              disabled={isFormDisabled}
              autoComplete="off"
              autoCorrect="off"
            />
          </div>
          {errors.full_name && (
            <p className="mt-1 text-sm text-red-500">
              {errors.full_name.message}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="phone_number"
            className="block text-lg font-medium text-text-secondary mb-1"
          >
            Phone Number
          </label>
          <div className="relative flex items-center">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Phone className="w-5 h-5 text-text-secondary" />
            </span>
            <div className="absolute left-10 h-6 w-px bg-border"></div>
            <FormattedInput
              name="phone_number"
              control={control}
              format={(val) => val}
              parse={(val) => val.replace(/\D/g, "").slice(0, 10)}
              type="tel"
              id="phone_number"
              className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${errors.phone_number ? "border-red-500" : "border-border"
                }`}
              required
              disabled={isFormDisabled}
              placeholder="e.g. 9876543210"
              autoComplete="off"
              autoCorrect="off"
            />
          </div>
          {errors.phone_number && (
            <p className="mt-1 text-sm text-red-500">
              {errors.phone_number.message}
            </p>
          )}
        </div>

        {/* Action Buttons - only show in create/edit mode */}
        {!isFormDisabled && (
          <div className="flex justify-end gap-3 pt-4">
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            )}
            <Button
              type="submit"
              variant={mode === "create" && !isPostCreation ? "success" : "warning"}
              disabled={isSubmitting}
              className="w-full md:w-auto"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin mx-auto w-5 h-5" />
              ) : (
                <>
                  {mode === "create" && !isPostCreation ? (
                    <><Plus className="inline-block w-5 h-5" />Create Member</>
                  ) : (
                    <><SquarePen className="inline-block w-5 h-5" />Update Member</>
                  )}
                </>
              )}
            </Button>
          </div>
        )}
      </fieldset>
    </>
  );
};

MemberDetailsForm.propTypes = {
  mode: PropTypes.string.isRequired,
  control: PropTypes.object.isRequired,
  register: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
  success: PropTypes.string,
  isPostCreation: PropTypes.bool,
  isSubmitting: PropTypes.bool,
  onEnterKeyOnLastInput: PropTypes.func,
  onCancel: PropTypes.func,
};

export default MemberDetailsForm;

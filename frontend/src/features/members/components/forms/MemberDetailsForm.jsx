// frontend/src/features/members/components/forms/MemberDetailsForm.jsx

import { useRef, useEffect } from "react";
import Message from "../../../../components/ui/Message";
import { User, Phone } from "lucide-react";
import useCursorTracking from "../../../../hooks/useCursorTracking"; // <--- Import the hook

const MemberDetailsForm = ({
  mode,
  formData,
  onFormChange,
  error,
  success,
  isPostCreation = false,
}) => {
  const nameInputRef = useRef(null);
  const phoneInputRef = useRef(null); // <--- Add ref for phone input

  // Initialize tracking hook for phone number
  const trackPhoneCursor = useCursorTracking(
    phoneInputRef,
    formData.phone_number,
    /\d/ // Track digits
  );

  useEffect(() => {
    if (mode === "create" && !isPostCreation) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [mode, isPostCreation]);

  const isFormDisabled = mode === "view";

  const handlePhoneChange = (e) => {
    trackPhoneCursor(e); // <--- 1. Track cursor before update
    onFormChange(e); // <--- 2. Trigger parent update (which sanitizes)
  };

  return (
    <>
      {success && <Message type="success">{success}</Message>}
      {error && (
        <Message type="error" onClose={() => { }}>
          {error}
        </Message>
      )}
      <fieldset disabled={isFormDisabled} className="space-y-6">
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
              ref={nameInputRef}
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={onFormChange}
              className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
              required
            />
          </div>
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
            <input
              ref={phoneInputRef} // <--- Attach ref
              type="tel"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handlePhoneChange} // <--- Use wrapper handler
              className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
              required
              maxLength="10"
            />
          </div>
        </div>
      </fieldset>
    </>
  );
};

export default MemberDetailsForm;

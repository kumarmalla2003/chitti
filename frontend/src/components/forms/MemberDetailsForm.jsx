// frontend/src/components/forms/MemberDetailsForm.jsx

import { useRef, useEffect } from "react";
import Message from "../ui/Message";
import { FiUser, FiPhone } from "react-icons/fi";

const MemberDetailsForm = ({
  mode,
  formData,
  onFormChange,
  onFormSubmit,
  error,
  success,
}) => {
  const nameInputRef = useRef(null);

  useEffect(() => {
    // Only auto-focus on the 'create' screen
    if (mode === "create") {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [mode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onFormSubmit(formData);
  };

  const isFormDisabled = mode === "view";

  return (
    <form id="member-details-form" onSubmit={handleSubmit}>
      {success && <Message type="success">{success}</Message>}
      {error && (
        <Message type="error" onClose={() => {}}>
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
              <FiUser className="w-5 h-5 text-text-secondary" />
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
              <FiPhone className="w-5 h-5 text-text-secondary" />
            </span>
            <div className="absolute left-10 h-6 w-px bg-border"></div>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={onFormChange}
              className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
              required
              maxLength="10"
            />
          </div>
        </div>
      </fieldset>
    </form>
  );
};

export default MemberDetailsForm;

// frontend/src/components/forms/MemberDetailsForm.jsx

import { useRef, useEffect, useState } from "react";
import Button from "../ui/Button";
import Message from "../ui/Message";
import { FiLoader, FiUser, FiPhone, FiPlus, FiEdit } from "react-icons/fi";

const MemberDetailsForm = ({
  mode,
  initialData,
  onFormSubmit,
  loading,
  error,
  success,
}) => {
  const [formData, setFormData] = useState(initialData);
  const nameInputRef = useRef(null);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  useEffect(() => {
    if (mode === "create" || mode === "edit") {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === "phone_number") {
      processedValue = value.replace(/\D/g, "").slice(0, 10);
    }
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFormSubmit(formData);
  };

  const isFormDisabled = mode === "view";

  return (
    <form onSubmit={handleSubmit}>
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
              onChange={handleChange}
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
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
              required
              maxLength="10"
            />
          </div>
        </div>
      </fieldset>
      {!isFormDisabled && (
        <Button
          type="submit"
          className="w-full mt-8"
          variant={mode === "create" ? "success" : "warning"}
          disabled={loading}
        >
          {loading ? (
            <FiLoader className="animate-spin mx-auto" />
          ) : mode === "create" ? (
            <>
              <FiPlus className="inline mr-2" />
              Create Member
            </>
          ) : (
            <>
              <FiEdit className="inline mr-2" />
              Update Member
            </>
          )}
        </Button>
      )}
    </form>
  );
};

export default MemberDetailsForm;

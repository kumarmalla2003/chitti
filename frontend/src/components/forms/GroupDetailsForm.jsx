// frontend/src/components/forms/GroupDetailsForm.jsx

import { useRef, useEffect } from "react";
import Message from "../ui/Message";
import CustomMonthInput from "../ui/CustomMonthInput";
import { RupeeIcon } from "../ui/Icons";
import { FiTag, FiUsers, FiClock } from "react-icons/fi";

const GroupDetailsForm = ({
  mode,
  formData,
  onFormChange,
  onFormSubmit,
  error,
  success,
}) => {
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (mode === "create" || mode === "edit") {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [mode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onFormSubmit(formData);
  };

  const isFormDisabled = mode === "view";

  return (
    <form onSubmit={handleSubmit} id="group-details-form">
      {success && (
        <Message type="success" title="Success">
          {success}
        </Message>
      )}
      {error && (
        <Message type="error" title="Error" onClose={() => {}}>
          {error}
        </Message>
      )}
      <fieldset disabled={isFormDisabled} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-lg font-medium text-text-secondary mb-1"
          >
            Group Name
          </label>
          <div className="relative flex items-center">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FiTag className="w-5 h-5 text-text-secondary" />
            </span>
            <div className="absolute left-10 h-6 w-px bg-border"></div>
            <input
              ref={nameInputRef}
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={onFormChange}
              className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
              maxLength={50}
              placeholder="Kasi Malla Family Chit"
              required
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="chit_value"
              className="block text-lg font-medium text-text-secondary mb-1"
            >
              Chit Value
            </label>
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <RupeeIcon className="w-5 h-5 text-text-secondary" />
              </span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <input
                type="text"
                id="chit_value"
                name="chit_value"
                value={
                  formData.chit_value
                    ? parseInt(formData.chit_value).toLocaleString("en-IN")
                    : ""
                }
                onChange={onFormChange}
                className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
                placeholder="1,00,000"
                required
                inputMode="numeric"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="group_size"
              className="block text-lg font-medium text-text-secondary mb-1"
            >
              Group Size
            </label>
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <FiUsers className="w-5 h-5 text-text-secondary" />
              </span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <input
                type="number"
                id="group_size"
                name="group_size"
                value={formData.group_size}
                onChange={onFormChange}
                className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
                min="1"
                placeholder="20"
                required
              />
            </div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="monthly_installment"
              className="block text-lg font-medium text-text-secondary mb-1"
            >
              Monthly Installment
            </label>
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <RupeeIcon className="w-5 h-5 text-text-secondary" />
              </span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <input
                type="text"
                id="monthly_installment"
                name="monthly_installment"
                value={
                  formData.monthly_installment
                    ? parseInt(formData.monthly_installment).toLocaleString(
                        "en-IN"
                      )
                    : ""
                }
                onChange={onFormChange}
                className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
                placeholder="5,000"
                required
                inputMode="numeric"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="duration_months"
              className="block text-lg font-medium text-text-secondary mb-1"
            >
              Duration (months)
            </label>
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <FiClock className="w-5 h-5 text-text-secondary" />
              </span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <input
                type="number"
                id="duration_months"
                name="duration_months"
                value={formData.duration_months}
                onChange={onFormChange}
                className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
                min="1"
                placeholder="20"
                required
              />
            </div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="start_date"
              className="block text-lg font-medium text-text-secondary mb-1"
            >
              Start Date
            </label>
            <CustomMonthInput
              name="start_date"
              value={formData.start_date}
              onChange={onFormChange}
              required
              disabled={isFormDisabled}
            />
          </div>
          <div>
            <label
              htmlFor="end_date"
              className="block text-lg font-medium text-text-secondary mb-1"
            >
              End Date
            </label>
            <CustomMonthInput
              name="end_date"
              value={formData.end_date}
              onChange={onFormChange}
              disabled={isFormDisabled}
            />
          </div>
        </div>
      </fieldset>
    </form>
  );
};

export default GroupDetailsForm;

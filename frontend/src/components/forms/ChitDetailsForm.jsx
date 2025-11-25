// frontend/src/components/forms/ChitDetailsForm.jsx

import { useRef, useEffect } from "react";
import Message from "../ui/Message";
import CustomMonthInput from "../ui/CustomMonthInput";
import { RupeeIcon } from "../ui/Icons";
import useCursorTracking from "../../hooks/useCursorTracking"; // <--- Import Hook
import {
  FiTag,
  FiUsers,
  FiClock,
  FiArrowDownLeft,
  FiArrowUpRight,
} from "react-icons/fi";

const ChitDetailsForm = ({
  mode,
  formData,
  onFormChange,
  onFormSubmit,
  error,
  success,
  isPostCreation = false,
  onEnterKeyOnLastInput,
}) => {
  const nameInputRef = useRef(null);
  const valueInputRef = useRef(null); // <--- Ref for Chit Value
  const installmentInputRef = useRef(null); // <--- Ref for Installment

  // Helper to safely format value for display
  const getFormattedValue = (val) => {
    if (!val) return "";
    // Ensure we format only valid numbers
    const num = parseInt(val.toString().replace(/,/g, ""));
    return isNaN(num) ? "" : num.toLocaleString("en-IN");
  };

  const formattedChitValue = getFormattedValue(formData.chit_value);
  const formattedInstallment = getFormattedValue(formData.monthly_installment);

  // Setup trackers
  const trackValueCursor = useCursorTracking(
    valueInputRef,
    formattedChitValue,
    /\d/
  );
  const trackInstallmentCursor = useCursorTracking(
    installmentInputRef,
    formattedInstallment,
    /\d/
  );

  useEffect(() => {
    if (mode === "create" && !isPostCreation) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [mode, isPostCreation]);

  const isFormDisabled = mode === "view";

  const handleKeyDown = (e) => {
    // ... (Keep existing keydown logic unchanged)
    if (e.key === "Enter" && !isFormDisabled) {
      const inputName = e.target.name || e.target.getAttribute("name");
      if (inputName === "payout_day") {
        if (onEnterKeyOnLastInput) {
          e.preventDefault();
          e.stopPropagation();
          onEnterKeyOnLastInput();
        }
      } else {
        const form = e.target.closest("fieldset");
        if (form) {
          const focusable = Array.from(
            form.querySelectorAll(
              'input:not([disabled]):not([type="hidden"]), select, textarea, button'
            )
          );
          const index = focusable.indexOf(e.target);
          if (index !== -1 && index + 1 < focusable.length) {
            const nextElement = focusable[index + 1];
            if (!nextElement.closest(".relative.flex.items-center")) {
              e.preventDefault();
              nextElement.focus();
            }
          }
        }
      }
    }
  };

  return (
    <>
      {success && (
        <Message type="success" title="Success">
          {success}
        </Message>
      )}
      {error && (
        <Message type="error" title="Error" onClose={() => {}}>
          {typeof error === "string"
            ? error
            : error.message || "An error occurred."}
        </Message>
      )}
      <fieldset
        disabled={isFormDisabled}
        className="space-y-6"
        onKeyDown={handleKeyDown}
      >
        {/* Name Input (Unchanged) */}
        <div>
          <label
            htmlFor="name"
            className="block text-lg font-medium text-text-secondary mb-1"
          >
            Chit Name{" "}
            {mode === "edit" && (
              <span className="text-xs text-text-secondary">
                (Cannot be changed)
              </span>
            )}
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
              disabled={isFormDisabled || mode === "edit"}
            />
          </div>
        </div>

        {/* Chit Value & Size */}
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
                ref={valueInputRef} // <--- Attach Ref
                type="text"
                id="chit_value"
                name="chit_value"
                // Use calculated formatted value
                value={formattedChitValue}
                onChange={(e) => {
                  trackValueCursor(e); // <--- Track
                  onFormChange(e);
                }}
                className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
                placeholder="1,00,000"
                required
                inputMode="numeric"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="size"
              className="block text-lg font-medium text-text-secondary mb-1"
            >
              Size
            </label>
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <FiUsers className="w-5 h-5 text-text-secondary" />
              </span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <input
                type="number"
                id="size"
                name="size"
                value={formData.size}
                onChange={onFormChange}
                className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
                min="1"
                placeholder="20"
                required
              />
            </div>
          </div>
        </div>

        {/* Installment & Duration */}
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
                ref={installmentInputRef} // <--- Attach Ref
                type="text"
                id="monthly_installment"
                name="monthly_installment"
                value={formattedInstallment}
                onChange={(e) => {
                  trackInstallmentCursor(e); // <--- Track
                  onFormChange(e);
                }}
                className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
                placeholder="5,000"
                required
                inputMode="numeric"
              />
            </div>
          </div>
          <div>
            {/* Duration (Unchanged) */}
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

        {/* Dates and Days (Unchanged components, but kept for context) */}
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
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="collection_day"
              className="block text-lg font-medium text-text-secondary mb-1"
            >
              Collection Day
            </label>
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <FiArrowDownLeft className="w-5 h-5 text-text-secondary" />
              </span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <input
                type="number"
                id="collection_day"
                name="collection_day"
                value={formData.collection_day}
                onChange={onFormChange}
                className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
                min="1"
                max="28"
                placeholder="5"
                required
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="payout_day"
              className="block text-lg font-medium text-text-secondary mb-1"
            >
              Payout Day
            </label>
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <FiArrowUpRight className="w-5 h-5 text-text-secondary" />
              </span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <input
                type="number"
                id="payout_day"
                name="payout_day"
                value={formData.payout_day}
                onChange={onFormChange}
                className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
                min="1"
                max="28"
                placeholder="10"
                required
              />
            </div>
          </div>
        </div>
      </fieldset>
    </>
  );
};

export default ChitDetailsForm;

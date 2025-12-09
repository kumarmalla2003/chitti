// frontend/src/features/chits/components/forms/ChitDetailsForm.jsx

import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Controller } from "react-hook-form";
import Message from "../../../../components/ui/Message";
import CustomMonthInput from "../../../../components/ui/CustomMonthInput";
import FormattedInput from "../../../../components/ui/FormattedInput";
import {
  Layers,
  Users,
  Clock,
  WalletMinimal,
  TrendingUp,
  IndianRupee,
} from "lucide-react";

/**
 * Helper to format numbers with commas (Indian Locale)
 */
const formatNumber = (value) => {
  if (value === undefined || value === null || value === "") return "";
  return Number(value).toLocaleString("en-IN");
};

/**
 * Helper to parse formatted string back to number
 */
const parseNumber = (value) => {
  // value is the string from input (e.g. "1,000")
  const rawValue = value.replace(/[^0-9]/g, "");
  return rawValue ? Number(rawValue) : "";
};

const ChitDetailsForm = ({
  mode,
  control,
  register,
  errors,
  success,
  isPostCreation = false,
  onEnterKeyOnLastInput,
}) => {
  const nameInputRef = useRef(null);
  const isFormDisabled = mode === "view";
  const isEditMode = mode === "edit";

  // Auto-focus name field on create
  useEffect(() => {
    if (mode === "create" && !isPostCreation) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [mode, isPostCreation]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isFormDisabled) {
      const inputName = e.target.name;
      if (inputName === "payout_day") {
        if (onEnterKeyOnLastInput) {
          e.preventDefault();
          onEnterKeyOnLastInput();
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
      {errors.root && (
        <Message type="error" title="Error" onClose={() => { }}>
          {errors.root.message}
        </Message>
      )}

      <fieldset
        disabled={isFormDisabled}
        className="space-y-6"
        onKeyDown={handleKeyDown}
      >
        {/* --- NAME --- */}
        <div>
          <label
            htmlFor="name"
            className="block text-lg font-medium text-text-secondary mb-1"
          >
            Chit Name{" "}
            {isEditMode && (
              <span className="text-xs text-text-secondary">
                (Cannot be changed)
              </span>
            )}
          </label>
          <div className="relative flex items-center">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Layers className="w-5 h-5 text-text-secondary" />
            </span>
            <div className="absolute left-10 h-6 w-px bg-border"></div>
            <input
              {...register("name")}
              ref={(e) => {
                register("name").ref(e);
                nameInputRef.current = e;
              }}
              type="text"
              id="name"
              className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${errors.name ? "border-red-500" : "border-border"
                }`}
              maxLength={50}
              placeholder="e.g. Kasi Malla Family Chit"
              disabled={isFormDisabled || isEditMode}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* --- CHIT VALUE & SIZE --- */}
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Chit Value (Formatted) */}
          <div>
            <label
              htmlFor="chit_value"
              className="block text-lg font-medium text-text-secondary mb-1"
            >
              Chit Value
            </label>
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <IndianRupee className="w-5 h-5 text-text-secondary" />
              </span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <FormattedInput
                name="chit_value"
                control={control}
                format={formatNumber}
                parse={parseNumber}
                id="chit_value"
                className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${errors.chit_value ? "border-red-500" : "border-border"
                  }`}
                placeholder="1,00,000"
                disabled={isFormDisabled}
              />
            </div>
            {errors.chit_value && (
              <p className="mt-1 text-sm text-red-500">
                {errors.chit_value.message}
              </p>
            )}
          </div>

          {/* Size */}
          <div>
            <label
              htmlFor="size"
              className="block text-lg font-medium text-text-secondary mb-1"
            >
              Size
            </label>
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Users className="w-5 h-5 text-text-secondary" />
              </span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <input
                {...register("size", { valueAsNumber: true })}
                type="number"
                id="size"
                className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${errors.size ? "border-red-500" : "border-border"
                  }`}
                min="1"
                placeholder="20"
                disabled={isFormDisabled}
              />
            </div>
            {errors.size && (
              <p className="mt-1 text-sm text-red-500">{errors.size.message}</p>
            )}
          </div>
        </div>

        {/* --- INSTALLMENT & DURATION --- */}
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Monthly Installment (Formatted) */}
          <div>
            <label
              htmlFor="monthly_installment"
              className="block text-lg font-medium text-text-secondary mb-1"
            >
              Monthly Installment
            </label>
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <IndianRupee className="w-5 h-5 text-text-secondary" />
              </span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <FormattedInput
                name="monthly_installment"
                control={control}
                format={formatNumber}
                parse={parseNumber}
                id="monthly_installment"
                className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${errors.monthly_installment ? "border-red-500" : "border-border"
                  }`}
                placeholder="5,000"
                disabled={isFormDisabled}
              />
            </div>
            {errors.monthly_installment && (
              <p className="mt-1 text-sm text-red-500">
                {errors.monthly_installment.message}
              </p>
            )}
          </div>

          {/* Duration */}
          <div>
            <label
              htmlFor="duration_months"
              className="block text-lg font-medium text-text-secondary mb-1"
            >
              Duration (months)
            </label>
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Clock className="w-5 h-5 text-text-secondary" />
              </span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <input
                {...register("duration_months", { valueAsNumber: true })}
                type="number"
                id="duration_months"
                className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${errors.duration_months ? "border-red-500" : "border-border"
                  }`}
                min="1"
                placeholder="20"
                disabled={isFormDisabled}
              />
            </div>
            {errors.duration_months && (
              <p className="mt-1 text-sm text-red-500">
                {errors.duration_months.message}
              </p>
            )}
          </div>
        </div>

        {/* --- DATES --- */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="start_date"
              className="block text-lg font-medium text-text-secondary mb-1"
            >
              Start Date
            </label>
            <Controller
              control={control}
              name="start_date"
              render={({ field }) => (
                <CustomMonthInput
                  {...field}
                  disabled={isFormDisabled}
                  className={errors.start_date ? "border-red-500" : ""}
                />
              )}
            />
            {errors.start_date && (
              <p className="mt-1 text-sm text-red-500">
                {errors.start_date.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="end_date"
              className="block text-lg font-medium text-text-secondary mb-1"
            >
              End Date
            </label>
            <Controller
              control={control}
              name="end_date"
              render={({ field }) => (
                <CustomMonthInput
                  {...field}
                  disabled={isFormDisabled} // Logic for disabling end date if calculated automatically?
                  className={errors.end_date ? "border-red-500" : ""}
                />
              )}
            />
            {/* End date is usually read-only/calculated, but we allow edits if needed or keep enabled */}
          </div>
        </div>

        {/* --- DAYS --- */}
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
                <WalletMinimal className="w-5 h-5 text-text-secondary" />
              </span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <input
                {...register("collection_day", { valueAsNumber: true })}
                type="number"
                id="collection_day"
                className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${errors.collection_day ? "border-red-500" : "border-border"
                  }`}
                min="1"
                max="28"
                placeholder="5"
                disabled={isFormDisabled}
              />
            </div>
            {errors.collection_day && (
              <p className="mt-1 text-sm text-red-500">
                {errors.collection_day.message}
              </p>
            )}
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
                <TrendingUp className="w-5 h-5 text-text-secondary" />
              </span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <input
                {...register("payout_day", { valueAsNumber: true })}
                type="number"
                id="payout_day"
                className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${errors.payout_day ? "border-red-500" : "border-border"
                  }`}
                min="1"
                max="28"
                placeholder="10"
                disabled={isFormDisabled}
              />
            </div>
            {errors.payout_day && (
              <p className="mt-1 text-sm text-red-500">
                {errors.payout_day.message}
              </p>
            )}
          </div>
        </div>
      </fieldset>
    </>
  );
};

ChitDetailsForm.propTypes = {
  mode: PropTypes.string.isRequired,
  control: PropTypes.object.isRequired,
  register: PropTypes.func.isRequired,
  errors: PropTypes.object,
  success: PropTypes.string,
  isPostCreation: PropTypes.bool,
  onEnterKeyOnLastInput: PropTypes.func,
};

export default ChitDetailsForm;

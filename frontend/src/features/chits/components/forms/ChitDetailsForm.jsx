// frontend/src/features/chits/components/forms/ChitDetailsForm.jsx

import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Controller, useWatch } from "react-hook-form";
import Message from "../../../../components/ui/Message";
import CustomMonthInput from "../../../../components/ui/CustomMonthInput";
import FormattedInput from "../../../../components/ui/FormattedInput";
import SegmentedControl from "../../../../components/ui/SegmentedControl";
import {
  Layers,
  Users,
  Clock,
  WalletMinimal,
  TrendingUp,
  Lock,
  Shuffle,
  Gavel,
  Wallet,
  PieChart,
  Percent,
  FileText,
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
  if (!value) return "";
  // strict replacement of non-digits
  const rawValue = value.toString().replace(/\D/g, "");
  return rawValue ? Number(rawValue) : "";
};

// Chit Type Options for Segmented Control
const CHIT_TYPE_OPTIONS = [
  { value: "fixed", label: "Fixed", icon: Lock, description: "Members pay a fixed monthly installment amount." },
  { value: "variable", label: "Variable", icon: Shuffle, description: "Monthly installment decreases based on dividends." },
  { value: "auction", label: "Auction", icon: Gavel, description: "Monthly installment is determined by bidding." },
];

const ChitDetailsForm = ({
  mode,
  control,
  register,
  errors,
  success,
  isPostCreation = false,
  setValue,
  onEnterKeyOnLastInput,
  onNameBlur,
  onSizeChange,
  onDurationChange,
  onStartDateChange,
  onEndDateChange,
}) => {
  const nameInputRef = useRef(null);
  const isFormDisabled = mode === "view";
  const isEditMode = mode === "edit";

  // State to track if chit type field is focused
  const [isChitTypeFocused, setIsChitTypeFocused] = useState(false);

  // State for notes scroll shadows
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  // Watch fields
  const watchedChitType = useWatch({ control, name: "chit_type" }) || "fixed";
  const watchedNotes = useWatch({ control, name: "notes" });

  // Refs for notes field
  const notesRef = useRef(null);
  // Extract onChange, onBlur, name, ref from register
  const { ref: notesRegisterRef, onBlur: notesOnBlur, onChange: notesOnChange, ...notesRegisterRest } = register("notes");

  // Define field order based on chit type (editable fields only)
  const getFieldOrder = () => {
    // Include chit_type after name for keyboard navigation
    const baseFields = ["name", "chit_type", "chit_value", "size"];

    if (watchedChitType === "fixed") {
      return [...baseFields, "monthly_installment", "duration_months", "start_date", "end_date", "collection_day", "payout_day", "notes"];
    } else if (watchedChitType === "variable") {
      return [...baseFields, "payout_premium_percent", "duration_months", "start_date", "end_date", "collection_day", "payout_day", "notes"];
    } else if (watchedChitType === "auction") {
      return [...baseFields, "foreman_commission_percent", "duration_months", "start_date", "end_date", "collection_day", "payout_day", "notes"];
    }
    return [...baseFields, "duration_months", "start_date", "end_date", "collection_day", "payout_day", "notes"];
  };

  // Auto-focus name field on create
  useEffect(() => {
    if (mode === "create" && !isPostCreation) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [mode, isPostCreation]);

  // Effect to handle scroll shadows update on value change
  useEffect(() => {
    if (notesRef.current) {
      handleNotesScroll({ target: notesRef.current });
    }
  }, [watchedNotes]);

  // Handle Note Field Scroll
  const handleNotesScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setShowTopShadow(scrollTop > 0);
    // Use a small buffer (1px) for float math safety
    setShowBottomShadow(Math.ceil(scrollTop + clientHeight) < scrollHeight - 1);
  };

  // Handle Note Field Focus - Move cursor to end & append newline if needed
  const handleNotesFocus = (e) => {
    let val = e.target.value;

    // Check if we need to append a newline (if text exists and doesn't end with one)
    if (val && val.length > 0 && !val.endsWith('\n')) {
      const newVal = val + '\n';

      // Update RHF state
      if (setValue) {
        setValue("notes", newVal, { shouldDirty: true });
      }

      // Update UI immediately
      e.target.value = newVal;
      val = newVal;
    }

    // Move cursor to the very end
    // setTimeout ensures this runs after the browser's default focus behavior
    setTimeout(() => {
      if (e.target) {
        e.target.scrollTop = e.target.scrollHeight;
        const len = e.target.value.length;
        e.target.setSelectionRange(len, len);
      }
    }, 0);
  };

  // Handle Note Change - Instant Capitalization & Scroll Shadows
  const handleNotesChange = (e) => {
    const val = e.target.value;
    const selectionStart = e.target.selectionStart;
    const selectionEnd = e.target.selectionEnd;

    // Instant Capitalization of first letter
    if (val.length > 0) {
      const firstChar = val.charAt(0);
      const upperFirst = firstChar.toUpperCase();

      if (firstChar !== upperFirst) {
        const newVal = upperFirst + val.slice(1);
        e.target.value = newVal;
        // Restore cursor position (crucial if editing the first character)
        e.target.setSelectionRange(selectionStart, selectionEnd);
      }
    }

    // Pass event to React Hook Form
    notesOnChange(e);

    // Update scroll shadows
    handleNotesScroll(e);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isFormDisabled) {
      const inputName = e.target.name;
      const fieldOrder = getFieldOrder();
      const currentIndex = fieldOrder.indexOf(inputName);

      // If notes field, DO NOT submit form on Enter. Allow new line.
      if (inputName === "notes") {
        // We let the default behavior happen (newline) and stop our custom navigation
        return;
      }

      // If field is in our list, move to next field
      if (currentIndex !== -1 && currentIndex < fieldOrder.length - 1) {
        e.preventDefault();
        const nextFieldName = fieldOrder[currentIndex + 1];
        const nextField = document.querySelector(`[name="${nextFieldName}"]`);
        if (nextField) {
          nextField.focus();
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
              autoComplete="off"
              className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${errors.name ? "border-red-500" : "border-border"
                }`}
              maxLength={50}
              placeholder="5 Lakh Chit"
              disabled={isFormDisabled || isEditMode}
              enterKeyHint="next"
              onBlur={onNameBlur}
              onKeyDown={handleKeyDown}
              style={{ textTransform: "capitalize" }}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* --- CHIT TYPE SELECTOR --- */}
        <div>
          <label htmlFor="chit_type" className="block text-lg font-medium text-text-secondary mb-1">
            Chit Type
          </label>
          <div
            onFocus={() => setIsChitTypeFocused(true)}
            onBlur={() => setIsChitTypeFocused(false)}
          >
            <SegmentedControl
              control={control}
              name="chit_type"
              options={CHIT_TYPE_OPTIONS}
              disabled={isFormDisabled || isEditMode}
            />
          </div>
          {isChitTypeFocused && (
            <div className="mt-3">
              <Message type="info" title="" className="py-2 text-sm">
                {CHIT_TYPE_OPTIONS.find((opt) => opt.value === watchedChitType)
                  ?.description}
              </Message>
            </div>
          )}
          {errors.chit_type && (
            <p className="mt-1 text-sm text-red-500">{errors.chit_type.message}</p>
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
                <Wallet className="w-5 h-5 text-text-secondary" />
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
                placeholder="5,00,000"
                disabled={isFormDisabled}
                onKeyDown={handleKeyDown}
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
                autoComplete="off"
                className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${errors.size ? "border-red-500" : "border-border"
                  }`}
                min="1"
                placeholder="20"
                disabled={isFormDisabled}
                onKeyDown={handleKeyDown}
                onFocus={onSizeChange}
              />
            </div>
            {errors.size && (
              <p className="mt-1 text-sm text-red-500">{errors.size.message}</p>
            )}
          </div>
        </div>

        {/* --- CONDITIONAL INSTALLMENT FIELDS --- */}
        {watchedChitType === "fixed" && (
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Monthly Installment (Fixed Chit) */}
            <div>
              <label
                htmlFor="monthly_installment"
                className="block text-lg font-medium text-text-secondary mb-1"
              >
                Monthly Installment
              </label>
              <div className="relative flex items-center">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <PieChart className="w-5 h-5 text-text-secondary" />
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
                  placeholder="20,000"
                  disabled={isFormDisabled}
                  onKeyDown={handleKeyDown}
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
                  autoComplete="off"
                  className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${errors.duration_months ? "border-red-500" : "border-border"
                    }`}
                  min="1"
                  placeholder="20"
                  disabled={isFormDisabled}
                  onKeyDown={handleKeyDown}
                  onFocus={onDurationChange}
                />
              </div>
              {errors.duration_months && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.duration_months.message}
                </p>
              )}
            </div>
          </div>
        )}

        {watchedChitType === "variable" && (
          <>
            {/* Variable Chit Payout Premium Percent */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Payout Premium Percent */}
              <div>
                <label
                  htmlFor="payout_premium_percent"
                  className="block text-lg font-medium text-text-secondary mb-1"
                >
                  Payout Premium (%)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Percent className="w-5 h-5 text-text-secondary" />
                  </span>
                  <div className="absolute left-10 h-6 w-px bg-border"></div>
                  <input
                    {...register("payout_premium_percent", { valueAsNumber: true })}
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    id="payout_premium_percent"
                    autoComplete="off"
                    className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${errors.payout_premium_percent ? "border-red-500" : "border-border"
                      }`}
                    placeholder="1"
                    disabled={isFormDisabled}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                {errors.payout_premium_percent && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.payout_premium_percent.message}
                  </p>
                )}
              </div>

              {/* Duration for Variable Chit */}
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
                    autoComplete="off"
                    className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${errors.duration_months ? "border-red-500" : "border-border"
                      }`}
                    min="1"
                    placeholder="20"
                    disabled={isFormDisabled}
                    onKeyDown={handleKeyDown}
                    onFocus={onDurationChange}
                  />
                </div>
                {errors.duration_months && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.duration_months.message}
                  </p>
                )}
              </div>
            </div>


          </>
        )}

        {watchedChitType === "auction" && (
          <>


            {/* Auction Specific Fields */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Foreman Commission Percent */}
              <div>
                <label
                  htmlFor="foreman_commission_percent"
                  className="block text-lg font-medium text-text-secondary mb-1"
                >
                  Foreman Commission (%)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Percent className="w-5 h-5 text-text-secondary" />
                  </span>
                  <div className="absolute left-10 h-6 w-px bg-border"></div>
                  <input
                    {...register("foreman_commission_percent", { valueAsNumber: true })}
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    id="foreman_commission_percent"
                    autoComplete="off"
                    className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${errors.foreman_commission_percent ? "border-red-500" : "border-border"
                      }`}
                    placeholder="1"
                    disabled={isFormDisabled}
                    onKeyDown={handleKeyDown}
                  />
                </div>
                {errors.foreman_commission_percent && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.foreman_commission_percent.message}
                  </p>
                )}
              </div>

              {/* Duration for Auction Chit */}
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
                    autoComplete="off"
                    className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${errors.duration_months ? "border-red-500" : "border-border"
                      }`}
                    min="1"
                    placeholder="20"
                    disabled={isFormDisabled}
                    onKeyDown={handleKeyDown}
                    onFocus={onDurationChange}
                  />
                </div>
                {errors.duration_months && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.duration_months.message}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

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
                  onFocus={onStartDateChange}
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
                  disabled={isFormDisabled}
                  className={errors.end_date ? "border-red-500" : ""}
                  onFocus={onEndDateChange}
                />
              )}
            />
            {errors.end_date && (
              <p className="mt-1 text-sm text-red-500">
                {errors.end_date.message}
              </p>
            )}
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
                autoComplete="off"
                className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${errors.collection_day ? "border-red-500" : "border-border"
                  }`}
                min="1"
                max="28"
                placeholder="5"
                disabled={isFormDisabled}
                onKeyDown={handleKeyDown}
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
                autoComplete="off"
                className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${errors.payout_day ? "border-red-500" : "border-border"
                  }`}
                min="1"
                max="28"
                placeholder="10"
                disabled={isFormDisabled}
                onKeyDown={handleKeyDown}
              />
            </div>
            {errors.payout_day && (
              <p className="mt-1 text-sm text-red-500">
                {errors.payout_day.message}
              </p>
            )}
          </div>
        </div>

        {/* --- NOTES (Optional) --- */}
        <div>
          <label
            htmlFor="notes"
            className="block text-lg font-medium text-text-secondary mb-1"
          >
            Notes (Optional)
          </label>
          <div className="relative">
            {/* --- SCROLL SHADOWS --- */}
            {showTopShadow && (
              <div className="absolute top-[1px] left-12 right-4 h-4 bg-gradient-to-b from-text-primary/10 to-transparent pointer-events-none z-20 rounded-t-md" />
            )}

            <div className="relative flex items-center">
              {/* Icon */}
              <span className="absolute top-3 left-0 flex items-start pl-3 pointer-events-none z-10">
                <FileText className="w-5 h-5 text-text-secondary" />
              </span>
              {/* Divider */}
              <div className="absolute left-10 top-2.5 h-6 w-px bg-border pointer-events-none z-10"></div>
              <textarea
                {...notesRegisterRest}
                ref={(e) => {
                  notesRegisterRef(e);
                  notesRef.current = e;
                }}
                onChange={handleNotesChange}
                onBlur={notesOnBlur}
                onFocus={handleNotesFocus}
                onScroll={handleNotesScroll}
                id="notes"
                autoComplete="off"
                className="w-full pl-12 pr-4 pt-2.5 pb-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed resize-none h-[148px] overflow-y-auto"
                placeholder="Add any additional notes or reminders about this chit..."
                disabled={isFormDisabled}
                onKeyDown={(e) => {
                  // Allow Enter to create new lines in textarea, use Ctrl+Enter or Cmd+Enter to submit
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    if (onEnterKeyOnLastInput) {
                      onEnterKeyOnLastInput();
                    }
                  }
                }}
              />
            </div>

            {/* --- SCROLL SHADOWS --- */}
            {showBottomShadow && (
              <div className="absolute bottom-[2px] left-12 right-4 h-4 bg-gradient-to-t from-text-primary/10 to-transparent pointer-events-none z-20 rounded-b-md" />
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
  setValue: PropTypes.func,
  onEnterKeyOnLastInput: PropTypes.func,
  onNameBlur: PropTypes.func,
  onSizeChange: PropTypes.func,
  onDurationChange: PropTypes.func,
  onStartDateChange: PropTypes.func,
  onEndDateChange: PropTypes.func,
};

export default ChitDetailsForm;
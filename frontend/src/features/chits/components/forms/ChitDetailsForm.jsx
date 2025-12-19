// frontend/src/features/chits/components/forms/ChitDetailsForm.jsx

import { useEffect, useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { Controller, useWatch, useFormState } from "react-hook-form";
import Message from "../../../../components/ui/Message";
import CustomMonthInput from "../../../../components/ui/CustomMonthInput";
import FormattedInput from "../../../../components/ui/FormattedInput";
import SegmentedControl from "../../../../components/ui/SegmentedControl";
import NotesToolbar from "./fields/NotesToolbar";
import NotesFullScreenModal from "./fields/NotesFullScreenModal";
import { useNotesDraft } from "../../hooks/useNotesDraft";
import { checkChitNameAvailability } from "../../../../services/chitsService";
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
  IndianRupee,
  PieChart,
  Percent,
  FileText,
  Check,
  Loader2,
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

/**
 * Helper to parse decimal number string with proper leading zero handling
 * - Allows decimal point for percentages
 * - Strips leading zeros except when followed by decimal (e.g., "0.5" stays as "0.5")
 * - Supports shorthand like ".5" for "0.5"
 * - Ensures only one decimal point
 */
const parseDecimalNumber = (value) => {
  if (!value) return "";

  // Step 1: Remove all non-numeric characters except decimal point
  let rawValue = value.toString().replace(/[^0-9.]/g, "");

  // Step 2: Ensure only one decimal point (keep first one)
  const parts = rawValue.split(".");
  if (parts.length > 2) {
    rawValue = parts[0] + "." + parts.slice(1).join("");
  }

  // Step 3: Handle leading zeros and normalize format
  if (rawValue.includes(".")) {
    // Has decimal point
    const [intPart, decPart] = rawValue.split(".");
    // For ".5" → "0.5", for "007.5" → "7.5", for "0.5" → "0.5"
    let cleanInt;
    if (intPart === "") {
      cleanInt = "0"; // .5 → 0.5
    } else {
      // Remove leading zeros: "007" → "7", "0" → "0"
      cleanInt = String(parseInt(intPart, 10));
    }
    rawValue = cleanInt + "." + decPart;
  } else {
    // No decimal - remove leading zeros but keep "0" if that's the value
    // "0" → "0", "007" → "7", "00" → "0"
    if (rawValue !== "") {
      rawValue = String(parseInt(rawValue, 10));
    }
  }

  return rawValue;
};

/**
 * Helper to convert text to Title Case (capitalize first letter of each word)
 */
const toTitleCase = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Helper to convert text to Sentence Case (capitalize first letter of each sentence)
 */
const toSentenceCase = (str) => {
  if (!str) return "";
  // Capitalize first character, then capitalize after sentence-ending punctuation
  return str
    .toLowerCase()
    .replace(/(^\s*\w|[.!?]\s*\w)/g, (match) => match.toUpperCase());
};

/**
 * Helper to display error message with Indian Rupee icon
 * Parses strings containing '₹' and replaces them with the IndianRupee icon
 */
const ErrorMessageWithIcon = ({ message }) => {
  if (!message) return null;

  if (typeof message === 'string' && message.includes('₹')) {
    const parts = message.split('₹');
    return (
      <>
        {parts.map((part, index) => (
          <span key={index}>
            {part}
            {index < parts.length - 1 && (
              <IndianRupee className="inline w-3 h-3 align-middle" style={{ marginTop: "-2px" }} />
            )}
          </span>
        ))}
      </>
    );
  }
  return message;
};

/**
 * Helper to trim leading whitespace only (for onChange - less intrusive)
 */
const trimLeadingWhitespace = (str) => {
  if (!str) return "";
  return str.trimStart();
};

/**
 * Helper to normalize whitespace: collapse multiple spaces to single space and trim
 */
const normalizeWhitespace = (str) => {
  if (!str) return "";
  return str.replace(/\s+/g, " ").trim();
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
  hasActiveOperations = false,
  setValue,
  setError,
  clearErrors,
  trigger,
  chitId = null,
  onEnterKeyOnLastInput,
  onNameValid,
  onNameInvalid,
  onSizeChange,
  onDurationChange,
  onStartDateChange,
  onEndDateChange,
  onShowLockedFieldWarning,
}) => {
  const nameInputRef = useRef(null);
  const fieldsetRef = useRef(null);
  const isFormDisabled = mode === "view";
  const isEditMode = mode === "edit";

  // State to track hovered chit type option (for showing description in create mode)
  const [hoveredChitTypeOption, setHoveredChitTypeOption] = useState(null);

  // State for notes scroll shadows
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  // Watch fields
  const watchedChitType = useWatch({ control, name: "chit_type" }) || "fixed";
  const watchedNotes = useWatch({ control, name: "notes" });
  const watchedName = useWatch({ control, name: "name" }) || "";
  const watchedChitValue = useWatch({ control, name: "chit_value" });
  const watchedSize = useWatch({ control, name: "size" });
  const watchedMonthlyInstallment = useWatch({ control, name: "monthly_installment" });
  const watchedPayoutPremium = useWatch({ control, name: "payout_premium_percent" });
  const watchedForemanCommission = useWatch({ control, name: "foreman_commission_percent" });
  const watchedDuration = useWatch({ control, name: "duration_months" });
  const watchedStartDate = useWatch({ control, name: "start_date" });
  const watchedEndDate = useWatch({ control, name: "end_date" });
  const watchedCollectionDay = useWatch({ control, name: "collection_day" });
  const watchedPayoutDay = useWatch({ control, name: "payout_day" });

  // State for name field focus (to show/hide character counter)
  const [isNameFocused, setIsNameFocused] = useState(false);

  // State for notes field focus (to show/hide character counter)
  const [isNotesFocused, setIsNotesFocused] = useState(false);

  // State for notes fullscreen modal
  const [isNotesFullscreen, setIsNotesFullscreen] = useState(false);

  // Draft auto-save hook for notes
  const { draftStatus, clearDraft } = useNotesDraft(chitId, watchedNotes, setValue);

  // Get touchedFields from RHF to track which fields have been touched (blurred)
  // This replaces custom isNameTouched and isNotesTouched states for consistency
  const { touchedFields } = useFormState({ control });

  // Refs for notes field
  const notesRef = useRef(null);
  // State for name checking
  const [isCheckingName, setIsCheckingName] = useState(false);
  // State for name availability (show check mark when available)
  const [isNameAvailable, setIsNameAvailable] = useState(false);
  // Extract onChange, onBlur, name, ref from register for notes
  const { ref: notesRegisterRef, onBlur: notesOnBlur, onChange: notesOnChange, ...notesRegisterRest } = register("notes");
  // Extract onBlur from register for name field (to trigger validation on blur)
  const { onBlur: nameRegisterOnBlur } = register("name");

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

  // Handle numeric input - only allow digits (and optionally decimal for percentages)
  const handleNumericInput = useCallback((e, allowDecimal = false) => {
    const pattern = allowDecimal ? /[^0-9.]/g : /[^0-9]/g;
    e.target.value = e.target.value.replace(pattern, '');
    // For decimal, ensure only one decimal point
    if (allowDecimal) {
      const parts = e.target.value.split('.');
      if (parts.length > 2) {
        e.target.value = parts[0] + '.' + parts.slice(1).join('');
      }
    }
  }, []);

  // Show warning when user clicks on a locked field
  const showLockedFieldMessage = useCallback((fieldName, reason) => {
    if (!onShowLockedFieldWarning) return;
    const messages = {
      core: `"${fieldName}" cannot be changed as it defines the chit contract.`,
      financial: `"${fieldName}" cannot be changed as it affects financial calculations.`,
      active: `"${fieldName}" cannot be changed because this chit has active members or collections.`,
    };
    onShowLockedFieldWarning(messages[reason] || messages.core);
  }, [onShowLockedFieldWarning]);

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

  // Handle Note Field Focus - Append newline if needed and move cursor to end
  const handleNotesFocus = (e) => {
    setIsNotesFocused(true);
    const textarea = e.target;
    let val = textarea.value;

    // Check if we need to append a newline (if text exists and doesn't end with one)
    if (val && val.length > 0 && !val.endsWith('\n')) {
      const newVal = val + '\n';

      // Update RHF state
      if (setValue) {
        setValue("notes", newVal, { shouldDirty: true });
      }

      // Update UI immediately
      textarea.value = newVal;
      val = newVal;
    }

    // Move cursor to end and scroll to bottom
    setTimeout(() => {
      if (textarea) {
        const endPosition = textarea.value.length;
        textarea.setSelectionRange(endPosition, endPosition);
        textarea.scrollTop = textarea.scrollHeight;
      }
    }, 0);
  };

  // Handle Note Change - Scroll Shadows and validate if touched
  const handleNotesChange = (e) => {
    // Pass event to React Hook Form
    notesOnChange(e);

    // Update scroll shadows
    handleNotesScroll(e);

    // If touched, trigger validation on change
    if (touchedFields?.notes && setValue) {
      setValue("notes", e.target.value, { shouldValidate: true });
    }
  };

  // Handle toolbar insert - insert formatted text at cursor position
  const handleNotesInsert = useCallback((textToInsert, options = {}) => {
    const textarea = notesRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    // Determine if we need a newline before
    let prefix = "";
    if (options.newLineBefore && start > 0 && text[start - 1] !== "\n") {
      prefix = "\n";
    }

    // Handle numbered list auto-increment
    let insertText = textToInsert;
    if (options.isNumbered) {
      // Find the last number in the text before cursor
      const textBefore = text.slice(0, start);
      const lastLineMatch = textBefore.match(/(\d+)\.\s*[^\n]*$/);
      if (lastLineMatch) {
        const nextNum = parseInt(lastLineMatch[1], 10) + 1;
        insertText = `${nextNum}. `;
      }
    }

    // Determine if we need a newline after
    let suffix = "";
    if (options.newLineAfter) {
      suffix = "\n";
    }

    // Build the new text
    const newText = text.slice(0, start) + prefix + insertText + suffix + text.slice(end);

    // Update form state
    if (setValue) {
      setValue("notes", newText, { shouldDirty: true, shouldValidate: true });
    }

    // Move cursor after inserted text
    const newPos = start + prefix.length + insertText.length + suffix.length;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  }, [setValue]);

  // Handle Name Blur - Trim trailing whitespace and trigger validation
  // RHF's onBlur will mark the field as touched automatically
  const handleNameBlur = useCallback((e) => {
    // RHF marks field as touched on blur (no need to set custom state)
    setIsNameFocused(false);

    // Trim trailing whitespace on blur
    const trimmed = e.target.value.trimEnd();
    if (trimmed !== e.target.value) {
      e.target.value = trimmed;
    }

    // Update form state with trimmed value and trigger Zod validation
    if (setValue) {
      setValue("name", trimmed, { shouldValidate: true });
    }

    // Call the register's onBlur to mark field as touched in RHF
    if (nameRegisterOnBlur) {
      nameRegisterOnBlur(e);
    }

    // Check for duplicates (only if valid length)
    if (trimmed.length >= 3) {
      setIsCheckingName(true);
      (async () => {
        try {
          const result = await checkChitNameAvailability(trimmed);
          if (!result.available) {
            setIsNameAvailable(false);
            if (setError) {
              setError("name", {
                type: "manual",
                message: "This Chit Name already exists.",
              });
            }
            // Call onNameInvalid for duplicate names - resets header
            if (onNameInvalid) {
              onNameInvalid();
            }
          } else {
            setIsNameAvailable(true);
            // Call onNameValid for header update when name is available
            if (onNameValid) {
              onNameValid(trimmed);
            }
          }
        } catch (err) {
          console.error("Name check failed on blur:", err);
          setIsNameAvailable(false);
        } finally {
          setIsCheckingName(false);
        }
      })();
    } else {
      setIsNameAvailable(false);
      // Call onNameInvalid for short names - resets header
      if (onNameInvalid) {
        onNameInvalid();
      }
    }
  }, [setValue, setError, nameRegisterOnBlur, onNameValid, onNameInvalid]);

  // Handle Name Focus - Track focus state and re-check duplicates if previously touched
  const handleNameFocus = useCallback(() => {
    setIsNameFocused(true);

    // Skip in edit mode or if field hasn't been touched yet
    if (isEditMode || !touchedFields?.name) return;

    // Get current name value and check for duplicates if valid length
    const currentName = watchedName?.trim();
    if (currentName && currentName.length >= 3) {
      setIsCheckingName(true);
      (async () => {
        try {
          const result = await checkChitNameAvailability(currentName);
          if (!result.available) {
            setIsNameAvailable(false);
            if (setError) {
              setError("name", {
                type: "manual",
                message: "This Chit Name already exists.",
              });
            }
          } else {
            setIsNameAvailable(true);
            // Clear any previous duplicate error if name is now available
            if (clearErrors) {
              clearErrors("name");
            }
          }
        } catch (err) {
          console.error("Name check failed on focus:", err);
          setIsNameAvailable(false);
        } finally {
          setIsCheckingName(false);
        }
      })();
    }
  }, [isEditMode, touchedFields?.name, watchedName, setError, clearErrors]);


  // Handle Name Change - Format text and validate if touched
  const handleNameChange = useCallback((e) => {
    // Early return in edit mode - field is disabled but this is defensive
    if (isEditMode) return;

    const rawValue = e.target.value;

    // Get cursor position before formatting
    const cursorPos = e.target.selectionStart;
    const prevLength = rawValue.length;

    // Step 1: Trim leading whitespace
    let formatted = trimLeadingWhitespace(rawValue);

    // Step 2: Collapse multiple spaces to single space (but don't trim end - user might be typing)
    formatted = formatted.replace(/  +/g, ' ');

    // Step 3: Apply Title Case (capitalize first letter of each word)
    formatted = formatted
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // Update input value
    e.target.value = formatted;

    // Restore cursor position (adjust if length changed)
    const newLength = formatted.length;
    const newCursorPos = Math.max(0, cursorPos - (prevLength - newLength));
    e.target.setSelectionRange(newCursorPos, newCursorPos);

    // Update form state - validate only if field has been touched
    if (setValue) {
      setValue("name", formatted, {
        shouldDirty: true,
        shouldValidate: !!touchedFields?.name  // Only validate on change after first blur
      });
    }

    // Skip duplicate check if name too short (but NOT based on touched state)
    if (formatted.length < 3) {
      setIsCheckingName(false);
      setIsNameAvailable(false);
      return;
    }

    // Check for duplicates immediately on change (for check mark visibility)
    setIsCheckingName(true);
    setIsNameAvailable(false);
    (async () => {
      try {
        const result = await checkChitNameAvailability(formatted.trim());
        if (!result.available) {
          setIsNameAvailable(false);
          // Only set error if field has been touched (respects onTouched mode)
          if (setError && touchedFields?.name) {
            setError("name", {
              type: "manual",
              message: "This Chit Name already exists.",
            });
          }
        } else {
          setIsNameAvailable(true);
        }
      } catch (err) {
        console.error("Name check failed:", err);
        setIsNameAvailable(false);
      } finally {
        setIsCheckingName(false);
      }
    })();
  }, [isEditMode, touchedFields?.name, setValue, setError]);

  // Handle Notes Blur - Format to Sentence Case
  // RHF's onBlur will mark the field as touched automatically
  const handleNotesBlur = (e) => {
    // RHF marks field as touched on blur (no need to set custom state)
    setIsNotesFocused(false);

    const val = e.target.value;
    if (val) {
      const formatted = toSentenceCase(val);
      if (formatted !== val) {
        e.target.value = formatted;
        if (setValue) {
          setValue("notes", formatted, { shouldDirty: true, shouldValidate: true });
        }
      } else {
        // Even if no formatting, validate on blur
        if (setValue) {
          setValue("notes", val, { shouldValidate: true });
        }
      }
    }
    // Call the original RHF onBlur
    notesOnBlur(e);
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
        // Scope search to this fieldset only to prevent cross-form focus issues
        const nextField = fieldsetRef.current?.querySelector(`[name="${nextFieldName}"]`);
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
        ref={fieldsetRef}
        disabled={isFormDisabled}
        className="space-y-6"
        onKeyDown={handleKeyDown}
      >
        {/* --- NAME --- */}
        <div
          onClick={isEditMode ? () => showLockedFieldMessage("Chit Name", "core") : undefined}
          className={isEditMode ? "cursor-not-allowed" : ""}
        >
          <label
            htmlFor="name"
            className="block text-lg font-medium text-text-secondary mb-1"
          >
            Chit Name
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
              autoCapitalize="words"
              className={`w-full pl-12 pr-10 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${isEditMode ? "pointer-events-none" : ""} ${errors.name ? "border-red-500" : "border-border"}`}
              maxLength={50}
              placeholder="5 Lakh Chit"
              disabled={isFormDisabled || isEditMode}
              enterKeyHint="next"
              onFocus={handleNameFocus}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              onKeyDown={handleKeyDown}
            />
            {/* Status icon on right */}
            {!isEditMode && !isFormDisabled && (
              <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                {isCheckingName ? (
                  <Loader2 className="w-5 h-5 text-text-tertiary animate-spin" />
                ) : isNameAvailable && !errors.name ? (
                  <span className="flex items-center justify-center w-5 h-5 bg-green-500 rounded-full">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </span>
                ) : null}
              </span>
            )}
          </div>
          {/* Error message and character counter row */}
          {(errors.name || isNameFocused) && (
            <div className="flex justify-between items-center mt-1">
              {/* Error on left */}
              <span className="text-xs font-medium text-red-500">
                {errors.name ? errors.name.message : ""}
              </span>
              {/* Character counter on right - only when focused */}
              {isNameFocused && (
                <span
                  className={`text-xs font-medium transition-colors duration-200 ${watchedName.length >= 50
                    ? "text-red-500"
                    : watchedName.length >= 40
                      ? "text-amber-500"
                      : "text-text-tertiary"
                    }`}
                >
                  {watchedName.length}/50
                </span>
              )}
            </div>
          )}
        </div>

        {/* --- CHIT TYPE SELECTOR --- */}
        <div
          onClick={isEditMode ? () => showLockedFieldMessage("Chit Type", "core") : undefined}
          className={isEditMode ? "cursor-not-allowed" : ""}
        >
          <label htmlFor="chit_type" className="block text-lg font-medium text-text-secondary mb-1">
            Chit Type
          </label>
          <SegmentedControl
            control={control}
            name="chit_type"
            options={CHIT_TYPE_OPTIONS}
            disabled={isFormDisabled || isEditMode}
            onOptionHighlight={!isEditMode && !isFormDisabled ? setHoveredChitTypeOption : undefined}
          />
          {hoveredChitTypeOption && !isEditMode && !isFormDisabled && (
            <div className="mt-3">
              <Message type="info" title="" className="py-2 text-sm">
                {hoveredChitTypeOption.description}
              </Message>
            </div>
          )}
          {errors.chit_type && (
            <p className="mt-1 text-xs font-medium text-red-500">{errors.chit_type.message}</p>
          )}
        </div>

        {/* --- CHIT VALUE & SIZE --- */}
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Chit Value (Formatted) */}
          <div
            onClick={isEditMode ? () => showLockedFieldMessage("Chit Value", "core") : undefined}
            className={isEditMode ? "cursor-not-allowed" : ""}
          >
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
              <span className="absolute inset-y-0 left-12 flex items-center pointer-events-none text-text-secondary">
                <IndianRupee className="w-4 h-4" />
              </span>
              <FormattedInput
                name="chit_value"
                control={control}
                format={formatNumber}
                parse={parseNumber}
                id="chit_value"
                inputMode="numeric"
                autoComplete="on"
                enterKeyHint="next"
                className={`w-full pl-16 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${isEditMode ? "pointer-events-none" : ""} ${errors.chit_value ? "border-red-500" : "border-border"
                  }`}
                maxLength={20}
                placeholder="5,00,000"
                disabled={isFormDisabled || isEditMode}
                onKeyDown={handleKeyDown}
              />
            </div>
            {errors.chit_value && (
              <p className="mt-1 text-xs font-medium text-red-500">
                <ErrorMessageWithIcon message={errors.chit_value.message} />
              </p>
            )}
            {!errors.chit_value && watchedChitValue > 0 && watchedChitValue < 100000 && !isFormDisabled && !isEditMode && (
              <p className="mt-1 text-xs font-medium text-amber-500">Low value — below <IndianRupee className="inline w-3 h-3 align-middle" style={{ marginTop: "-2px" }} />1,00,000 may not be practical.</p>
            )}
            {!errors.chit_value && watchedChitValue > 10000000 && !isFormDisabled && !isEditMode && (
              <p className="mt-1 text-xs font-medium text-amber-500">High value — above <IndianRupee className="inline w-3 h-3 align-middle" style={{ marginTop: "-2px" }} />1 Crore, ensure members can afford installments.</p>
            )}
          </div>

          {/* Size */}
          <div
            onClick={isEditMode ? () => showLockedFieldMessage("Size", "core") : undefined}
            className={isEditMode ? "cursor-not-allowed" : ""}
          >
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
                {...register("size", { setValueAs: v => v === '' ? undefined : Number(v) })}
                type="text"
                inputMode="numeric"
                id="size"
                autoComplete="on"
                enterKeyHint="next"
                maxLength={3}
                className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${isEditMode ? "pointer-events-none" : ""} ${errors.size ? "border-red-500" : "border-border"
                  }`}
                placeholder="20"
                disabled={isFormDisabled || isEditMode}
                onKeyDown={handleKeyDown}
                onFocus={onSizeChange}
                onInput={(e) => { e.target.value = parseNumber(e.target.value); }}
              />
            </div>
            {errors.size && (
              <p className="mt-1 text-xs font-medium text-red-500">{errors.size.message}</p>
            )}
            {!errors.size && watchedSize > 0 && watchedSize < 15 && !isFormDisabled && !isEditMode && (
              <p className="mt-1 text-xs font-medium text-amber-500">Small size — less than 15 members may not be sustainable.</p>
            )}
            {!errors.size && watchedSize > 50 && !isFormDisabled && !isEditMode && (
              <p className="mt-1 text-xs font-medium text-amber-500">Large size — over 50 members may be difficult to manage.</p>
            )}
          </div>
        </div>

        {/* --- CONDITIONAL INSTALLMENT FIELDS --- */}
        {watchedChitType === "fixed" && (
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Monthly Installment (Fixed Chit) */}
            <div
              onClick={isEditMode ? () => showLockedFieldMessage("Monthly Installment", "financial") : undefined}
              className={isEditMode ? "cursor-not-allowed" : ""}
            >
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
                <span className="absolute inset-y-0 left-12 flex items-center pointer-events-none text-text-secondary">
                  <IndianRupee className="w-4 h-4" />
                </span>
                <FormattedInput
                  name="monthly_installment"
                  control={control}
                  format={formatNumber}
                  parse={parseNumber}
                  id="monthly_installment"
                  inputMode="numeric"
                  autoComplete="on"
                  enterKeyHint="next"
                  maxLength={15}
                  className={`w-full pl-16 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${isEditMode ? "pointer-events-none" : ""} ${errors.monthly_installment ? "border-red-500" : "border-border"
                    }`}
                  placeholder="20,000"
                  disabled={isFormDisabled || isEditMode}
                  onKeyDown={handleKeyDown}
                />
              </div>
              {errors.monthly_installment && (
                <p className="mt-1 text-xs font-medium text-red-500">
                  <ErrorMessageWithIcon message={errors.monthly_installment.message} />
                </p>
              )}
              {!errors.monthly_installment && watchedMonthlyInstallment > 0 && watchedMonthlyInstallment < 10000 && !isFormDisabled && !isEditMode && (
                <p className="mt-1 text-xs font-medium text-amber-500">Low installment — below <IndianRupee className="inline w-3 h-3 align-middle" style={{ marginTop: "-2px" }} />10,000 may not be practical.</p>
              )}
              {!errors.monthly_installment && watchedMonthlyInstallment > 50000 && !isFormDisabled && !isEditMode && (
                <p className="mt-1 text-xs font-medium text-amber-500">High installment — above <IndianRupee className="inline w-3 h-3 align-middle" style={{ marginTop: "-2px" }} />50,000/month may be difficult for members.</p>
              )}
            </div>

            {/* Duration */}
            <div
              onClick={isEditMode ? () => showLockedFieldMessage("Duration", "core") : undefined}
              className={isEditMode ? "cursor-not-allowed" : ""}
            >
              <label
                htmlFor="duration_months"
                className="block text-lg font-medium text-text-secondary mb-1"
              >
                Duration
              </label>
              <div className="relative flex items-center">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Clock className="w-5 h-5 text-text-secondary" />
                </span>
                <div className="absolute left-10 h-6 w-px bg-border"></div>
                <input
                  {...register("duration_months", { setValueAs: v => v === '' ? undefined : Number(v) })}
                  type="text"
                  inputMode="numeric"
                  id="duration_months"
                  autoComplete="on"
                  enterKeyHint="next"
                  maxLength={3}
                  className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${isEditMode ? "pointer-events-none" : ""} ${errors.duration_months ? "border-red-500" : "border-border"
                    }`}
                  placeholder="20"
                  disabled={isFormDisabled || isEditMode}
                  onKeyDown={handleKeyDown}
                  onFocus={onDurationChange}
                  onInput={(e) => { e.target.value = parseNumber(e.target.value); }}
                />
              </div>
              {errors.duration_months && (
                <p className="mt-1 text-xs font-medium text-red-500">
                  {errors.duration_months.message}
                </p>
              )}
              {!errors.duration_months && watchedDuration > 0 && watchedDuration < 15 && !isFormDisabled && !isEditMode && (
                <p className="mt-1 text-xs font-medium text-amber-500">Short duration — less than 15 months may not yield sufficient returns.</p>
              )}
              {!errors.duration_months && watchedDuration > 36 && !isFormDisabled && !isEditMode && (
                <p className="mt-1 text-xs font-medium text-amber-500">Long duration — over 36 months increases risk of member dropouts.</p>
              )}
            </div>
          </div>
        )}

        {watchedChitType === "variable" && (
          <>
            {/* Variable Chit Payout Premium Percent */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Payout Premium Percent */}
              <div
                onClick={isEditMode ? () => showLockedFieldMessage("Payout Premium", "financial") : undefined}
                className={isEditMode ? "cursor-not-allowed" : ""}
              >
                <label
                  htmlFor="payout_premium_percent"
                  className="block text-lg font-medium text-text-secondary mb-1"
                >
                  Payout Premium
                </label>
                <div className="relative flex items-center">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Percent className="w-5 h-5 text-text-secondary" />
                  </span>
                  <div className="absolute left-10 h-6 w-px bg-border"></div>
                  <input
                    {...register("payout_premium_percent", { setValueAs: v => v === '' ? undefined : Number(v) })}
                    type="text"
                    inputMode="decimal"
                    id="payout_premium_percent"
                    autoComplete="on"
                    enterKeyHint="next"
                    maxLength={6}
                    className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${isEditMode ? "pointer-events-none" : ""} ${errors.payout_premium_percent ? "border-red-500" : "border-border"
                      }`}
                    placeholder="1"
                    disabled={isFormDisabled || isEditMode}
                    onKeyDown={handleKeyDown}
                    onInput={(e) => { e.target.value = parseDecimalNumber(e.target.value); }}
                  />
                </div>
                {errors.payout_premium_percent && (
                  <p className="mt-1 text-xs font-medium text-red-500">
                    {errors.payout_premium_percent.message}
                  </p>
                )}
                {!errors.payout_premium_percent && watchedPayoutPremium > 0 && watchedPayoutPremium < 1 && !isFormDisabled && !isEditMode && (
                  <p className="mt-1 text-xs font-medium text-amber-500">Low premium — below 1% may not incentivize early payouts.</p>
                )}
                {!errors.payout_premium_percent && watchedPayoutPremium > 10 && !isFormDisabled && !isEditMode && (
                  <p className="mt-1 text-xs font-medium text-amber-500">High premium — above 10% is unusual for most chit funds.</p>
                )}
              </div>

              {/* Duration for Variable Chit */}
              <div
                onClick={isEditMode ? () => showLockedFieldMessage("Duration", "core") : undefined}
                className={isEditMode ? "cursor-not-allowed" : ""}
              >
                <label
                  htmlFor="duration_months"
                  className="block text-lg font-medium text-text-secondary mb-1"
                >
                  Duration
                </label>
                <div className="relative flex items-center">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Clock className="w-5 h-5 text-text-secondary" />
                  </span>
                  <div className="absolute left-10 h-6 w-px bg-border"></div>
                  <input
                    {...register("duration_months", { setValueAs: v => v === '' ? undefined : Number(v) })}
                    type="text"
                    inputMode="numeric"
                    id="duration_months"
                    autoComplete="on"
                    enterKeyHint="next"
                    maxLength={3}
                    className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${isEditMode ? "pointer-events-none" : ""} ${errors.duration_months ? "border-red-500" : "border-border"
                      }`}
                    placeholder="20"
                    disabled={isFormDisabled || isEditMode}
                    onKeyDown={handleKeyDown}
                    onFocus={onDurationChange}
                    onInput={(e) => { e.target.value = parseNumber(e.target.value); }}
                  />
                </div>
                {errors.duration_months && (
                  <p className="mt-1 text-xs font-medium text-red-500">
                    {errors.duration_months.message}
                  </p>
                )}
                {!errors.duration_months && watchedDuration > 0 && watchedDuration < 15 && !isFormDisabled && !isEditMode && (
                  <p className="mt-1 text-xs font-medium text-amber-500">Short duration — less than 15 months may not yield sufficient returns.</p>
                )}
                {!errors.duration_months && watchedDuration > 36 && !isFormDisabled && !isEditMode && (
                  <p className="mt-1 text-xs font-medium text-amber-500">Long duration — over 36 months increases risk of member dropouts.</p>
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
              <div
                onClick={isEditMode ? () => showLockedFieldMessage("Foreman Commission", "financial") : undefined}
                className={isEditMode ? "cursor-not-allowed" : ""}
              >
                <label
                  htmlFor="foreman_commission_percent"
                  className="block text-lg font-medium text-text-secondary mb-1"
                >
                  Foreman Commission
                </label>
                <div className="relative flex items-center">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Percent className="w-5 h-5 text-text-secondary" />
                  </span>
                  <div className="absolute left-10 h-6 w-px bg-border"></div>
                  <input
                    {...register("foreman_commission_percent", { setValueAs: v => v === '' ? undefined : Number(v) })}
                    type="text"
                    inputMode="decimal"
                    id="foreman_commission_percent"
                    autoComplete="on"
                    enterKeyHint="next"
                    maxLength={6}
                    className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${isEditMode ? "pointer-events-none" : ""} ${errors.foreman_commission_percent ? "border-red-500" : "border-border"
                      }`}
                    placeholder="1"
                    disabled={isFormDisabled || isEditMode}
                    onKeyDown={handleKeyDown}
                    onInput={(e) => { e.target.value = parseDecimalNumber(e.target.value); }}
                  />
                </div>
                {errors.foreman_commission_percent && (
                  <p className="mt-1 text-xs font-medium text-red-500">
                    {errors.foreman_commission_percent.message}
                  </p>
                )}
                {!errors.foreman_commission_percent && watchedForemanCommission > 0 && watchedForemanCommission < 1 && !isFormDisabled && !isEditMode && (
                  <p className="mt-1 text-xs font-medium text-amber-500">Low commission — below 1% may not cover operational costs.</p>
                )}
                {!errors.foreman_commission_percent && watchedForemanCommission > 10 && !isFormDisabled && !isEditMode && (
                  <p className="mt-1 text-xs font-medium text-amber-500">High commission — above 10% is unusual for most chit funds.</p>
                )}
              </div>

              {/* Duration for Auction Chit */}
              <div
                onClick={isEditMode ? () => showLockedFieldMessage("Duration", "core") : undefined}
                className={isEditMode ? "cursor-not-allowed" : ""}
              >
                <label
                  htmlFor="duration_months"
                  className="block text-lg font-medium text-text-secondary mb-1"
                >
                  Duration
                </label>
                <div className="relative flex items-center">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Clock className="w-5 h-5 text-text-secondary" />
                  </span>
                  <div className="absolute left-10 h-6 w-px bg-border"></div>
                  <input
                    {...register("duration_months", { setValueAs: v => v === '' ? undefined : Number(v) })}
                    type="text"
                    inputMode="numeric"
                    id="duration_months"
                    autoComplete="on"
                    enterKeyHint="next"
                    maxLength={3}
                    className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${isEditMode ? "pointer-events-none" : ""} ${errors.duration_months ? "border-red-500" : "border-border"
                      }`}
                    placeholder="20"
                    disabled={isFormDisabled || isEditMode}
                    onKeyDown={handleKeyDown}
                    onFocus={onDurationChange}
                    onInput={(e) => { e.target.value = parseNumber(e.target.value); }}
                  />
                </div>
                {errors.duration_months && (
                  <p className="mt-1 text-xs font-medium text-red-500">
                    {errors.duration_months.message}
                  </p>
                )}
                {!errors.duration_months && watchedDuration > 0 && watchedDuration < 15 && !isFormDisabled && !isEditMode && (
                  <p className="mt-1 text-xs font-medium text-amber-500">Short duration — less than 15 months may not yield sufficient returns.</p>
                )}
                {!errors.duration_months && watchedDuration > 36 && !isFormDisabled && !isEditMode && (
                  <p className="mt-1 text-xs font-medium text-amber-500">Long duration — over 36 months increases risk of member dropouts.</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* --- DATES --- */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div
            onClick={(isEditMode && hasActiveOperations) ? () => showLockedFieldMessage("Start Date", "active") : undefined}
            className={(isEditMode && hasActiveOperations) ? "cursor-not-allowed" : ""}
          >
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
                  onChange={(e) => {
                    field.onChange(e);
                    // Trigger end_date validation when start_date changes (cross-field)
                    // Only trigger if end_date already has a value to avoid premature 'required' errors
                    if (trigger && watchedEndDate) {
                      setTimeout(() => trigger("end_date"), 0);
                    }
                  }}
                  disabled={isFormDisabled || (isEditMode && hasActiveOperations)}
                  className={errors.start_date ? "border-red-500" : ""}
                  onFocus={onStartDateChange}
                />
              )}
            />
            {errors.start_date && (
              <p className="mt-1 text-xs font-medium text-red-500">
                {errors.start_date.message}
              </p>
            )}
            {!errors.start_date && watchedStartDate && watchedStartDate.match(/^\d{4}-\d{2}$/) && !isFormDisabled && !(isEditMode && hasActiveOperations) && (() => {
              const [year, month] = watchedStartDate.split("-").map(Number);

              // Skip warning if date is outside error validation range (those will show errors)
              if (year < 2000 || (year === 2000 && month < 1)) return null;
              if (year > 2999 || (year === 2999 && month > 12)) return null;
              if (month < 1 || month > 12) return null;

              const startDate = new Date(year, month - 1, 1);
              const today = new Date();
              const threeYearsAgo = new Date(today.getFullYear() - 3, today.getMonth(), 1);
              const threeYearsFromNow = new Date(today.getFullYear() + 3, today.getMonth(), 1);

              if (startDate < threeYearsAgo) {
                return <p className="mt-1 text-xs font-medium text-amber-500">Past start — over 3 years ago, ensure back payments are accounted for.</p>;
              } else if (startDate >= threeYearsFromNow) {
                return <p className="mt-1 text-xs font-medium text-amber-500">Far future — starting more than 3 years from now.</p>;
              }
              return null;
            })()}
          </div>
          <div
            onClick={(isEditMode && hasActiveOperations) ? () => showLockedFieldMessage("End Date", "active") : undefined}
            className={(isEditMode && hasActiveOperations) ? "cursor-not-allowed" : ""}
          >
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
                  onChange={(e) => {
                    field.onChange(e);
                    // Trigger start_date validation when end_date changes (cross-field)
                    // Only trigger if start_date already has a value to avoid premature 'required' errors
                    if (trigger && watchedStartDate) {
                      setTimeout(() => trigger("start_date"), 0);
                    }
                  }}
                  disabled={isFormDisabled || (isEditMode && hasActiveOperations)}
                  className={errors.end_date ? "border-red-500" : ""}
                  onFocus={onEndDateChange}
                />
              )}
            />
            {errors.end_date && (
              <p className="mt-1 text-xs font-medium text-red-500">
                {errors.end_date.message}
              </p>
            )}
            {!errors.end_date && watchedEndDate && watchedEndDate.match(/^\d{4}-\d{2}$/) && !isFormDisabled && !(isEditMode && hasActiveOperations) && (() => {
              const [year, month] = watchedEndDate.split("-").map(Number);

              // Skip warning if date is outside error validation range (those will show errors)
              if (year < 2000 || (year === 2000 && month < 1)) return null;
              if (year > 2999 || (year === 2999 && month > 12)) return null;
              if (month < 1 || month > 12) return null;

              const endDate = new Date(year, month - 1, 1);
              const today = new Date();
              const threeYearsAgo = new Date(today.getFullYear() - 3, today.getMonth(), 1);
              const threeYearsFromNow = new Date(today.getFullYear() + 3, today.getMonth(), 1);

              if (endDate < threeYearsAgo) {
                return <p className="mt-1 text-xs font-medium text-amber-500">Past end — this chit may have already concluded.</p>;
              } else if (endDate >= threeYearsFromNow) {
                return <p className="mt-1 text-xs font-medium text-amber-500">Far future — ending more than 3 years from now.</p>;
              }
              return null;
            })()}
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
                {...register("collection_day", { setValueAs: v => v === '' ? undefined : Number(v) })}
                type="text"
                inputMode="numeric"
                id="collection_day"
                autoComplete="on"
                enterKeyHint="next"
                maxLength={2}
                className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${errors.collection_day ? "border-red-500" : "border-border"
                  }`}
                placeholder="5"
                disabled={isFormDisabled}
                onKeyDown={handleKeyDown}
                onInput={(e) => { e.target.value = parseNumber(e.target.value); }}
                onChange={(e) => {
                  // Call RHF's onChange first to preserve onTouched validation behavior
                  register("collection_day").onChange(e);
                  // Then trigger payout_day validation (cross-field)
                  // Only trigger if payout_day already has a value to avoid premature 'required' errors
                  if (trigger && watchedPayoutDay) {
                    setTimeout(() => trigger("payout_day"), 0);
                  }
                }}
              />
            </div>
            {errors.collection_day && (
              <p className="mt-1 text-xs font-medium text-red-500">
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
                {...register("payout_day", { setValueAs: v => v === '' ? undefined : Number(v) })}
                type="text"
                inputMode="numeric"
                id="payout_day"
                autoComplete="on"
                enterKeyHint="next"
                maxLength={2}
                className={`w-full pl-12 pr-4 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${errors.payout_day ? "border-red-500" : "border-border"
                  }`}
                placeholder="10"
                disabled={isFormDisabled}
                onKeyDown={handleKeyDown}
                onInput={(e) => { e.target.value = parseNumber(e.target.value); }}
                onChange={(e) => {
                  // Call RHF's onChange first to preserve onTouched validation behavior
                  register("payout_day").onChange(e);
                  // Then trigger collection_day validation (cross-field)
                  // Only trigger if collection_day already has a value to avoid premature 'required' errors
                  if (trigger && watchedCollectionDay) {
                    setTimeout(() => trigger("collection_day"), 0);
                  }
                }}
              />
            </div>
            {errors.payout_day && (
              <p className="mt-1 text-xs font-medium text-red-500">
                {errors.payout_day.message}
              </p>
            )}

            {!errors.payout_day && watchedCollectionDay > 0 && watchedPayoutDay > 0 && (watchedPayoutDay - watchedCollectionDay) > 0 && (watchedPayoutDay - watchedCollectionDay) <= 2 && !isFormDisabled && (
              <p className="mt-1 text-xs font-medium text-amber-500">Short gap — only {watchedPayoutDay - watchedCollectionDay} day{watchedPayoutDay - watchedCollectionDay > 1 ? 's' : ''} after collection, allow more processing time.</p>
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

          {/* Notes container with toolbar */}
          <div className="relative">
            {/* Toolbar */}
            <NotesToolbar
              onInsert={handleNotesInsert}
              onFullscreen={() => setIsNotesFullscreen(true)}
              draftStatus={draftStatus}
              isCollapsed={true}
              disabled={isFormDisabled}
            />

            {/* Textarea container */}
            <div className="relative">
              {/* --- SCROLL SHADOWS --- */}
              {showTopShadow && (
                <div className="absolute top-[1px] left-0 right-0 h-4 bg-gradient-to-b from-text-primary/10 to-transparent pointer-events-none z-20" />
              )}

              <textarea
                {...notesRegisterRest}
                ref={(e) => {
                  notesRegisterRef(e);
                  notesRef.current = e;
                }}
                onChange={handleNotesChange}
                onBlur={handleNotesBlur}
                onFocus={handleNotesFocus}
                onScroll={handleNotesScroll}
                id="notes"
                autoComplete="off"
                maxLength={1000000}
                className={`w-full px-4 pt-3 pb-3 text-base bg-background-secondary border border-t-0 rounded-b-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed resize-none h-[148px] overflow-y-auto ${errors.notes ? "border-red-500" : "border-border"}`}
                autoCapitalize="sentences"
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

              {/* --- SCROLL SHADOWS --- */}
              {showBottomShadow && (
                <div className="absolute bottom-[2px] left-0 right-0 h-4 bg-gradient-to-t from-text-primary/10 to-transparent pointer-events-none z-20 rounded-b-md" />
              )}
            </div>
          </div>



          {/* Error message and character counter row */}
          {(errors.notes || isNotesFocused) && (
            <div className="flex justify-between items-center mt-1">
              {/* Error on left */}
              <span className="text-xs font-medium text-red-500">
                {errors.notes ? errors.notes.message : ""}
              </span>
              {/* Character counter on right - only when focused */}
              {isNotesFocused && (
                <span
                  className={`text-xs font-medium transition-colors duration-200 ${(watchedNotes?.length || 0) >= 1000000
                    ? "text-red-500"
                    : (watchedNotes?.length || 0) >= 900000
                      ? "text-amber-500"
                      : "text-text-tertiary"
                    }`}
                >
                  {watchedNotes?.length || 0}/1,000,000
                </span>
              )}
            </div>
          )}
        </div>

        {/* Notes Full Screen Modal */}
        <NotesFullScreenModal
          isOpen={isNotesFullscreen}
          onClose={() => setIsNotesFullscreen(false)}
          value={watchedNotes || ""}
          onChange={(newValue) => setValue("notes", newValue, { shouldDirty: true, shouldValidate: true })}
          onInsert={handleNotesInsert}
          draftStatus={draftStatus}
          maxLength={1000000}
          disabled={isFormDisabled}
        />
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
  hasActiveOperations: PropTypes.bool,
  setValue: PropTypes.func,
  setError: PropTypes.func,
  clearErrors: PropTypes.func,
  trigger: PropTypes.func,
  chitId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onEnterKeyOnLastInput: PropTypes.func,
  onNameValid: PropTypes.func,
  onNameInvalid: PropTypes.func,
  onSizeChange: PropTypes.func,
  onDurationChange: PropTypes.func,
  onStartDateChange: PropTypes.func,
  onEndDateChange: PropTypes.func,
  onShowLockedFieldWarning: PropTypes.func,
};

export default ChitDetailsForm;
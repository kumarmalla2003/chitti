// frontend/src/components/ui/CustomDateInput.jsx

import { useRef, useLayoutEffect } from "react";
import { FiCalendar } from "react-icons/fi";

// Helper to format YYYY-MM-DD to DD/MM/YYYY
const toDisplayFormat = (isoDate) => {
  if (!isoDate || !isoDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return "";
  }
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
};

const CustomDateInput = ({ name, value, onChange, disabled, required }) => {
  const hiddenInputRef = useRef(null);
  const textInputRef = useRef(null); // <--- Ref for visible input

  // We use a simplified cursor tracker here that specifically cares about digits
  const cursorState = useRef({ position: 0, digitCount: 0, capture: false });

  const handleTextChange = (e) => {
    const input = e.target;

    // 1. Capture Cursor State relative to Digits
    const selectionStart = input.selectionStart;
    const valBeforeCursor = input.value.slice(0, selectionStart);
    const digitsBeforeCursor = (valBeforeCursor.match(/\d/g) || []).length;

    cursorState.current = {
      capture: true,
      digitCount: digitsBeforeCursor,
    };

    let inputValue = e.target.value.replace(/[^0-9/]/g, "");
    const displayValue = value.match(/^\d{4}-\d{2}-\d{2}$/)
      ? toDisplayFormat(value)
      : value;

    // Smart Logic: Only add slashes if we are typing forward (length increased)
    // and we are at the specific positions
    const isTyping = inputValue.length > displayValue.length;

    if (isTyping) {
      // Automatically add slashes if typing numbers
      if (inputValue.length === 2) inputValue += "/";
      if (inputValue.length === 5) inputValue += "/";
    }

    // Strict sanitization for max length
    if (inputValue.length > 10) {
      inputValue = inputValue.slice(0, 10);
    }

    // Convert DD/MM/YYYY to YYYY-MM-DD for internal state
    if (inputValue.length === 10) {
      const [day, month, year] = inputValue.split("/");
      if (
        parseInt(day, 10) > 0 &&
        parseInt(day, 10) <= 31 &&
        parseInt(month, 10) > 0 &&
        parseInt(month, 10) <= 12 &&
        year.length === 4
      ) {
        onChange({ target: { name, value: `${year}-${month}-${day}` } });
      } else {
        onChange({ target: { name, value: inputValue } });
      }
    } else {
      onChange({ target: { name, value: inputValue } });
    }
  };

  // 2. Restore Cursor
  useLayoutEffect(() => {
    if (cursorState.current.capture && textInputRef.current) {
      const input = textInputRef.current;
      const targetDigits = cursorState.current.digitCount;
      const currentVal = input.value;

      let foundDigits = 0;
      let newPos = 0;

      for (let i = 0; i < currentVal.length; i++) {
        if (/\d/.test(currentVal[i])) {
          foundDigits++;
        }
        if (foundDigits === targetDigits) {
          newPos = i + 1;
          // If the NEXT character is a slash, jump over it
          if (currentVal[i + 1] === "/") {
            newPos += 1;
          }
          break;
        }
      }

      // Handle case where we deleted everything or are at start
      if (targetDigits === 0) newPos = 0;

      input.setSelectionRange(newPos, newPos);
      cursorState.current.capture = false;
    }
  }, [value]);

  const handlePickerChange = (e) => {
    onChange({ target: { name, value: e.target.value } });
  };

  const handleIconClick = () => {
    try {
      hiddenInputRef.current?.showPicker();
    } catch (error) {
      console.error("showPicker() not supported", error);
    }
  };

  const getDisplayValue = () => {
    if (value && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return toDisplayFormat(value);
    }
    return value;
  };

  return (
    <div className="relative flex items-center">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <FiCalendar className="w-5 h-5 text-text-secondary" />
      </span>
      <div className="absolute left-10 h-6 w-px bg-border pointer-events-none"></div>

      <input
        ref={textInputRef} // <--- Attach Ref
        type="text"
        id={name}
        name={name}
        value={getDisplayValue()}
        onChange={handleTextChange}
        className="w-full pl-12 pr-10 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
        disabled={disabled}
        placeholder="DD/MM/YYYY"
        required={required}
        maxLength="10"
        inputMode="numeric"
      />

      <span className="absolute inset-y-0 right-0 flex items-center pr-3">
        <div
          className={`p-2 rounded-full bg-background-tertiary transition-all duration-200 ${
            !disabled
              ? "hover:bg-accent hover:text-white cursor-pointer"
              : "opacity-50 cursor-not-allowed"
          }`}
          onClick={() => !disabled && handleIconClick()}
        >
          <FiCalendar className="w-5 h-5" />
        </div>
      </span>

      <input
        type="date"
        ref={hiddenInputRef}
        value={value.match(/^\d{4}-\d{2}-\d{2}$/) ? value : ""}
        onChange={handlePickerChange}
        className="absolute w-0 h-0 opacity-0"
        tabIndex="-1"
        aria-hidden="true"
      />
    </div>
  );
};

export default CustomDateInput;

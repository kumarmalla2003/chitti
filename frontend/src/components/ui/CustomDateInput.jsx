// frontend/src/components/ui/CustomDateInput.jsx

import { useRef } from "react";
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

  const handleTextChange = (e) => {
    let inputValue = e.target.value.replace(/[^0-9/]/g, "");
    const displayValue = value.match(/^\d{4}-\d{2}-\d{2}$/)
      ? toDisplayFormat(value)
      : value;

    // Automatically add slashes
    if (inputValue.length === 2 && displayValue.length === 1) {
      inputValue += "/";
    } else if (inputValue.length === 5 && displayValue.length === 4) {
      inputValue += "/";
    }

    // Handle backspace
    if (inputValue.length === 2 && displayValue.length === 3) {
      inputValue = inputValue.slice(0, 1);
    } else if (inputValue.length === 5 && displayValue.length === 6) {
      inputValue = inputValue.slice(0, 4);
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
        onChange({ target: { name, value: inputValue } }); // Pass invalid/partial
      }
    } else {
      onChange({ target: { name, value: inputValue } }); // Pass partial input
    }
  };

  const handlePickerChange = (e) => {
    onChange({ target: { name, value: e.target.value } });
  };

  const handleIconClick = () => {
    try {
      hiddenInputRef.current?.showPicker();
    } catch (error) {
      // Fallback for browsers that don't support showPicker() on date inputs
      console.error("showPicker() not supported", error);
    }
  };

  // Format the YYYY-MM-DD value back to DD/MM/YYYY for display
  const getDisplayValue = () => {
    if (value && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return toDisplayFormat(value);
    }
    return value; // Show partial/invalid input as is
  };

  return (
    <div className="relative flex items-center">
      {/* Left Icon */}
      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <FiCalendar className="w-5 h-5 text-text-secondary" />
      </span>
      <div className="absolute left-10 h-6 w-px bg-border pointer-events-none"></div>

      {/* Visible Text Input */}
      <input
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

      {/* Right Clickable Icon */}
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

      {/* Hidden Date Picker */}
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

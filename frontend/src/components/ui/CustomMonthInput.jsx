// frontend/src/components/ui/CustomMonthInput.jsx

import { useRef } from "react";
import { FiCalendar } from "react-icons/fi";

const CustomMonthInput = ({
  name,
  value,
  onChange,
  disabled,
  required,
  enterKeyHint = "next",
}) => {
  const hiddenInputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const focusable = Array.from(
        document.querySelectorAll(
          "input:not([disabled]):not([tabindex='-1']), select, textarea, button"
        )
      );
      const index = focusable.indexOf(e.target);
      if (index !== -1 && index + 1 < focusable.length) {
        const nextElement = focusable[index + 1];
        // Using a timeout of 0 helps ensure the browser has time to update the
        // virtual keyboard's enter key hint after the focus changes.
        setTimeout(() => nextElement.focus(), 0);
      }
    }
  };

  const handleTextChange = (e) => {
    let inputValue = e.target.value.replace(/[^0-9/]/g, "");

    // Automatically add slash
    if (inputValue.length === 2 && !value.endsWith("/")) {
      inputValue += "/";
    }

    // Remove slash if user deletes past it
    if (inputValue.length === 2 && value.endsWith("/")) {
      inputValue = inputValue.slice(0, 1);
    }

    // Convert MM/YYYY to YYYY-MM for internal state
    if (inputValue.length === 7) {
      const [month, year] = inputValue.split("/");
      // Basic validation
      if (parseInt(month, 10) > 0 && parseInt(month, 10) <= 12) {
        onChange({ target: { name, value: `${year}-${month}` } });
      } else {
        // Handle invalid month by just showing the typed value
        onChange({ target: { name, value: inputValue } });
      }
    } else {
      onChange({ target: { name, value: inputValue } }); // Pass partial input
    }
  };

  const handlePickerChange = (e) => {
    onChange({ target: { name, value: e.target.value } });
  };

  const handleIconClick = () => {
    hiddenInputRef.current?.showPicker();
  };

  // Format the YYYY-MM value back to MM/YYYY for display
  const displayValue = () => {
    if (value && value.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = value.split("-");
      return `${month}/${year}`;
    }
    return value; // Show partial input as is
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
        value={displayValue()}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        className="w-full pl-12 pr-10 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
        disabled={disabled}
        placeholder="MM/YYYY"
        required={required}
        maxLength="7"
        inputMode="numeric"
        enterKeyHint={enterKeyHint}
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

      {/* Hidden Month Picker */}
      <input
        type="month"
        ref={hiddenInputRef}
        onChange={handlePickerChange}
        className="absolute w-0 h-0 opacity-0"
        tabIndex="-1"
        aria-hidden="true"
      />
    </div>
  );
};

export default CustomMonthInput;

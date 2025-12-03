// frontend/src/components/ui/CustomMonthInput.jsx

import { useRef, useLayoutEffect } from "react";
import { Calendar } from "lucide-react";

const CustomMonthInput = ({ name, value, onChange, disabled, required }) => {
  const hiddenInputRef = useRef(null);
  const textInputRef = useRef(null); // <--- Ref
  const cursorState = useRef({ capture: false, digitCount: 0 });

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
        setTimeout(() => nextElement.focus(), 0);
      }
    }
  };

  const handleTextChange = (e) => {
    const input = e.target;

    // 1. Capture Cursor
    const selectionStart = input.selectionStart;
    const valBeforeCursor = input.value.slice(0, selectionStart);
    const digitsBeforeCursor = (valBeforeCursor.match(/\d/g) || []).length;

    cursorState.current = {
      capture: true,
      digitCount: digitsBeforeCursor,
    };

    let inputValue = e.target.value.replace(/[^0-9/]/g, "");
    const currentDisplay = displayValue();
    const isTyping =
      inputValue.length > currentDisplay.replace(/[^0-9]/g, "").length;

    // Auto slash logic
    if (isTyping && inputValue.length === 2) {
      inputValue += "/";
    }

    if (inputValue.length > 7) inputValue = inputValue.slice(0, 7);

    // Convert MM/YYYY to YYYY-MM
    if (inputValue.length === 7) {
      const [month, year] = inputValue.split("/");
      if (parseInt(month, 10) > 0 && parseInt(month, 10) <= 12) {
        onChange({ target: { name, value: `${year}-${month}` } });
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
          // Jump over slash
          if (currentVal[i + 1] === "/") {
            newPos += 1;
          }
          break;
        }
      }
      if (targetDigits === 0) newPos = 0;

      input.setSelectionRange(newPos, newPos);
      cursorState.current.capture = false;
    }
  }, [value]);

  const handlePickerChange = (e) => {
    onChange({ target: { name, value: e.target.value } });
  };

  const handleIconClick = () => {
    hiddenInputRef.current?.showPicker();
  };

  const displayValue = () => {
    if (value && value.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = value.split("-");
      return `${month}/${year}`;
    }
    return value;
  };

  return (
    <div className="relative flex items-center">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Calendar className="w-5 h-5 text-text-secondary" />
      </span>
      <div className="absolute left-10 h-6 w-px bg-border pointer-events-none"></div>

      <input
        ref={textInputRef} // <--- Attach Ref
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
          <Calendar className="w-5 h-5" />
        </div>
      </span>

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

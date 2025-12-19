// frontend/src/components/ui/CustomMonthInput.jsx

import { useRef, useLayoutEffect } from "react";
import { Calendar } from "lucide-react";

const CustomMonthInput = ({ name, value, onChange, onBlur, disabled, required, onFocus, className, min = "2000-01", max = "2999-12" }) => {
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

    // 1. Capture Cursor position
    const selectionStart = input.selectionStart;
    const valBeforeCursor = input.value.slice(0, selectionStart);
    const digitsBeforeCursor = (valBeforeCursor.match(/\d/g) || []).length;

    let inputValue = e.target.value.replace(/[^0-9/]/g, "");
    const currentDisplay = displayValue();
    const currentDigitCount = (currentDisplay.replace(/[^0-9]/g, "")).length;
    const newDigitCount = (inputValue.replace(/[^0-9]/g, "")).length;
    const isTyping = newDigitCount > currentDigitCount;

    cursorState.current = {
      capture: true,
      digitCount: digitsBeforeCursor,
      isTyping: isTyping,
      rawPosition: selectionStart, // Store raw position for backspace
      slashPosition: inputValue.indexOf("/"), // Track where slash is
    };

    // Auto slash logic (only when typing and no slash exists yet)
    if (isTyping && inputValue.length === 2 && !inputValue.includes("/")) {
      inputValue += "/";
      cursorState.current.slashPosition = 2;
    }

    // Auto-insert slash at position 2 if user has 6 digits without slash
    if (inputValue.length === 6 && !inputValue.includes("/") && /^\d{6}$/.test(inputValue)) {
      inputValue = inputValue.slice(0, 2) + "/" + inputValue.slice(2);
      cursorState.current.slashPosition = 2;
    }

    if (inputValue.length > 7) inputValue = inputValue.slice(0, 7);

    // Convert MM/YYYY to YYYY-MM only when format is exactly correct (2 digits + / + 4 digits)
    const mmYyyyPattern = /^(\d{2})\/(\d{4})$/;
    const match = inputValue.match(mmYyyyPattern);
    if (match) {
      const [, month, year] = match;
      // Convert to YYYY-MM format so schema can validate properly
      onChange({ target: { name, value: `${year}-${month}` } });
    } else {
      onChange({ target: { name, value: inputValue } });
    }
  };

  // 2. Restore Cursor
  useLayoutEffect(() => {
    if (cursorState.current.capture && textInputRef.current) {
      const input = textInputRef.current;
      const targetDigits = cursorState.current.digitCount;
      const isTyping = cursorState.current.isTyping;
      const rawPosition = cursorState.current.rawPosition;
      const currentVal = input.value;

      let newPos;

      if (isTyping) {
        // When typing, use digit-counting to handle auto-slash correctly
        let foundDigits = 0;
        newPos = 0;

        for (let i = 0; i < currentVal.length; i++) {
          if (/\d/.test(currentVal[i])) {
            foundDigits++;
          }
          if (foundDigits === targetDigits) {
            newPos = i + 1;
            // Jump over slash only when slash is at correct position (after 2 month digits)
            if (currentVal[i + 1] === "/" && i + 1 === 2) {
              newPos += 1;
            }
            break;
          }
        }
        if (targetDigits === 0) newPos = 0;
      } else {
        // When backspacing/deleting, use the raw cursor position
        // Clamp to current value length in case value got shorter
        newPos = Math.min(rawPosition, currentVal.length);
      }

      input.setSelectionRange(newPos, newPos);
      cursorState.current.capture = false;
    }
  }, [value]);

  const handlePickerChange = (e) => {
    // Trigger onFocus first to set the tracking ref (for date sync)
    if (onFocus) {
      onFocus({ target: { name } });
    }
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
        onFocus={onFocus}
        onBlur={onBlur}
        enterKeyHint="next"
        autoComplete="on"
        className={`w-full pl-12 pr-10 py-3 text-base bg-background-secondary border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed ${disabled ? "pointer-events-none" : ""} ${className || "border-border"}`}
        disabled={disabled}
        placeholder="MM/YYYY"
        required={required}
        maxLength="7"
        inputMode="numeric"
      />

      <span className="absolute inset-y-0 right-0 flex items-center pr-3">
        <div
          className={`p-2 rounded-full bg-background-tertiary transition-all duration-200 ${!disabled
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
        min={min}
        max={max}
        className="absolute w-0 h-0 opacity-0"
        tabIndex="-1"
        aria-hidden="true"
      />
    </div>
  );
};

export default CustomMonthInput;

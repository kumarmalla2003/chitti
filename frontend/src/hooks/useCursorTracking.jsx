import { useLayoutEffect, useRef } from "react";

/**
 * A hook to maintain cursor position in controlled inputs with formatting.
 * It tracks the cursor relative to "significant characters" (like digits) rather than raw index.
 *
 * @param {RefObject} inputRef - The ref attached to the input element
 * @param {string|number} value - The formatted value from props/state
 * @param {RegExp} significantCharRegex - Regex to identify characters to count (default: digits)
 */
const useCursorTracking = (inputRef, value, significantCharRegex = /\d/) => {
  const cursorState = useRef({
    digitCountBeforeCursor: 0,
    capture: false,
  });

  // 1. Capture phase: Call this inside your onChange handler BEFORE passing the event up
  const trackCursor = (e) => {
    const input = e.target;
    const cursorPosition = input.selectionStart;
    const textBeforeCursor = input.value.slice(0, cursorPosition);

    // Count how many "significant" characters (e.g., digits) are before the cursor
    let count = 0;
    for (const char of textBeforeCursor) {
      if (significantCharRegex.test(char)) {
        count++;
      }
    }

    cursorState.current = {
      digitCountBeforeCursor: count,
      capture: true,
    };
  };

  // 2. Restore phase: Runs synchronously after the DOM updates with the new formatted value
  useLayoutEffect(() => {
    if (
      cursorState.current.capture &&
      inputRef.current &&
      document.activeElement === inputRef.current
    ) {
      const input = inputRef.current;
      const targetCount = cursorState.current.digitCountBeforeCursor;
      const currentValue = input.value;

      let currentCount = 0;
      let newCursorPos = 0;

      // Scan the new string to find where that "targetCount"-th digit is now
      for (let i = 0; i < currentValue.length; i++) {
        if (significantCharRegex.test(currentValue[i])) {
          currentCount++;
        }
        if (
          currentCount === targetCount &&
          significantCharRegex.test(currentValue[i])
        ) {
          // We found the last digit we were behind. The cursor belongs right after it.
          newCursorPos = i + 1;
          break;
        }
        // Edge case: If we are at the very start (target=0), position is 0
        if (targetCount === 0) {
          newCursorPos = 0;
          break;
        }
      }

      // Safety: If we couldn't find the digit (e.g. deleted), default to current or end
      if (targetCount > 0 && currentCount < targetCount) {
        // We deleted the digit we were tracking; find the nearest previous one
        newCursorPos = currentValue.length;
        // Or perform a more complex reverse search, but end is usually safe for deletion
      }

      input.setSelectionRange(newCursorPos, newCursorPos);
      cursorState.current.capture = false; // Reset
    }
  }, [value, significantCharRegex]); // Run whenever the value updates

  return trackCursor;
};

export default useCursorTracking;

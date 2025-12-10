// frontend/src/hooks/useTableKeyboardNavigation.js

import { useState, useEffect, useCallback } from "react";

/**
 * useTableKeyboardNavigation - Custom hook for keyboard navigation in table views.
 *
 * @param {Object} options
 * @param {React.RefObject} options.tableRef - Ref to the table container element
 * @param {Array} options.items - Array of items being displayed
 * @param {string} options.viewMode - Current view mode ("table" or "card")
 * @param {Function} options.onNavigate - Callback when Enter is pressed on a row (receives item)
 * @returns {Object} { focusedRowIndex, setFocusedRowIndex, resetFocus }
 */
const useTableKeyboardNavigation = ({
    tableRef,
    items,
    viewMode,
    onNavigate,
}) => {
    const [focusedRowIndex, setFocusedRowIndex] = useState(-1);

    // Reset focus when items change
    const resetFocus = useCallback(() => {
        setFocusedRowIndex(-1);
    }, []);

    // Keyboard navigation handler
    const handleKeyDown = useCallback(
        (e) => {
            if (viewMode !== "table" || items.length === 0) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setFocusedRowIndex((prev) =>
                    prev < items.length - 1 ? prev + 1 : prev
                );
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setFocusedRowIndex((prev) => (prev > 0 ? prev - 1 : 0));
            } else if (e.key === "Enter" && focusedRowIndex >= 0) {
                e.preventDefault();
                onNavigate(items[focusedRowIndex]);
            }
        },
        [viewMode, items, focusedRowIndex, onNavigate]
    );

    // Attach event listener to table element
    useEffect(() => {
        const tableEl = tableRef?.current;
        if (tableEl) {
            tableEl.addEventListener("keydown", handleKeyDown);
            return () => tableEl.removeEventListener("keydown", handleKeyDown);
        }
    }, [tableRef, handleKeyDown]);

    return {
        focusedRowIndex,
        setFocusedRowIndex,
        resetFocus,
    };
};

export default useTableKeyboardNavigation;

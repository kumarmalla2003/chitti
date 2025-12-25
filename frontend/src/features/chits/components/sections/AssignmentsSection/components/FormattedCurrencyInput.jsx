// frontend/src/features/chits/components/sections/AssignmentsSection/components/FormattedCurrencyInput.jsx

import { useState, useEffect, useRef } from "react";
import { IndianRupee, Loader2 } from "lucide-react";

// Format number with Indian locale
const formatIndianNumber = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    const num = typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;
    if (isNaN(num)) return "";
    return num.toLocaleString("en-IN");
};

// Parse Indian formatted number to raw number
const parseIndianNumber = (value) => {
    if (!value) return "";
    return value.toString().replace(/,/g, "");
};

/**
 * Formatted Currency Input component for inline table editing
 * Supports vertical tab navigation and per-cell loading state
 */
const FormattedCurrencyInput = ({
    value,
    onChange,
    className = "",
    inputId = "",
    nextInputId = "",
    isLastRow = false,
    onNextPage = null,
    columnPrefix = "",
    onEnterSubmit = null,
    isLoading = false,
}) => {
    const [displayValue, setDisplayValue] = useState(formatIndianNumber(value));
    const inputRef = useRef(null);

    useEffect(() => {
        setDisplayValue(formatIndianNumber(value));
    }, [value]);

    const handleChange = (e) => {
        const raw = parseIndianNumber(e.target.value);
        setDisplayValue(formatIndianNumber(raw));
        onChange(raw);
    };

    const handleFocus = (e) => {
        const len = e.target.value.length;
        setTimeout(() => {
            e.target.setSelectionRange(len, len);
        }, 0);
    };

    const handleKeyDown = (e) => {
        if ((e.key === "Enter" || e.key === "Tab") && !e.shiftKey) {
            e.preventDefault();

            if (onEnterSubmit && e.key === "Enter") {
                onEnterSubmit();
                return;
            }

            const nextInput = document.getElementById(nextInputId);
            if (nextInput) {
                nextInput.focus();
            } else if (isLastRow && onNextPage) {
                onNextPage(() => {
                    setTimeout(() => {
                        const firstInputOnNextPage = document.getElementById(`${columnPrefix}_row_0`);
                        if (firstInputOnNextPage) {
                            firstInputOnNextPage.focus();
                        }
                    }, 100);
                });
            }
        }
    };

    return (
        <div className="relative flex items-center">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
                ) : (
                    <IndianRupee className="w-3.5 h-3.5 text-text-secondary" />
                )}
            </span>
            <input
                ref={inputRef}
                id={inputId}
                type="text"
                inputMode="numeric"
                enterKeyHint="next"
                value={displayValue}
                onChange={handleChange}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className={`w-full pl-7 pr-2 py-1.5 text-sm text-center bg-background-primary border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 ${className}`}
                placeholder="0"
            />
        </div>
    );
};

export default FormattedCurrencyInput;

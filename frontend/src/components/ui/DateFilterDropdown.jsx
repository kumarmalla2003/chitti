// frontend/src/components/ui/DateFilterDropdown.jsx

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const FULL_MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const PRESETS = [
    { value: "today", label: "Today" },
    { value: "this_week", label: "This Week" },
    { value: "this_month", label: "This Month" },
    { value: "last_30_days", label: "Last 30 Days" },
    { value: "this_year", label: "This Year" },
];

/**
 * DateFilterDropdown - A comprehensive date filter with presets, month/year picker, and custom range
 *
 * @param {object} value - Current filter state { type: 'all' | 'preset' | 'month' | 'custom', preset?, month?, year?, startDate?, endDate? }
 * @param {function} onChange - Callback when filter changes
 * @param {function} onCustomRangeClick - Callback when custom range is clicked (opens modal)
 */
const DateFilterDropdown = ({ value = { type: "all" }, onChange, onCustomRangeClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);

    // For month/year picker
    const currentDate = new Date();
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

    // Generate available years (current year and 4 previous years)
    const availableYears = useMemo(() => {
        const years = [];
        const currentYear = new Date().getFullYear();
        for (let i = 0; i < 5; i++) {
            years.push(currentYear - i);
        }
        return years;
    }, []);

    // Calculate dropdown position when opening
    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 8,
                left: rect.left + window.scrollX,
            });
        }
    }, [isOpen]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                triggerRef.current &&
                !triggerRef.current.contains(event.target) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Get display text for the chip
    const getDisplayText = () => {
        if (value.type === "all") return "All Time";
        if (value.type === "preset") {
            const preset = PRESETS.find(p => p.value === value.preset);
            return preset?.label || "All Time";
        }
        if (value.type === "month") {
            return `${MONTHS[value.month]} ${value.year}`;
        }
        if (value.type === "custom" && value.startDate && value.endDate) {
            const start = new Date(value.startDate);
            const end = new Date(value.endDate);
            const startStr = start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
            const endStr = end.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: start.getFullYear() !== end.getFullYear() ? "numeric" : undefined });
            return `${startStr} - ${endStr}`;
        }
        return "All Time";
    };

    const handlePresetSelect = (preset) => {
        onChange({ type: "preset", preset });
        setIsOpen(false);
    };

    const handleMonthSelect = (monthIndex) => {
        onChange({ type: "month", month: monthIndex, year: selectedYear });
        setIsOpen(false);
    };

    const handleAllTime = () => {
        onChange({ type: "all" });
        setIsOpen(false);
    };

    const handleYearChange = (direction) => {
        const minYear = availableYears[availableYears.length - 1];
        const maxYear = availableYears[0];
        if (direction === "prev" && selectedYear > minYear) {
            setSelectedYear(selectedYear - 1);
        } else if (direction === "next" && selectedYear < maxYear) {
            setSelectedYear(selectedYear + 1);
        }
    };

    const handleCustomRange = () => {
        setIsOpen(false);
        onCustomRangeClick?.();
    };

    const isActive = value.type !== "all";
    const isMonthSelected = (monthIndex) =>
        value.type === "month" && value.month === monthIndex && value.year === selectedYear;

    // Chip styles (consistent with existing filter chips)
    const chipBaseClass =
        "appearance-none pl-7 pr-6 py-1 text-xs font-medium rounded-full border transition-colors duration-200 cursor-pointer flex items-center gap-1";
    const chipActiveClass =
        "bg-accent/10 text-accent border-accent";
    const chipInactiveClass =
        "bg-background-tertiary text-text-secondary hover:bg-background-secondary hover:text-text-primary border-border";

    const dropdownAnimations = {
        initial: { opacity: 0, y: -10, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -10, scale: 0.95 },
        transition: { duration: 0.2, ease: "easeOut" },
    };

    return (
        <div ref={triggerRef} className="relative flex-shrink-0">
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`${chipBaseClass} ${isActive ? chipActiveClass : chipInactiveClass}`}
            >
                <Calendar className={`w-3 h-3 absolute left-2 ${isActive ? "text-accent" : "text-text-secondary"}`} />
                <span className="ml-1">{getDisplayText()}</span>
                <ChevronDown className={`w-3 h-3 ml-0.5 ${isActive ? "text-accent" : "text-text-secondary"}`} />
            </button>

            {/* Dropdown Panel - Rendered via Portal */}
            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            ref={dropdownRef}
                            {...dropdownAnimations}
                            style={{
                                position: "absolute",
                                top: dropdownPosition.top,
                                left: dropdownPosition.left,
                            }}
                            className="w-72 bg-background-primary border border-border rounded-lg shadow-xl z-50 overflow-hidden ring-1 ring-black/5"
                        >
                            {/* All Time Option */}
                            <div className="p-2 border-b border-border">
                                <button
                                    type="button"
                                    onClick={handleAllTime}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors cursor-pointer ${value.type === "all"
                                        ? "bg-accent/10 text-accent font-medium"
                                        : "text-text-secondary hover:bg-background-secondary hover:text-text-primary"
                                        }`}
                                >
                                    <span>All Time</span>
                                    {value.type === "all" && <Check className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Quick Filters Section */}
                            <div className="p-3 border-b border-border">
                                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                                    Quick Filters
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {PRESETS.map((preset) => (
                                        <button
                                            key={preset.value}
                                            type="button"
                                            onClick={() => handlePresetSelect(preset.value)}
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${value.type === "preset" && value.preset === preset.value
                                                ? "bg-accent text-white"
                                                : "bg-background-tertiary text-text-secondary hover:bg-background-secondary hover:text-text-primary border border-border"
                                                }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Month/Year Picker Section */}
                            <div className="p-3 border-b border-border">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                        By Month
                                    </p>
                                    {/* Year Navigator */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleYearChange("prev")}
                                            disabled={selectedYear <= availableYears[availableYears.length - 1]}
                                            className="p-1 rounded hover:bg-background-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4 text-text-secondary" />
                                        </button>
                                        <span className="text-sm font-semibold text-text-primary w-12 text-center">
                                            {selectedYear}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleYearChange("next")}
                                            disabled={selectedYear >= availableYears[0]}
                                            className="p-1 rounded hover:bg-background-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronRight className="w-4 h-4 text-text-secondary" />
                                        </button>
                                    </div>
                                </div>

                                {/* Month Grid - 4 columns x 3 rows */}
                                <div className="grid grid-cols-4 gap-1.5">
                                    {MONTHS.map((month, index) => {
                                        const isFutureMonth =
                                            selectedYear === currentDate.getFullYear() && index > currentDate.getMonth();
                                        const isSelected = isMonthSelected(index);

                                        return (
                                            <button
                                                key={month}
                                                type="button"
                                                onClick={() => !isFutureMonth && handleMonthSelect(index)}
                                                disabled={isFutureMonth}
                                                className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${isSelected
                                                    ? "bg-accent text-white"
                                                    : isFutureMonth
                                                        ? "text-text-secondary/40 cursor-not-allowed"
                                                        : "text-text-secondary hover:bg-background-secondary hover:text-text-primary"
                                                    }`}
                                            >
                                                {month}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Custom Range Option */}
                            <div className="p-2">
                                <button
                                    type="button"
                                    onClick={handleCustomRange}
                                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md transition-colors cursor-pointer ${value.type === "custom"
                                        ? "bg-accent/10 text-accent font-medium"
                                        : "text-text-secondary hover:bg-background-secondary hover:text-text-primary"
                                        }`}
                                >
                                    <Calendar className="w-4 h-4" />
                                    <span>Custom Range...</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default DateFilterDropdown;

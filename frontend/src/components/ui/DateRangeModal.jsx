// frontend/src/components/ui/DateRangeModal.jsx

import { useState, useEffect } from "react";
import { X, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "./Button";

/**
 * DateRangeModal - Modal for selecting custom date range
 *
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Callback to close the modal
 * @param {function} onApply - Callback when date range is applied { startDate, endDate }
 * @param {string} initialStartDate - Initial start date (YYYY-MM-DD)
 * @param {string} initialEndDate - Initial end date (YYYY-MM-DD)
 */
const DateRangeModal = ({
    isOpen,
    onClose,
    onApply,
    initialStartDate = "",
    initialEndDate = "",
}) => {
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);
    const [error, setError] = useState("");

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setStartDate(initialStartDate);
            setEndDate(initialEndDate);
            setError("");
        }
    }, [isOpen, initialStartDate, initialEndDate]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    const handleApply = () => {
        setError("");

        if (!startDate) {
            setError("Please select a start date");
            return;
        }
        if (!endDate) {
            setError("Please select an end date");
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            setError("Start date must be before or equal to end date");
            return;
        }

        onApply({ startDate, endDate });
        onClose();
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Get today's date in YYYY-MM-DD format for max attribute
    const today = new Date().toISOString().split("T")[0];

    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
    };

    const modalVariants = {
        hidden: { opacity: 0, scale: 0.95, y: -20 },
        visible: { opacity: 1, scale: 1, y: 0 },
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    onClick={handleBackdropClick}
                >
                    <motion.div
                        className="bg-background-primary border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-accent" />
                                <h2 className="text-lg font-semibold text-text-primary">
                                    Custom Date Range
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-1.5 rounded-full hover:bg-background-secondary transition-colors text-text-secondary hover:text-text-primary"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4">
                            {/* Error Message */}
                            {error && (
                                <div className="p-3 bg-error-bg text-error-accent text-sm rounded-lg">
                                    {error}
                                </div>
                            )}

                            {/* Date Inputs */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* From Date */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-text-secondary">
                                        From
                                    </label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        max={today}
                                        className="w-full px-3 py-2 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
                                    />
                                </div>

                                {/* To Date */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-text-secondary">
                                        To
                                    </label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        max={today}
                                        className="w-full px-3 py-2 bg-background-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Quick Range Presets */}
                            <div className="pt-2">
                                <p className="text-xs text-text-secondary mb-2">Quick select:</p>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { label: "Last 7 days", days: 7 },
                                        { label: "Last 14 days", days: 14 },
                                        { label: "Last 30 days", days: 30 },
                                        { label: "Last 90 days", days: 90 },
                                    ].map(({ label, days }) => (
                                        <button
                                            key={days}
                                            type="button"
                                            onClick={() => {
                                                const end = new Date();
                                                const start = new Date();
                                                start.setDate(start.getDate() - days);
                                                setStartDate(start.toISOString().split("T")[0]);
                                                setEndDate(end.toISOString().split("T")[0]);
                                            }}
                                            className="px-2.5 py-1 text-xs font-medium rounded-full bg-background-tertiary text-text-secondary hover:bg-background-secondary hover:text-text-primary border border-border transition-colors"
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border bg-background-secondary/50">
                            <Button variant="secondary" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleApply}>
                                Apply Filter
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DateRangeModal;

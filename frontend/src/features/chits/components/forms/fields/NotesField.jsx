// frontend/src/features/chits/components/forms/fields/NotesField.jsx

import { useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FileText } from "lucide-react";

/**
 * Helper to convert text to Sentence Case (capitalize first letter of each sentence)
 */
const toSentenceCase = (str) => {
    if (!str) return "";
    return str
        .toLowerCase()
        .replace(/(^\s*\w|[.!?]\s*\w)/g, (match) => match.toUpperCase());
};

const NotesField = ({
    register,
    setValue,
    watchedNotes,
    isFormDisabled,
    onEnterKeyOnLastInput,
}) => {
    // State for notes scroll shadows
    const [showTopShadow, setShowTopShadow] = useState(false);
    const [showBottomShadow, setShowBottomShadow] = useState(false);

    // Refs for notes field
    const notesRef = useRef(null);

    // Extract onChange, onBlur, name, ref from register
    const { ref: notesRegisterRef, onBlur: notesOnBlur, onChange: notesOnChange, ...notesRegisterRest } = register("notes");

    // Effect to handle scroll shadows update on value change
    useEffect(() => {
        if (notesRef.current) {
            handleNotesScroll({ target: notesRef.current });
        }
    }, [watchedNotes]);

    // Handle Note Field Scroll
    const handleNotesScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        setShowTopShadow(scrollTop > 0);
        // Use a small buffer (1px) for float math safety
        setShowBottomShadow(Math.ceil(scrollTop + clientHeight) < scrollHeight - 1);
    };

    // Handle Note Field Focus - Scroll to end, but let browser handle cursor placement
    const handleNotesFocus = (e) => {
        let val = e.target.value;

        // Check if we need to append a newline (if text exists and doesn't end with one)
        if (val && val.length > 0 && !val.endsWith('\n')) {
            const newVal = val + '\n';

            // Update RHF state
            if (setValue) {
                setValue("notes", newVal, { shouldDirty: true });
            }

            // Update UI immediately
            e.target.value = newVal;
            val = newVal;
        }

        // Only scroll to bottom, but DO NOT move cursor
        // This allows users to click mid-text to edit typos
        setTimeout(() => {
            if (e.target) {
                e.target.scrollTop = e.target.scrollHeight;
            }
        }, 0);
    };

    // Handle Note Change - Scroll Shadows
    const handleNotesChange = (e) => {
        // Pass event to React Hook Form
        notesOnChange(e);

        // Update scroll shadows
        handleNotesScroll(e);
    };

    // Handle Notes Blur - Format to Sentence Case
    const handleNotesBlur = (e) => {
        const val = e.target.value;
        if (val) {
            const formatted = toSentenceCase(val);
            if (formatted !== val) {
                e.target.value = formatted;
                if (setValue) {
                    setValue("notes", formatted, { shouldDirty: true });
                }
            }
        }
        // Call the original RHF onBlur
        notesOnBlur(e);
    };

    return (
        <div>
            <label
                htmlFor="notes"
                className="block text-lg font-medium text-text-secondary mb-1"
            >
                Notes (Optional)
            </label>
            <div className="relative">
                {/* --- SCROLL SHADOWS --- */}
                {showTopShadow && (
                    <div className="absolute top-[1px] left-12 right-4 h-4 bg-gradient-to-b from-text-primary/10 to-transparent pointer-events-none z-20 rounded-t-md" />
                )}

                <div className="relative flex items-center">
                    {/* Icon */}
                    <span className="absolute top-3 left-0 flex items-start pl-3 pointer-events-none z-10">
                        <FileText className="w-5 h-5 text-text-secondary" />
                    </span>
                    {/* Divider */}
                    <div className="absolute left-10 top-2.5 h-6 w-px bg-border pointer-events-none z-10"></div>
                    <textarea
                        {...notesRegisterRest}
                        ref={(e) => {
                            notesRegisterRef(e);
                            notesRef.current = e;
                        }}
                        onChange={handleNotesChange}
                        onBlur={handleNotesBlur}
                        onFocus={handleNotesFocus}
                        onScroll={handleNotesScroll}
                        id="notes"
                        autoComplete="off"
                        className="w-full pl-12 pr-4 pt-2.5 pb-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed resize-none h-[148px] overflow-y-auto"
                        autoCapitalize="sentences"
                        placeholder="Add any additional notes or reminders about this chit..."
                        disabled={isFormDisabled}
                        onKeyDown={(e) => {
                            // Allow Enter to create new lines in textarea, use Ctrl+Enter or Cmd+Enter to submit
                            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                e.preventDefault();
                                if (onEnterKeyOnLastInput) {
                                    onEnterKeyOnLastInput();
                                }
                            }
                        }}
                    />
                </div>

                {/* --- SCROLL SHADOWS --- */}
                {showBottomShadow && (
                    <div className="absolute bottom-[2px] left-12 right-4 h-4 bg-gradient-to-t from-text-primary/10 to-transparent pointer-events-none z-20 rounded-b-md" />
                )}
            </div>
        </div>
    );
};

NotesField.propTypes = {
    register: PropTypes.func.isRequired,
    setValue: PropTypes.func,
    watchedNotes: PropTypes.string,
    isFormDisabled: PropTypes.bool,
    onEnterKeyOnLastInput: PropTypes.func,
};

export default NotesField;

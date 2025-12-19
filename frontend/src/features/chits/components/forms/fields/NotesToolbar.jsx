// frontend/src/features/chits/components/forms/fields/NotesToolbar.jsx

import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import {
    List,
    Minus,
    Hash,
    ListOrdered,
    Calendar,
    Maximize2,
    MoreHorizontal,
    Check,
    RotateCcw,
    Save,
} from "lucide-react";

/**
 * Format current date/time for timestamp insertion
 * Format: "📅 18 Dec 2024, 4:44 PM"
 */
const formatTimestamp = () => {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString("en-IN", { month: "short" });
    const year = now.getFullYear();
    const time = now.toLocaleString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
    return `📅 ${day} ${month} ${year}, ${time}`;
};

/**
 * Toolbar buttons configuration
 */
const TOOLBAR_BUTTONS = [
    {
        id: "bullet",
        icon: List,
        label: "Bullet Point",
        shortcut: "•",
        insert: "• ",
        newLineBefore: true,
    },
    {
        id: "divider",
        icon: Minus,
        label: "Section Divider",
        shortcut: "───",
        insert: "───────────────────────────────────",
        newLineBefore: true,
        newLineAfter: true,
    },
    {
        id: "heading",
        icon: Hash,
        label: "Section Header",
        shortcut: "H",
        insert: "Section Header:\n",
        newLineBefore: true,
        isHeading: true,
    },
    {
        id: "numbered",
        icon: ListOrdered,
        label: "Numbered List",
        shortcut: "1.",
        insert: "1. ",
        newLineBefore: true,
        isNumbered: true,
    },
    {
        id: "timestamp",
        icon: Calendar,
        label: "Insert Timestamp",
        shortcut: "📅",
        insert: formatTimestamp, // Function to get current timestamp
        newLineBefore: false,
    },
];

/**
 * NotesToolbar - Formatting toolbar for Notes field
 */
const NotesToolbar = ({
    onInsert,
    onFullscreen,
    draftStatus,
    isCollapsed = false,
    disabled = false,
}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };

        if (menuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuOpen]);

    // Handle button click
    const handleButtonClick = (button) => {
        if (disabled) return;

        const textToInsert = typeof button.insert === "function"
            ? button.insert()
            : button.insert;

        onInsert(textToInsert, {
            newLineBefore: button.newLineBefore,
            newLineAfter: button.newLineAfter,
            isNumbered: button.isNumbered,
        });

        setMenuOpen(false);
    };

    // Get draft status display
    const getDraftIndicator = () => {
        switch (draftStatus) {
            case "saving":
                return (
                    <span className="flex items-center gap-1 text-xs text-text-tertiary">
                        <Save className="w-3 h-3 animate-pulse" />
                        <span className="hidden sm:inline">Saving...</span>
                    </span>
                );
            case "saved":
                return (
                    <span className="flex items-center gap-1 text-xs text-green-500">
                        <Check className="w-3 h-3" />
                        <span className="hidden sm:inline">Draft saved</span>
                    </span>
                );
            case "recovered":
                return (
                    <span className="flex items-center gap-1 text-xs text-blue-500">
                        <RotateCcw className="w-3 h-3" />
                        <span className="hidden sm:inline">Draft recovered</span>
                    </span>
                );
            default:
                return null;
        }
    };

    // Render button
    const renderButton = (button, inMenu = false) => {
        const Icon = button.icon;
        return (
            <button
                key={button.id}
                type="button"
                onClick={() => handleButtonClick(button)}
                disabled={disabled}
                title={button.label}
                className={`
          ${inMenu
                        ? "flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-background-tertiary rounded-md"
                        : "p-1.5 rounded-md hover:bg-background-tertiary transition-colors"
                    }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
            >
                <Icon className="w-4 h-4 text-text-secondary" />
                {inMenu && <span className="text-text-primary">{button.label}</span>}
            </button>
        );
    };

    return (
        <div className="flex items-center justify-between px-2 py-1.5 bg-background-tertiary/50 border border-border border-b-0 rounded-t-md">
            {/* Left side - Formatting buttons */}
            <div className="flex items-center gap-0.5">
                {isCollapsed ? (
                    // Collapsed mode - show menu button
                    <div ref={menuRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setMenuOpen(!menuOpen)}
                            disabled={disabled}
                            className={`p-1.5 rounded-md hover:bg-background-tertiary transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                            title="Formatting options"
                        >
                            <MoreHorizontal className="w-4 h-4 text-text-secondary" />
                        </button>

                        {/* Dropdown menu */}
                        {menuOpen && (
                            <div className="absolute top-full left-0 mt-1 w-48 bg-background-secondary border border-border rounded-lg shadow-lg z-50 py-1">
                                {TOOLBAR_BUTTONS.map((button) => renderButton(button, true))}
                            </div>
                        )}
                    </div>
                ) : (
                    // Expanded mode - show all buttons
                    TOOLBAR_BUTTONS.map((button) => renderButton(button, false))
                )}
            </div>

            {/* Right side - Draft indicator and fullscreen */}
            <div className="flex items-center gap-2">
                {getDraftIndicator()}

                <button
                    type="button"
                    onClick={onFullscreen}
                    disabled={disabled}
                    title="Full screen"
                    className={`p-1.5 rounded-md hover:bg-background-tertiary transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    <Maximize2 className="w-4 h-4 text-text-secondary" />
                </button>
            </div>
        </div>
    );
};

NotesToolbar.propTypes = {
    onInsert: PropTypes.func.isRequired,
    onFullscreen: PropTypes.func.isRequired,
    draftStatus: PropTypes.oneOf(["idle", "saving", "saved", "recovered"]),
    isCollapsed: PropTypes.bool,
    disabled: PropTypes.bool,
};

export default NotesToolbar;

// frontend/src/features/chits/components/forms/fields/NotesFullScreenModal.jsx

import { useState, useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import {
    X,
    Search,
    ChevronUp,
    ChevronDown,
    FileText,
} from "lucide-react";
import NotesToolbar from "./NotesToolbar";

/**
 * NotesFullScreenModal - Full screen editing modal for Notes
 */
const NotesFullScreenModal = ({
    isOpen,
    onClose,
    value,
    onChange,
    onInsert,
    draftStatus,
    maxLength = 1000,
    disabled = false,
}) => {
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [currentMatch, setCurrentMatch] = useState(0);

    const textareaRef = useRef(null);
    const searchInputRef = useRef(null);

    // Focus textarea when modal opens
    useEffect(() => {
        if (isOpen && textareaRef.current) {
            setTimeout(() => {
                textareaRef.current.focus();
                // Move cursor to end
                const len = textareaRef.current.value.length;
                textareaRef.current.setSelectionRange(len, len);
            }, 100);
        }
    }, [isOpen]);

    // Focus search input when search opens
    useEffect(() => {
        if (searchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [searchOpen]);

    // Handle search
    useEffect(() => {
        if (!searchQuery || !value) {
            setSearchResults([]);
            setCurrentMatch(0);
            return;
        }

        const query = searchQuery.toLowerCase();
        const text = value.toLowerCase();
        const matches = [];
        let pos = 0;

        while ((pos = text.indexOf(query, pos)) !== -1) {
            matches.push(pos);
            pos += query.length;
        }

        setSearchResults(matches);
        setCurrentMatch(matches.length > 0 ? 1 : 0);

        // Highlight first match
        if (matches.length > 0 && textareaRef.current) {
            textareaRef.current.setSelectionRange(matches[0], matches[0] + searchQuery.length);
            textareaRef.current.focus();
        }
    }, [searchQuery, value]);

    // Navigate to next/prev match
    const navigateMatch = useCallback((direction) => {
        if (searchResults.length === 0) return;

        let newMatch = currentMatch + direction;
        if (newMatch < 1) newMatch = searchResults.length;
        if (newMatch > searchResults.length) newMatch = 1;

        setCurrentMatch(newMatch);

        const pos = searchResults[newMatch - 1];
        if (textareaRef.current) {
            textareaRef.current.setSelectionRange(pos, pos + searchQuery.length);
            textareaRef.current.focus();
        }
    }, [searchResults, currentMatch, searchQuery]);

    // Handle keyboard shortcuts
    const handleKeyDown = (e) => {
        // Escape to close
        if (e.key === "Escape") {
            if (searchOpen) {
                setSearchOpen(false);
                setSearchQuery("");
            } else {
                onClose();
            }
            return;
        }

        // Ctrl+F to open search
        if ((e.ctrlKey || e.metaKey) && e.key === "f") {
            e.preventDefault();
            setSearchOpen(true);
        }

        // Enter in search to go to next match
        if (searchOpen && e.key === "Enter") {
            e.preventDefault();
            navigateMatch(e.shiftKey ? -1 : 1);
        }
    };

    // Handle text change
    const handleChange = (e) => {
        onChange(e.target.value);
    };

    // Handle insert from toolbar
    const handleInsert = (text, options) => {
        onInsert(text, options);
        // Refocus textarea after insert
        setTimeout(() => textareaRef.current?.focus(), 0);
    };

    if (!isOpen) return null;

    const modal = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onKeyDown={handleKeyDown}
        >
            <div className="w-full h-full max-w-4xl max-h-[90vh] m-4 bg-background-primary rounded-xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background-secondary">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-accent" />
                        <h2 className="text-lg font-semibold text-text-primary">Notes</h2>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Search button */}
                        <button
                            type="button"
                            onClick={() => setSearchOpen(!searchOpen)}
                            className={`p-2 rounded-md transition-colors ${searchOpen ? "bg-accent/20 text-accent" : "hover:bg-background-tertiary text-text-secondary"}`}
                            title="Search (Ctrl+F)"
                        >
                            <Search className="w-5 h-5" />
                        </button>

                        {/* Close button */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-md hover:bg-background-tertiary text-text-secondary transition-colors"
                            title="Close (Esc)"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Search bar */}
                {searchOpen && (
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-background-tertiary/50">
                        <Search className="w-4 h-4 text-text-tertiary" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search in notes..."
                            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
                        />
                        {searchResults.length > 0 && (
                            <>
                                <span className="text-xs text-text-tertiary">
                                    {currentMatch} of {searchResults.length}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => navigateMatch(-1)}
                                    className="p-1 rounded hover:bg-background-tertiary"
                                    title="Previous (Shift+Enter)"
                                >
                                    <ChevronUp className="w-4 h-4 text-text-secondary" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigateMatch(1)}
                                    className="p-1 rounded hover:bg-background-tertiary"
                                    title="Next (Enter)"
                                >
                                    <ChevronDown className="w-4 h-4 text-text-secondary" />
                                </button>
                            </>
                        )}
                        {searchQuery && searchResults.length === 0 && (
                            <span className="text-xs text-amber-500">No matches</span>
                        )}
                    </div>
                )}

                {/* Toolbar - expanded mode (no menu collapse) */}
                <NotesToolbar
                    onInsert={handleInsert}
                    onFullscreen={onClose}
                    draftStatus={draftStatus}
                    isCollapsed={false}
                    disabled={disabled}
                />

                {/* Textarea */}
                <div className="flex-1 p-4 overflow-hidden">
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={handleChange}
                        maxLength={maxLength}
                        disabled={disabled}
                        placeholder="Add any additional notes or reminders about this chit..."
                        className="w-full h-full p-4 text-base bg-background-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed resize-none"
                        style={{ fontFamily: "inherit" }}
                    />
                </div>

                {/* Footer - Character count */}
                <div className="flex justify-end px-4 py-2 border-t border-border bg-background-secondary">
                    <span
                        className={`text-xs font-medium ${(value?.length || 0) >= maxLength
                                ? "text-red-500"
                                : (value?.length || 0) >= maxLength * 0.9
                                    ? "text-amber-500"
                                    : "text-text-tertiary"
                            }`}
                    >
                        {value?.length || 0}/{maxLength}
                    </span>
                </div>
            </div>
        </div>
    );

    // Render in portal
    return createPortal(modal, document.body);
};

NotesFullScreenModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    onInsert: PropTypes.func.isRequired,
    draftStatus: PropTypes.oneOf(["idle", "saving", "saved", "recovered"]),
    maxLength: PropTypes.number,
    disabled: PropTypes.bool,
};

export default NotesFullScreenModal;

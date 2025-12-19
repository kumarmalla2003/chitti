// frontend/src/features/chits/hooks/useNotesDraft.js

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Custom hook for auto-saving notes to localStorage with debounce.
 * 
 * @param {string|number|null} chitId - Chit ID for edit mode, null for create mode
 * @param {string} currentValue - Current notes value from form
 * @param {function} setValue - React Hook Form setValue function
 * @returns {Object} Draft status and control functions
 */
export const useNotesDraft = (chitId, currentValue, setValue) => {
    // Generate storage key based on chit ID
    const storageKey = chitId
        ? `chit_notes_draft_${chitId}`
        : "chit_notes_draft_new";

    // Draft status: 'idle' | 'saving' | 'saved' | 'recovered'
    const [draftStatus, setDraftStatus] = useState("idle");

    // Track if we've already recovered a draft (to prevent re-recovery)
    const hasRecovered = useRef(false);

    // Track the last saved value to avoid unnecessary saves
    const lastSavedValue = useRef("");

    // Auto-save with 2-second debounce
    useEffect(() => {
        // Skip if value hasn't changed or is empty
        if (!currentValue || currentValue === lastSavedValue.current) {
            return;
        }

        // Set saving status immediately
        setDraftStatus("saving");

        const timer = setTimeout(() => {
            try {
                localStorage.setItem(storageKey, currentValue);
                lastSavedValue.current = currentValue;
                setDraftStatus("saved");

                // Reset to idle after 3 seconds
                setTimeout(() => setDraftStatus("idle"), 3000);
            } catch (err) {
                console.error("Failed to save draft:", err);
                setDraftStatus("idle");
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [currentValue, storageKey]);

    // Recover draft on mount (only once)
    useEffect(() => {
        if (hasRecovered.current) return;

        try {
            const savedDraft = localStorage.getItem(storageKey);

            // Only recover if there's a saved draft and current value is empty
            if (savedDraft && (!currentValue || currentValue === "")) {
                setValue("notes", savedDraft, { shouldDirty: true });
                lastSavedValue.current = savedDraft;
                setDraftStatus("recovered");
                hasRecovered.current = true;

                // Reset to idle after 3 seconds
                setTimeout(() => setDraftStatus("idle"), 3000);
            }
        } catch (err) {
            console.error("Failed to recover draft:", err);
        }
    }, [storageKey, currentValue, setValue]);

    // Clear draft from localStorage
    const clearDraft = useCallback(() => {
        try {
            localStorage.removeItem(storageKey);
            lastSavedValue.current = "";
            setDraftStatus("idle");
        } catch (err) {
            console.error("Failed to clear draft:", err);
        }
    }, [storageKey]);

    // Check if a draft exists
    const hasDraft = useCallback(() => {
        try {
            return !!localStorage.getItem(storageKey);
        } catch {
            return false;
        }
    }, [storageKey]);

    return {
        draftStatus,
        clearDraft,
        hasDraft,
    };
};

export default useNotesDraft;

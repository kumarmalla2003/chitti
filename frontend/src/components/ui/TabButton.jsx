// frontend/src/components/ui/TabButton.jsx

import React from "react";
import PropTypes from "prop-types";

/**
 * TabButton component - a reusable tab button with icon and label.
 * Used for navigation between tabs in detail pages.
 *
 * @param {object} props - Component props
 * @param {string} props.name - Unique identifier for the tab
 * @param {React.ComponentType} props.icon - Lucide icon component
 * @param {string} props.label - Display text for the tab
 * @param {string} props.activeTab - Currently active tab name
 * @param {function} props.setActiveTab - Function to change active tab
 * @param {boolean} [props.disabled=false] - Whether the tab is disabled
 * @param {React.Ref} ref - Forwarded ref for scroll behavior
 */
const TabButton = React.forwardRef(
    ({ name, icon: Icon, label, activeTab, setActiveTab, disabled = false }, ref) => {
        const isActive = activeTab === name;

        return (
            <button
                ref={ref}
                type="button"
                onClick={() => !disabled && setActiveTab(name)}
                disabled={disabled}
                className={`flex-1 flex-shrink-0 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent focus:ring-offset-background-primary rounded-t-md ${isActive
                        ? "bg-background-secondary text-accent border-b-2 border-accent"
                        : "text-text-secondary hover:bg-background-tertiary"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
            </button>
        );
    }
);

TabButton.displayName = "TabButton";

TabButton.propTypes = {
    name: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    activeTab: PropTypes.string.isRequired,
    setActiveTab: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
};

export default TabButton;

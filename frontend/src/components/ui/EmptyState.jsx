// frontend/src/components/ui/EmptyState.jsx

import { motion } from "framer-motion";
import { FolderOpen } from "lucide-react";
import Card from "./Card";

/**
 * EmptyState - Reusable component for displaying empty state with icon, title, description,
 * and optional action button. Wrapped in a Card for visual consistency.
 */
const EmptyState = ({
    icon: Icon = FolderOpen,
    title = "No items found",
    description = "There are no items to display.",
    actionLabel,
    onAction,
    className = "",
}) => {
    return (
        <Card className={className}>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center py-8 px-4 text-center"
            >
                <div className="p-4 bg-background-tertiary rounded-full mb-4">
                    <Icon className="w-12 h-12 text-text-secondary" />
                </div>

                <h3 className="text-xl font-bold text-text-primary mb-2">
                    {title}
                </h3>

                <p className="text-text-secondary mb-6">
                    {description}
                </p>

                {actionLabel && onAction && (
                    <button
                        onClick={onAction}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors duration-200 font-medium"
                    >
                        {actionLabel}
                    </button>
                )}
            </motion.div>
        </Card>
    );
};

export default EmptyState;


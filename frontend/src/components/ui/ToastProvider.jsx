// frontend/src/components/ui/ToastProvider.jsx

import { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CircleCheck, TriangleAlert, Info } from "lucide-react";

const ToastContext = createContext(null);

const toastConfig = {
    success: {
        bgColor: "bg-success-bg",
        textColor: "text-success-accent",
        borderColor: "border-success-accent",
        icon: CircleCheck,
    },
    error: {
        bgColor: "bg-error-bg",
        textColor: "text-error-accent",
        borderColor: "border-error-accent",
        icon: TriangleAlert,
    },
    warning: {
        bgColor: "bg-warning-bg",
        textColor: "text-warning-accent",
        borderColor: "border-warning-accent",
        icon: TriangleAlert,
    },
    info: {
        bgColor: "bg-info-bg",
        textColor: "text-info-accent",
        borderColor: "border-info-accent",
        icon: Info,
    },
};

const Toast = ({ id, message, type, onClose }) => {
    const config = toastConfig[type] || toastConfig.info;
    const Icon = config.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-l-4 ${config.bgColor} ${config.borderColor} min-w-[280px] max-w-md`}
            role="alert"
        >
            <Icon className={`w-5 h-5 flex-shrink-0 ${config.textColor}`} />
            <p className={`flex-grow text-sm font-medium ${config.textColor}`}>
                {message}
            </p>
            <button
                onClick={() => onClose(id)}
                className={`p-1 rounded-full hover:bg-black/10 transition-colors ${config.textColor}`}
                aria-label="Close"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = "info", duration = 3000) => {
        const id = Date.now() + Math.random();

        setToasts((prev) => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((toast) => toast.id !== id));
            }, duration);
        }

        return id;
    }, []);

    const closeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, closeToast }}>
            {children}

            {/* Toast Container - Fixed position at top-right */}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <div key={toast.id} className="pointer-events-auto">
                            <Toast
                                id={toast.id}
                                message={toast.message}
                                type={toast.type}
                                onClose={closeToast}
                            />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};

export default ToastProvider;

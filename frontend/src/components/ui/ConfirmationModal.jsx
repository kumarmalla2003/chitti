// frontend/src/components/ui/ConfirmationModal.jsx

import Button from "./Button";
import { FiAlertTriangle, FiX, FiLoader } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  loading = false,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-center items-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-background-primary rounded-md shadow-lg p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-error-bg">
                <FiAlertTriangle className="h-6 w-6 text-error-accent" />
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-bold text-text-primary">{title}</h3>
                <p className="text-sm text-text-secondary mt-1">{message}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button variant="error" onClick={onConfirm} disabled={loading}>
                {loading ? (
                  <FiLoader className="animate-spin mx-auto" />
                ) : (
                  confirmText
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;

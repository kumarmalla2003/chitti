// frontend/src/components/ui/ConfirmationModal.jsx

import Button from "./Button";
import { FiAlertTriangle, FiX, FiLoader } from "react-icons/fi";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center items-center p-4 transition-opacity duration-300 ease-in-out ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Modal */}
      <div
        className={`relative bg-background-primary rounded-md shadow-lg p-8 w-full max-w-sm transition-all duration-300 ease-in-out ${
          isOpen
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-transform duration-300 hover:rotate-90 cursor-pointer"
          aria-label="Close modal"
          disabled={loading}
        >
          <FiX className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center">
          {/* Alert Icon */}
          <div className="mb-4">
            <FiAlertTriangle className="w-12 h-12 text-error-accent" />
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-text-primary mb-2">{title}</h3>

          {/* Message */}
          <p className="text-sm text-text-secondary mb-6">{message}</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="error"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <FiLoader className="animate-spin mx-auto" />
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

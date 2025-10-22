// frontend/src/components/ui/StepperButtons.jsx

import Button from "./Button";
import {
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiEdit,
  FiLoader,
} from "react-icons/fi";

const StepperButtons = ({
  currentStep,
  totalSteps,
  onPrev,
  onNext,
  onSkip,
  isNextDisabled,
  isSkipDisabled,
  isSubmitStep,
  loading,
  formId,
  mode,
}) => {
  return (
    <div className="mt-8 md:hidden">
      <hr className="my-4 border-border" />
      {/* --- UPDATED: Justify end on the first step --- */}
      <div
        className={`flex items-center ${
          currentStep === 0 ? "justify-end" : "justify-between"
        }`}
      >
        {/* --- UPDATED: Only show if not the first step --- */}
        {currentStep > 0 && (
          <Button variant="secondary" onClick={onPrev} disabled={loading}>
            <FiChevronLeft className="inline-block mr-1" />
            Prev
          </Button>
        )}

        {/* --- UPDATED: Only show if not the first step --- */}
        {currentStep > 0 && currentStep < totalSteps - 1 && onSkip && (
          <Button
            variant="secondary"
            onClick={onSkip}
            disabled={isSkipDisabled || loading}
            className="text-text-secondary"
          >
            Skip
          </Button>
        )}

        {/* Conditional "Next" or "Submit" Button */}
        {isSubmitStep ? (
          <Button
            type="submit"
            form={formId}
            variant={mode === "create" ? "success" : "warning"}
            disabled={isNextDisabled || loading}
          >
            {loading ? (
              <FiLoader className="animate-spin mx-auto" />
            ) : mode === "create" ? (
              <>
                <FiPlus className="inline-block mr-2" />
                Create
              </>
            ) : (
              <>
                <FiEdit className="inline-block mr-2" />
                Update
              </>
            )}
          </Button>
        ) : (
          <Button onClick={onNext} disabled={isNextDisabled || loading}>
            Next
            <FiChevronRight className="inline-block ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default StepperButtons;

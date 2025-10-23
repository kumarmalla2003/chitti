// frontend/src/components/ui/StepperButtons.jsx

import Button from "./Button";
import {
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
  FiSave,
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
  mode,
}) => {
  const isFirstStep = currentStep === 0;

  // Renders the correct button for the right side of the stepper
  const renderRightButton = () => {
    // Final step button ("Update" or "Finish")
    if (isSubmitStep) {
      if (mode === "edit") {
        return (
          <Button
            type="button"
            onClick={onNext}
            variant="warning"
            disabled={loading}
          >
            {loading ? (
              <FiLoader className="animate-spin mx-auto" />
            ) : (
              <>
                Update <FiEdit className="inline-block ml-1" />
              </>
            )}
          </Button>
        );
      }
      return (
        <Button type="button" onClick={onNext} variant="success">
          Finish <FiCheck className="inline-block ml-1" />
        </Button>
      );
    }

    // First step button ("Save & Next")
    if (isFirstStep && mode === "create") {
      return (
        <Button
          type="button"
          onClick={onNext}
          disabled={isNextDisabled || loading}
        >
          {loading ? (
            <FiLoader className="animate-spin mx-auto" />
          ) : (
            <>
              Save & Next <FiSave className="inline-block ml-1" />
            </>
          )}
        </Button>
      );
    }

    // Intermediate "Next" button
    return (
      <Button
        type="button"
        onClick={onNext}
        disabled={isNextDisabled || loading}
      >
        Next
        <FiChevronRight className="inline-block ml-1" />
      </Button>
    );
  };

  return (
    <div className="mt-8 md:hidden">
      <hr className="my-4 border-border" />
      <div
        className={`flex items-center ${
          isFirstStep ? "justify-end" : "justify-between"
        }`}
      >
        <Button
          type="button"
          variant="secondary"
          onClick={onPrev}
          disabled={loading || isFirstStep}
          className={isFirstStep ? "invisible" : ""}
        >
          <FiChevronLeft className="inline-block mr-1" />
          Prev
        </Button>

        {!isFirstStep && currentStep < totalSteps - 1 && onSkip && (
          <Button
            type="button"
            variant="secondary"
            onClick={onSkip}
            disabled={isSkipDisabled || loading}
            className="text-text-secondary"
          >
            Skip
          </Button>
        )}

        {renderRightButton()}
      </div>
    </div>
  );
};

export default StepperButtons;

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
  onMiddle,
  isNextDisabled,
  loading,
  mode,
  isPostCreation = false, // ADD THIS LINE
}) => {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  // --- FIRST STEP (Details Section) ---
  if (isFirstStep) {
    if (mode === "create") {
      // Determine button variant and text based on whether group is already created
      const buttonVariant = isPostCreation ? "warning" : "success";
      const buttonText = isPostCreation ? "Update & Next" : "Save & Next";
      const ButtonIcon = isPostCreation ? FiEdit : FiSave;

      return (
        <div className="mt-8 md:hidden">
          <hr className="my-4 border-border" />
          <div className="flex items-center justify-end">
            <Button
              type="submit"
              variant={buttonVariant}
              disabled={isNextDisabled || loading}
              className="w-full"
            >
              {loading ? (
                <FiLoader className="animate-spin mx-auto" />
              ) : (
                <>
                  <ButtonIcon className="inline-block mr-2" />
                  {buttonText}
                </>
              )}
            </Button>
          </div>
        </div>
      );
    } else {
      // EDIT MODE: Skip (center) | Next (right)
      return (
        <div className="mt-8 md:hidden">
          <hr className="my-4 border-border" />
          <div className="flex items-center justify-between">
            {/* Empty div for left spacing to center the Skip button */}
            <div className="w-20"></div>

            <Button
              type="button"
              variant="secondary"
              onClick={onMiddle}
              disabled={loading}
            >
              Skip
            </Button>

            <Button
              type="button"
              onClick={onNext}
              disabled={isNextDisabled || loading}
            >
              Next
              <FiChevronRight className="inline-block ml-1" />
            </Button>
          </div>
        </div>
      );
    }
  }

  // --- MIDDLE STEPS (Members/Payments Section) ---
  if (!isLastStep) {
    // Both CREATE and EDIT: Prev | Skip | Next
    return (
      <div className="mt-8 md:hidden">
        <hr className="my-4 border-border" />
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={onPrev}
            disabled={loading}
          >
            <FiChevronLeft className="inline-block mr-1" />
            Prev
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={onMiddle}
            disabled={loading}
          >
            Skip
          </Button>

          <Button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled || loading}
          >
            Next
            <FiChevronRight className="inline-block ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // --- LAST STEP (Payments Section) ---
  // Both CREATE and EDIT: Prev | Skip | Finish/Update
  return (
    <div className="mt-8 md:hidden">
      <hr className="my-4 border-border" />
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="secondary"
          onClick={onPrev}
          disabled={loading}
        >
          <FiChevronLeft className="inline-block mr-1" />
          Prev
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={onMiddle}
          disabled={loading}
        >
          Skip
        </Button>

        <Button
          type="button"
          onClick={onMiddle}
          variant={mode === "create" ? "success" : "warning"}
          disabled={loading}
        >
          {loading ? (
            <FiLoader className="animate-spin mx-auto" />
          ) : (
            <>
              {mode === "create" ? "Finish" : "Update"}
              {mode === "create" ? (
                <FiCheck className="inline-block ml-1" />
              ) : (
                <FiEdit className="inline-block ml-1" />
              )}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StepperButtons;

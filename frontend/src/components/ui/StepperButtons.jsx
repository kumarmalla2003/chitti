// frontend/src/components/ui/StepperButtons.jsx

import Button from "./Button";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Save,
  Plus,
  SquarePen,
  Loader2,
} from "lucide-react";

const StepperButtons = ({
  currentStep,
  totalSteps,
  onPrev,
  onNext,
  onMiddle,
  isNextDisabled,
  loading,
  mode,
  isPostCreation = false,
}) => {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  // --- FIRST STEP (Details Section) ---
  if (isFirstStep) {
    if (mode === "create") {
      // Determine button variant and text based on whether chit is already created
      const buttonVariant = isPostCreation ? "warning" : "success";
      const buttonText = isPostCreation ? "Update & Next" : "Create Chit";

      const ButtonIcon = isPostCreation ? SquarePen : Plus;

      return (
        <div className="mt-8 md:hidden">
          <hr className="my-4 border-border" />
          <div className="flex items-center justify-end">
            <Button
              type="submit"
              variant={buttonVariant}
              disabled={isNextDisabled || loading}
              className="w-full flex items-center justify-center"
            >
              {loading ? (
                <Loader2 className="animate-spin mx-auto w-5 h-5" />
              ) : (
                <>
                  <ButtonIcon className="inline-block mr-2 w-5 h-5" />
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
              className="flex items-center"
            >
              Next
              <ChevronRight className="inline-block ml-1 w-5 h-5" />
            </Button>
          </div>
        </div>
      );
    }
  }

  // --- MIDDLE STEPS (Members/Collections Section) ---
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
            className="flex items-center"
          >
            <ChevronLeft className="inline-block mr-1 w-5 h-5" />
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
            className="flex items-center"
          >
            Next
            <ChevronRight className="inline-block ml-1 w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  // --- LAST STEP (Transactions Section) ---
  // Both CREATE and EDIT: Prev | Skip | Done
  return (
    <div className="mt-8 md:hidden">
      <hr className="my-4 border-border" />
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="secondary"
          onClick={onPrev}
          disabled={loading}
          className="flex items-center"
        >
          <ChevronLeft className="inline-block mr-1 w-5 h-5" />
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
          variant="primary"
          disabled={loading}
          className="flex items-center"
        >
          {loading ? (
            <Loader2 className="animate-spin mx-auto w-5 h-5" />
          ) : (
            <>
              Done
              <Check className="inline-block ml-1 w-5 h-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StepperButtons;

// frontend/src/features/chits/components/forms/AssignNewChitForm.jsx

import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import ChitDetailsForm from "./ChitDetailsForm";
import Button from "../../../../components/ui/Button";
import Message from "../../../../components/ui/Message";
import Card from "../../../../components/ui/Card";
import {
  Save,
  Calendar,
  Check,
  Loader2,
  SquarePen,
} from "lucide-react";
import { getUnassignedMonths } from "../../../../services/assignmentsService";
import useScrollToTop from "../../../../hooks/useScrollToTop";
import { useChitForm } from "../../hooks/useChitForm";

// --- Helper Functions ---
// Format month display to show both month number and actual date
// e.g., "Month-1 - 01/2025" or "Month-5 - 05/2025"
const formatMonthDisplay = (monthNum, startDate) => {
  const num = typeof monthNum === 'number' ? monthNum : parseInt(monthNum, 10);

  // If we have a start_date, calculate the actual date
  if (startDate) {
    // startDate is in format "YYYY-MM" or "YYYY-MM-DD"
    const datePart = startDate.includes('T') ? startDate.split('T')[0] : startDate;
    const [year, month] = datePart.split('-').map(Number);

    // Calculate the actual month by adding (monthNum - 1) to start date
    const actualDate = new Date(year, month - 1 + (num - 1), 1);
    const actualMonth = String(actualDate.getMonth() + 1).padStart(2, '0');
    const actualYear = actualDate.getFullYear();

    return `Month ${num} - ${actualMonth}/${actualYear}`;
  }

  // Fallback: just show month number
  return `Month ${num}`;
};

const AssignNewChitForm = forwardRef(
  (
    {
      memberId,
      onAssignment,
      onChitNameChange,
      onBackToList,
    },
    ref
  ) => {
    // --- State Management ---
    const [step, setStep] = useState("details"); // 'details', 'payouts', 'month'
    const [availableMonths, setAvailableMonths] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState("");
    const [monthLoading, setMonthLoading] = useState(false);
    const [localError, setLocalError] = useState(null);
    const [localSuccess, setLocalSuccess] = useState(null);

    const scrollRef = useRef(null);
    useScrollToTop(localSuccess || localError);

    // --- Use the same hook as ChitDetailPage ---
    const {
      form,
      register,
      control,
      errors,
      handleSubmit,
      trigger,
      setValue,
      getValues,
      setFormError,
      clearFormErrors,
      createdChitId,
      createdChitName,
      isPostCreation,
      isSubmitting,
      error: hookError,
      success: hookSuccess,
      setError: setHookError,
      setSuccess: setHookSuccess,
      onSubmit,
      handleSizeChange,
      handleDurationChange,
      handleStartDateChange,
      handleEndDateChange,
    } = useChitForm(null, "create");

    // Combine errors
    const error = localError || hookError;
    const success = localSuccess || hookSuccess;

    // Note: Header name is updated via onNameValid callback in ChitDetailsForm
    // This matches the behavior of the main ChitDetailPage

    // --- Proceed to month selection after successful chit creation ---
    useEffect(() => {
      if (createdChitId && step === "details") {
        // Fetch available months and go directly to month selection
        (async () => {
          setMonthLoading(true);
          try {
            const data = await getUnassignedMonths(createdChitId);
            setAvailableMonths(data.available_months || []);
            setStep("month");
          } catch (err) {
            setLocalError(err.message);
          } finally {
            setMonthLoading(false);
          }
        })();
      }
    }, [createdChitId, step]);

    // --- Expose goBack function ---
    useImperativeHandle(ref, () => ({
      goBack: () => {
        if (step === "month") {
          setStep("details");
        } else {
          onBackToList();
        }
      },
    }));

    // --- Auto-clear success messages ---
    useEffect(() => {
      if (success) {
        const timer = setTimeout(() => {
          setLocalSuccess(null);
          setHookSuccess(null);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }, [success, setHookSuccess]);

    // --- Handle Form Submission ---
    const handleFormSubmit = async (data) => {
      setLocalError(null);
      try {
        await onSubmit(data);
        // onSubmit will set createdChitId on success, triggering step change
      } catch (err) {
        setLocalError(err.message);
      }
    };

    // --- Confirm Assignment ---
    const handleConfirmAssignment = async () => {
      if (!selectedMonth) {
        setLocalError("Please select a chit month to assign.");
        return;
      }

      setMonthLoading(true);
      await onAssignment({
        member_id: memberId,
        chit_id: createdChitId,
        chit_month: selectedMonth,
      });
      setMonthLoading(false);
    };

    // --- STEP 1: Chit Details (Initial Create or Post-Creation Edit) ---
    if (step === "details") {
      const triggerSubmit = () => {
        handleSubmit(handleFormSubmit)();
      };

      return (
        <div className="my-4" ref={scrollRef}>
          {error && (
            <Message type="error" onClose={() => { setLocalError(null); setHookError(null); }}>
              {error}
            </Message>
          )}
          {success && <Message type="success">{success}</Message>}

          <div>
            <ChitDetailsForm
              mode="create"
              control={control}
              register={register}
              errors={errors}
              setValue={setValue}
              setError={setFormError}
              clearErrors={clearFormErrors}
              trigger={trigger}
              isPostCreation={isPostCreation}
              chitId={createdChitId}
              onEnterKeyOnLastInput={triggerSubmit}
              onNameValid={(name) => onChitNameChange && onChitNameChange(name)}
              onSizeChange={handleSizeChange}
              onDurationChange={handleDurationChange}
              onStartDateChange={handleStartDateChange}
              onEndDateChange={handleEndDateChange}
            />
            <div className="mt-6">
              <Button
                type="button"
                variant={isPostCreation ? "warning" : "primary"}
                disabled={isSubmitting}
                onClick={triggerSubmit}
                className="w-full flex items-center justify-center"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : isPostCreation ? (
                  <>
                    <SquarePen className="mr-2 w-5 h-5" /> Update & Continue
                  </>
                ) : (
                  <>
                    <Save className="mr-2 w-5 h-5" /> Save Chit
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // --- STEP 2: Month Selection ---
    if (step === "month") {
      return (
        <div className="my-4" ref={scrollRef}>
          {error && (
            <Message type="error" onClose={() => { setLocalError(null); setHookError(null); }}>
              {error}
            </Message>
          )}

          <h3 className="text-lg font-semibold text-text-primary mb-4 text-center">
            Assign Month in {createdChitName}
          </h3>

          <div className="relative flex items-center">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Calendar className="w-5 h-5 text-text-secondary" />
            </span>
            <div className="absolute left-10 h-6 w-px bg-border"></div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              autoFocus
            >
              <option value="">
                {monthLoading
                  ? "Loading months..."
                  : availableMonths.length > 0
                    ? "Select an available month..."
                    : "No available months"}
              </option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {formatMonthDisplay(month, getValues("start_date"))}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-6">
            <Button
              type="button"
              variant="success"
              onClick={handleConfirmAssignment}
              disabled={!selectedMonth || monthLoading}
              className="w-full flex items-center justify-center"
            >
              {monthLoading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <>
                  <Check className="mr-2 w-5 h-5" /> Confirm Assignment
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }

    return null;
  }
);

export default AssignNewChitForm;

// frontend/src/features/chits/components/forms/AssignNewChitForm.jsx

import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ChitDetailsForm from "./ChitDetailsForm";
import PayoutsSection from "../sections/PayoutsSection";
import Button from "../../../../components/ui/Button";
import Message from "../../../../components/ui/Message";
import {
  Save,
  Calendar,
  Check,
  Loader2,
  ArrowRight,
  SquarePen,
} from "lucide-react";
import { createChit, patchChit } from "../../../../services/chitsService";
import { getUnassignedMonths } from "../../../../services/assignmentsService";
import useScrollToTop from "../../../../hooks/useScrollToTop";
import { chitSchema } from "../../schemas/chitSchema";

// --- Helper Functions ---
const getFirstDayOfMonth = (yearMonth) => (yearMonth ? `${yearMonth}-01` : "");
const toYearMonth = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}`;
};
const calculateEndDate = (startYearMonth, durationMonths) => {
  if (!startYearMonth || !durationMonths || durationMonths <= 0) return "";
  const [year, month] = startYearMonth.split("-").map(Number);
  const startDate = new Date(year, month - 1, 1);
  startDate.setMonth(startDate.getMonth() + parseInt(durationMonths) - 1);
  return toYearMonth(startDate.toISOString());
};
const calculateStartDate = (endYearMonth, durationMonths) => {
  if (!endYearMonth || !durationMonths || durationMonths <= 0) return "";
  const [year, month] = endYearMonth.split("-").map(Number);
  const endDate = new Date(year, month, 0);
  endDate.setMonth(endDate.getMonth() - parseInt(durationMonths) + 1);
  return toYearMonth(endDate.toISOString());
};
const calculateDuration = (startYearMonth, endYearMonth) => {
  if (!startYearMonth || !endYearMonth) return "";
  const [startYear, startMonth] = startYearMonth.split("-").map(Number);
  const [endYear, endMonth] = endYearMonth.split("-").map(Number);
  if (endYear < startYear || (endYear === startYear && endMonth < startMonth))
    return "";
  const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
  return totalMonths > 0 ? totalMonths.toString() : "";
};

const AssignNewChitForm = forwardRef(
  (
    {
      token,
      memberId,
      onAssignment,
      formatDate,
      onChitNameChange,
      onBackToList,
    },
    ref
  ) => {
    // --- State Management ---
    const [step, setStep] = useState("details"); // 'details', 'payouts', 'month'
    const [createdChit, setCreatedChit] = useState(null);
    const [availableMonths, setAvailableMonths] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState("");
    const [loading, setLoading] = useState(false);
    const [pageError, setPageError] = useState(null);
    const [success, setSuccess] = useState(null);

    const scrollRef = useRef(null);
    useScrollToTop(success || pageError); // Scroll on success/error

    // RHF Setup
    const {
      register,
      handleSubmit,
      control,
      setValue,
      watch,
      reset,
      getValues,
      formState: { errors, isValid, isSubmitting, dirtyFields },
    } = useForm({
      resolver: zodResolver(chitSchema),
      defaultValues: {
        name: "",
        chit_value: "",
        size: undefined,
        monthly_installment: "",
        duration_months: undefined,
        start_date: "",
        end_date: "",
        collection_day: undefined,
        payout_day: undefined,
      },
      mode: "onChange",
    });

    // --- Watched Values for Logic ---
    const wName = watch("name");

    useEffect(() => {
      const subscription = watch((value, { name, type }) => {
        if (!name) return;

        // Logic from handleFormChange
        const val = value[name];

        if (name === "size") {
          // Sync duration
          const numVal = Number(val);
          // Only update if differ to prevent loop? (Watch doesn't trigger unless user input usually)
          // RHF watch triggers on setValue too.
          // Get current duration.
          const currDur = getValues("duration_months");
          if (currDur !== numVal) {
            setValue("duration_months", numVal);
          }

          // Calc dates if start exists
          const start = getValues("start_date");
          if (start && val) {
            setValue("end_date", calculateEndDate(start, val));
          }
        } else if (name === "duration_months") {
          const numVal = Number(val);
          const currSize = getValues("size");
          if (currSize !== numVal) {
            setValue("size", numVal);
          }

          const start = getValues("start_date");
          const end = getValues("end_date");
          if (start && val) {
            setValue("end_date", calculateEndDate(start, val));
          } else if (end && val) {
            setValue("start_date", calculateStartDate(end, val));
          }
        } else if (name === "start_date") {
          const duration = getValues("duration_months");
          const end = getValues("end_date");
          if (duration) {
            setValue("end_date", calculateEndDate(val, duration));
          } else if (end) {
            const newDur = calculateDuration(val, end);
            if (newDur) {
              setValue("duration_months", Number(newDur));
              setValue("size", Number(newDur));
            }
          }
        } else if (name === "end_date") {
          const duration = getValues("duration_months");
          const start = getValues("start_date");
          if (duration) {
            setValue("start_date", calculateStartDate(val, duration));
          } else if (start) {
            const newDur = calculateDuration(start, val);
            if (newDur) {
              setValue("duration_months", Number(newDur));
              setValue("size", Number(newDur));
            }
          }
        }
      });
      return () => subscription.unsubscribe();
    }, [watch, setValue, getValues]);

    // Update Header Name
    useEffect(() => {
      if (onChitNameChange) onChitNameChange(wName || "");
    }, [wName, onChitNameChange]);

    // --- Expose goBack function ---
    useImperativeHandle(ref, () => ({
      goBack: () => {
        if (step === "month") {
          setStep("payouts");
        } else if (step === "payouts") {
          setStep("details");
        } else {
          onBackToList();
        }
      },
    }));

    // --- Auto-clear success messages ---
    useEffect(() => {
      if (success) {
        const timer = setTimeout(() => setSuccess(null), 3000);
        return () => clearTimeout(timer);
      }
    }, [success]);

    // --- Step 1: Save New Chit ---
    const handleSaveChit = async (data) => {
      setLoading(true);
      setPageError(null);
      setSuccess(null);

      try {
        const dataToSend = {
          ...data,
          start_date: getFirstDayOfMonth(data.start_date),
          chit_value: Number(data.chit_value),
          size: Number(data.size),
          monthly_installment: Number(data.monthly_installment),
          duration_months: Number(data.duration_months),
          collection_day: Number(data.collection_day),
          payout_day: Number(data.payout_day),
        };
        delete dataToSend.end_date;

        const newChit = await createChit(dataToSend, token);
        setCreatedChit(newChit);

        // Reset form to new Values
        const newDefaults = {
          ...newChit,
          start_date: toYearMonth(newChit.start_date),
          end_date: toYearMonth(newChit.end_date),
        };
        reset(newDefaults);

        setSuccess(`Chit "${newChit.name}" created successfully!`);
        onChitNameChange(newChit.name);
        setStep("payouts");
      } catch (err) {
        setPageError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // --- Step 1 (Post-Creation): Update ---
    const handleUpdateChit = async (data) => {
      if (!createdChit) return;

      const changes = {};
      Object.keys(dirtyFields).forEach((key) => {
        changes[key] = data[key];
      });

      if (Object.keys(changes).length === 0) {
        setStep("payouts");
        return;
      }

      setLoading(true);
      setPageError(null);
      setSuccess(null);

      try {
        const patchData = { ...changes };

        if (patchData.start_date)
          patchData.start_date = getFirstDayOfMonth(patchData.start_date);
        if (patchData.chit_value)
          patchData.chit_value = Number(patchData.chit_value);
        if (patchData.size) patchData.size = Number(patchData.size);
        if (patchData.monthly_installment)
          patchData.monthly_installment = Number(patchData.monthly_installment);
        if (patchData.duration_months)
          patchData.duration_months = Number(patchData.duration_months);
        if (patchData.collection_day)
          patchData.collection_day = Number(patchData.collection_day);
        if (patchData.payout_day)
          patchData.payout_day = Number(patchData.payout_day);

        const updatedChit = await patchChit(createdChit.id, patchData, token);
        setCreatedChit(updatedChit);

        const newDefaults = {
          ...updatedChit,
          start_date: toYearMonth(updatedChit.start_date),
          end_date: toYearMonth(updatedChit.end_date),
        };
        reset(newDefaults);

        onChitNameChange(updatedChit.name);
        setSuccess("Chit details updated successfully!");
        setStep("payouts");
      } catch (err) {
        setPageError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // --- Step 2: Proceed to Month ---
    const handleProceedToMonth = async () => {
      if (!createdChit) return;

      setLoading(true);
      setPageError(null);

      try {
        const data = await getUnassignedMonths(createdChit.id, token);
        setAvailableMonths(data.available_months);
        setStep("month");
      } catch (err) {
        setPageError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // --- Step 3: Confirm Assignment ---
    const handleConfirmAssignment = async () => {
      if (!selectedMonth) {
        setPageError("Please select a chit month to assign.");
        return;
      }

      setLoading(true);
      await onAssignment({
        member_id: memberId,
        chit_id: createdChit.id,
        chit_month: selectedMonth,
      });
      setLoading(false);
    };

    // --- STEP 1: Chit Details (Initial Create) ---
    if (!createdChit) {
      return (
        <div className="my-4" ref={scrollRef}>
          {pageError && (
            <Message type="error" onClose={() => setPageError(null)}>
              {pageError}
            </Message>
          )}
          {success && <Message type="success">{success}</Message>}

          <form onSubmit={handleSubmit(handleSaveChit)}>
            <ChitDetailsForm
              mode="create"
              control={control}
              register={register}
              errors={errors}
              onEnterKeyOnLastInput={handleSubmit(handleSaveChit)}
            />
            <div className="mt-6">
              <Button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <>
                    <Save className="mr-2 w-5 h-5" /> Save Chit
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      );
    }

    // --- STEP 1: Chit Details (Post-Creation Edit) ---
    if (createdChit && step === "details") {
      return (
        <div className="my-4" ref={scrollRef}>
          {pageError && (
            <Message type="error" onClose={() => setPageError(null)}>
              {pageError}
            </Message>
          )}
          {success && <Message type="success">{success}</Message>}

          <form onSubmit={handleSubmit(handleUpdateChit)}>
            <ChitDetailsForm
              mode="create"
              control={control}
              register={register}
              errors={errors}
              isPostCreation={true}
              onEnterKeyOnLastInput={handleSubmit(handleUpdateChit)}
            />
            <div className="mt-6">
              <Button
                type="submit"
                variant="warning"
                disabled={loading}
                className="w-full flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <>
                    <SquarePen className="mr-2 w-5 h-5" /> Update & Continue
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      );
    }

    // --- STEP 2: Payouts Management ---
    if (createdChit && step === "payouts") {
      return (
        <div className="my-4" ref={scrollRef}>
          {pageError && (
            <Message type="error" onClose={() => setPageError(null)}>
              {pageError}
            </Message>
          )}
          {success && <Message type="success">{success}</Message>}

          <h3 className="text-lg font-semibold text-text-primary mb-4 text-center">
            Set Payouts for {createdChit.name}
          </h3>

          <div className="mt-0">
            <PayoutsSection
              mode="edit"
              chitId={createdChit.id}
              showTitle={false}
            />
          </div>

          <div className="mt-6">
            <Button
              type="button"
              variant="primary"
              onClick={handleProceedToMonth}
              disabled={loading}
              className="w-full flex items-center justify-center"
            >
              {loading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <>
                  Skip & Assign Month <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }

    // --- STEP 3: Month Selection ---
    if (createdChit && step === "month") {
      return (
        <div className="my-4" ref={scrollRef}>
          {pageError && (
            <Message type="error" onClose={() => setPageError(null)}>
              {pageError}
            </Message>
          )}

          <h3 className="text-lg font-semibold text-text-primary mb-4 text-center">
            Assign Month in {createdChit.name}
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
                {loading
                  ? "Loading months..."
                  : availableMonths.length > 0
                    ? "Select an available month..."
                    : "No available months"}
              </option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {formatDate(month)}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-6">
            <Button
              type="button"
              variant="success"
              onClick={handleConfirmAssignment}
              disabled={!selectedMonth || loading}
              className="w-full flex items-center justify-center"
            >
              {loading ? (
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

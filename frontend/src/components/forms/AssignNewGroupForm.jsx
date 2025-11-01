// frontend/src/components/forms/AssignNewGroupForm.jsx

import {
  useState,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import GroupDetailsForm from "./GroupDetailsForm";
import PayoutsSection from "../sections/PayoutsSection";
import Button from "../ui/Button";
import Message from "../ui/Message";
import {
  FiSave,
  FiCalendar,
  FiCheck,
  FiLoader,
  FiArrowRight,
  FiEdit,
  FiInfo,
} from "react-icons/fi";
import { createChitGroup, patchChitGroup } from "../../services/chitsService";
import { getUnassignedMonths } from "../../services/assignmentsService";
import useScrollToTop from "../../hooks/useScrollToTop";

// --- Helper Functions (unchanged) ---
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

const AssignNewGroupForm = forwardRef(
  (
    {
      token,
      memberId,
      onAssignment,
      formatDate,
      onGroupNameChange,
      onBackToList,
    },
    ref
  ) => {
    // --- State Management ---
    const [step, setStep] = useState("details"); // 'details', 'payouts', 'month'
    const [createdGroup, setCreatedGroup] = useState(null);
    const [originalData, setOriginalData] = useState(null);
    const [formData, setFormData] = useState({
      name: "",
      chit_value: "",
      group_size: "",
      monthly_installment: "",
      duration_months: "",
      start_date: "",
      end_date: "",
      collection_day: "",
      payout_day: "",
    });
    const [availableMonths, setAvailableMonths] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const scrollRef = useRef(null);
    useScrollToTop(success || error); // Scroll on success/error

    // --- Expose goBack function (unchanged) ---
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

    // --- Auto-clear success messages (unchanged) ---
    useEffect(() => {
      if (success) {
        const timer = setTimeout(() => setSuccess(null), 3000);
        return () => clearTimeout(timer);
      }
    }, [success]);

    // --- Form Validation (unchanged) ---
    const isFormValid = useMemo(
      () =>
        formData.name.trim() !== "" &&
        formData.chit_value.trim() !== "" &&
        formData.group_size.trim() !== "" &&
        formData.monthly_installment.trim() !== "" &&
        formData.duration_months.trim() !== "" &&
        formData.start_date.trim() !== "" &&
        formData.collection_day.trim() !== "" &&
        formData.payout_day.trim() !== "",
      [formData]
    );

    // --- Form Change Handler (unchanged) ---
    const handleFormChange = (e) => {
      const { name, value } = e.target;
      setError(null);
      setSuccess(null);

      setFormData((prevFormData) => {
        let newFormData = { ...prevFormData, [name]: value };

        // Sanitize numeric inputs
        if (
          name === "chit_value" ||
          name === "monthly_installment" ||
          name === "collection_day" ||
          name === "payout_day"
        ) {
          newFormData[name] = value.replace(/[^0-9]/g, "");
        }
        // Update parent's group name display
        else if (name === "name") {
          onGroupNameChange(value);
        }
        // Sync group_size with duration_months
        else if (name === "group_size") {
          newFormData.duration_months = value;
          if (newFormData.start_date.match(/^\d{4}-\d{2}$/)) {
            newFormData.end_date = calculateEndDate(
              newFormData.start_date,
              value
            );
          }
        }
        // Sync duration_months with group_size and recalculate dates
        else if (name === "duration_months") {
          newFormData.group_size = value;
          if (newFormData.start_date.match(/^\d{4}-\d{2}$/)) {
            newFormData.end_date = calculateEndDate(
              newFormData.start_date,
              value
            );
          } else if (newFormData.end_date.match(/^\d{4}-\d{2}$/)) {
            newFormData.start_date = calculateStartDate(
              newFormData.end_date,
              value
            );
          }
        }
        // Handle start_date changes
        else if (name === "start_date" && value.match(/^\d{4}-\d{2}$/)) {
          if (newFormData.duration_months) {
            newFormData.end_date = calculateEndDate(
              value,
              newFormData.duration_months
            );
          } else if (newFormData.end_date.match(/^\d{4}-\d{2}$/)) {
            const newDuration = calculateDuration(value, newFormData.end_date);
            newFormData.duration_months = newDuration;
            newFormData.group_size = newDuration;
          }
        }
        // Handle end_date changes
        else if (name === "end_date" && value.match(/^\d{4}-\d{2}$/)) {
          if (newFormData.duration_months) {
            newFormData.start_date = calculateStartDate(
              value,
              newFormData.duration_months
            );
          } else if (newFormData.start_date.match(/^\d{4}-\d{2}$/)) {
            const newDuration = calculateDuration(
              newFormData.start_date,
              value
            );
            newFormData.duration_months = newDuration;
            newFormData.group_size = newDuration;
          }
        }

        return newFormData;
      });
    };

    // --- Step 1: Save New Group (unchanged) ---
    const handleSaveGroup = async () => {
      if (!isFormValid) return;

      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const dataToSend = {
          ...formData,
          start_date: getFirstDayOfMonth(formData.start_date),
          chit_value: Number(formData.chit_value),
          group_size: Number(formData.group_size),
          monthly_installment: Number(formData.monthly_installment),
          duration_months: Number(formData.duration_months),
          collection_day: Number(formData.collection_day),
          payout_day: Number(formData.payout_day),
        };
        delete dataToSend.end_date;

        const newGroup = await createChitGroup(dataToSend, token);
        setCreatedGroup(newGroup);
        setOriginalData({
          ...formData,
          end_date: toYearMonth(newGroup.end_date),
        });
        setSuccess(`Group "${newGroup.name}" created successfully!`);
        onGroupNameChange(newGroup.name);
        setStep("payouts");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // --- Step 1 (Post-Creation): Update (unchanged) ---
    const handleUpdateGroup = async () => {
      if (!createdGroup) return;

      const changes = {};
      for (const key in formData) {
        if (key !== "end_date" && formData[key] !== originalData[key]) {
          changes[key] = formData[key];
        }
      }

      if (Object.keys(changes).length === 0) {
        setStep("payouts");
        return;
      }

      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const patchData = { ...changes };

        if (patchData.start_date)
          patchData.start_date = getFirstDayOfMonth(patchData.start_date);
        if (patchData.chit_value)
          patchData.chit_value = Number(patchData.chit_value);
        if (patchData.group_size)
          patchData.group_size = Number(patchData.group_size);
        if (patchData.monthly_installment)
          patchData.monthly_installment = Number(patchData.monthly_installment);
        if (patchData.duration_months)
          patchData.duration_months = Number(patchData.duration_months);
        if (patchData.collection_day)
          patchData.collection_day = Number(patchData.collection_day);
        if (patchData.payout_day)
          patchData.payout_day = Number(patchData.payout_day);

        const updatedGroup = await patchChitGroup(
          createdGroup.id,
          patchData,
          token
        );
        setCreatedGroup(updatedGroup);
        setOriginalData({
          ...formData,
          end_date: toYearMonth(updatedGroup.end_date),
        });
        onGroupNameChange(updatedGroup.name);
        setSuccess("Group details updated successfully!");
        setStep("payouts");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // --- Step 2: Proceed to Month (unchanged) ---
    const handleProceedToMonth = async () => {
      if (!createdGroup) return;

      setLoading(true);
      setError(null);

      try {
        const data = await getUnassignedMonths(createdGroup.id, token);
        setAvailableMonths(data.available_months);
        setStep("month");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // --- Step 3: Confirm Assignment (unchanged) ---
    const handleConfirmAssignment = async () => {
      if (!selectedMonth) {
        setError("Please select a chit month to assign.");
        return;
      }

      setLoading(true);
      await onAssignment({
        member_id: memberId,
        chit_group_id: createdGroup.id,
        chit_month: selectedMonth,
      });
      setLoading(false);
    };

    // --- STEP 1: Group Details (Initial Create) ---
    if (!createdGroup) {
      return (
        <div className="my-4" ref={scrollRef}>
          {error && (
            <Message type="error" onClose={() => setError(null)}>
              {error}
            </Message>
          )}
          {success && <Message type="success">{success}</Message>}
          <GroupDetailsForm
            mode="create"
            formData={formData}
            onFormChange={handleFormChange}
            onEnterKeyOnLastInput={handleSaveGroup}
          />
          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              onClick={handleSaveGroup}
              disabled={!isFormValid || loading}
              className="flex items-center justify-center"
            >
              {loading ? (
                <FiLoader className="animate-spin" />
              ) : (
                <>
                  <FiSave className="mr-2" /> Save Group
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }

    // --- STEP 1: Group Details (Post-Creation Edit) ---
    if (createdGroup && step === "details") {
      return (
        <div className="my-4" ref={scrollRef}>
          {error && (
            <Message type="error" onClose={() => setError(null)}>
              {error}
            </Message>
          )}
          {success && <Message type="success">{success}</Message>}
          <GroupDetailsForm
            mode="create"
            formData={formData}
            onFormChange={handleFormChange}
            isPostCreation={true}
            onEnterKeyOnLastInput={handleUpdateGroup}
          />
          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="warning"
              onClick={handleUpdateGroup}
              disabled={loading}
              className="flex items-center justify-center"
            >
              {loading ? (
                <FiLoader className="animate-spin" />
              ) : (
                <>
                  <FiEdit className="mr-2" /> Update & Continue
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }

    // --- STEP 2: Payouts Management ---
    if (createdGroup && step === "payouts") {
      return (
        <div className="my-4" ref={scrollRef}>
          {error && (
            <Message type="error" onClose={() => setError(null)}>
              {error}
            </Message>
          )}
          {success && <Message type="success">{success}</Message>}

          {/* --- MODIFICATION START --- */}

          <h3 className="text-lg font-semibold text-text-primary mb-4 text-center">
            Set Payouts for {createdGroup.name}
          </h3>

          <div className="mt-0">
            {/* Pass showTitle={false} */}
            <PayoutsSection
              mode="edit"
              groupId={createdGroup.id}
              showTitle={false}
            />
          </div>
          {/* --- MODIFICATION END --- */}

          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="primary"
              onClick={handleProceedToMonth}
              disabled={loading}
              className="flex items-center justify-center"
            >
              {loading ? (
                <FiLoader className="animate-spin" />
              ) : (
                <>
                  Skip & Assign Month <FiArrowRight className="ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }

    // --- STEP 3: Month Selection ---
    if (createdGroup && step === "month") {
      return (
        <div className="my-4" ref={scrollRef}>
          {error && (
            <Message type="error" onClose={() => setError(null)}>
              {error}
            </Message>
          )}

          {/* --- MODIFIED: Replaced Message with h3 --- */}
          <h3 className="text-lg font-semibold text-text-primary mb-4 text-center">
            Assign Month in {createdGroup.name}
          </h3>

          <div className="relative flex items-center">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FiCalendar className="w-5 h-5 text-text-secondary" />
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
          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="success"
              onClick={handleConfirmAssignment}
              disabled={!selectedMonth || loading}
              className="flex items-center justify-center"
            >
              {loading ? (
                <FiLoader className="animate-spin" />
              ) : (
                <>
                  <FiCheck className="mr-2" /> Confirm Assignment
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

export default AssignNewGroupForm;

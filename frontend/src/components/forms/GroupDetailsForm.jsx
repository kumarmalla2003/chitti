// frontend/src/components/forms/GroupDetailsForm.jsx

import { useRef, useEffect, useState } from "react";
import Button from "../ui/Button";
import Message from "../ui/Message";
import CustomMonthInput from "../ui/CustomMonthInput";
import { RupeeIcon } from "../ui/Icons";
import {
  FiLoader,
  FiTag,
  FiUsers,
  FiClock,
  FiPlus,
  FiEdit,
} from "react-icons/fi";

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

const GroupDetailsForm = ({
  mode,
  initialData,
  onFormSubmit,
  loading,
  error,
  success,
}) => {
  const [formData, setFormData] = useState(initialData);
  const nameInputRef = useRef(null);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  useEffect(() => {
    if (mode === "create" || mode === "edit") {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [mode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    if (name === "chit_value" || name === "monthly_installment") {
      newFormData[name] = value.replace(/[^0-9]/g, "");
    } else if (name === "group_size") {
      newFormData.duration_months = value;
      if (newFormData.start_date.match(/^\d{4}-\d{2}$/)) {
        newFormData.end_date = calculateEndDate(newFormData.start_date, value);
      }
    } else if (name === "duration_months") {
      newFormData.group_size = value;
      if (newFormData.start_date.match(/^\d{4}-\d{2}$/)) {
        newFormData.end_date = calculateEndDate(newFormData.start_date, value);
      } else if (newFormData.end_date.match(/^\d{4}-\d{2}$/)) {
        newFormData.start_date = calculateStartDate(
          newFormData.end_date,
          value
        );
      }
    } else if (name === "start_date" && value.match(/^\d{4}-\d{2}$/)) {
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
    } else if (name === "end_date" && value.match(/^\d{4}-\d{2}$/)) {
      if (newFormData.start_date.match(/^\d{4}-\d{2}$/)) {
        const newDuration = calculateDuration(newFormData.start_date, value);
        newFormData.duration_months = newDuration;
        newFormData.group_size = newDuration;
      } else if (newFormData.duration_months) {
        newFormData.start_date = calculateStartDate(
          value,
          newFormData.duration_months
        );
      }
    }
    setFormData(newFormData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFormSubmit(formData);
  };

  const isFormDisabled = mode === "view";

  return (
    <form onSubmit={handleSubmit}>
      {success && (
        <Message type="success" title="Success">
          {success}
        </Message>
      )}
      {error && (
        <Message type="error" title="Error" onClose={() => {}}>
          {error}
        </Message>
      )}
      <fieldset disabled={isFormDisabled} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-lg font-medium text-text-secondary mb-1"
          >
            Group Name
          </label>
          <div className="relative flex items-center">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FiTag className="w-5 h-5 text-text-secondary" />
            </span>
            <div className="absolute left-10 h-6 w-px bg-border"></div>
            <input
              ref={nameInputRef}
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
              maxLength={50}
              placeholder="Kasi Malla Family Chit"
              required
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="chit_value"
              className="block text-lg font-medium text-text-secondary mb-1"
            >
              Chit Value
            </label>
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <RupeeIcon className="w-5 h-5 text-text-secondary" />
              </span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <input
                type="text"
                id="chit_value"
                name="chit_value"
                value={
                  formData.chit_value
                    ? parseInt(formData.chit_value).toLocaleString("en-IN")
                    : ""
                }
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
                placeholder="1,00,000"
                required
                inputMode="numeric"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="group_size"
              className="block text-lg font-medium text-text-secondary mb-1"
            >
              Group Size
            </label>
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <FiUsers className="w-5 h-5 text-text-secondary" />
              </span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <input
                type="number"
                id="group_size"
                name="group_size"
                value={formData.group_size}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
                min="1"
                placeholder="20"
                required
              />
            </div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="monthly_installment"
              className="block text-lg font-medium text-text-secondary mb-1"
            >
              Monthly Installment
            </label>
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <RupeeIcon className="w-5 h-5 text-text-secondary" />
              </span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <input
                type="text"
                id="monthly_installment"
                name="monthly_installment"
                value={
                  formData.monthly_installment
                    ? parseInt(formData.monthly_installment).toLocaleString(
                        "en-IN"
                      )
                    : ""
                }
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
                placeholder="5,000"
                required
                inputMode="numeric"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="duration_months"
              className="block text-lg font-medium text-text-secondary mb-1"
            >
              Duration (months)
            </label>
            <div className="relative flex items-center">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <FiClock className="w-5 h-5 text-text-secondary" />
              </span>
              <div className="absolute left-10 h-6 w-px bg-border"></div>
              <input
                type="number"
                id="duration_months"
                name="duration_months"
                value={formData.duration_months}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 text-base bg-background-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70 disabled:cursor-not-allowed"
                min="1"
                placeholder="20"
                required
              />
            </div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="start_date"
              className="block text-lg font-medium text-text-secondary mb-1"
            >
              Start Date
            </label>
            <CustomMonthInput
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
              disabled={isFormDisabled}
            />
          </div>
          <div>
            <label
              htmlFor="end_date"
              className="block text-lg font-medium text-text-secondary mb-1"
            >
              End Date
            </label>
            <CustomMonthInput
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              disabled={isFormDisabled}
            />
          </div>
        </div>
      </fieldset>
      {!isFormDisabled && (
        <Button
          type="submit"
          className="w-full mt-8"
          variant={mode === "create" ? "success" : "warning"}
          disabled={loading}
        >
          {loading ? (
            <FiLoader className="animate-spin mx-auto" />
          ) : mode === "create" ? (
            <>
              <FiPlus className="inline-block mr-2" />
              Create Chit Group
            </>
          ) : (
            <>
              <FiEdit className="inline-block mr-2" />
              Update Chit Group
            </>
          )}
        </Button>
      )}
    </form>
  );
};

export default GroupDetailsForm;

// frontend/src/components/forms/AssignNewMemberForm.jsx

import { useState, useEffect } from "react";
import MemberDetailsForm from "./MemberDetailsForm";
import Button from "../ui/Button";
import Message from "../ui/Message";
import { FiSave, FiCalendar, FiCheck, FiLoader } from "react-icons/fi";
import { createMember } from "../../services/membersService";

const AssignNewMemberForm = ({
  token,
  groupId,
  availableMonths,
  onAssignment,
  formatDate,
}) => {
  const [formData, setFormData] = useState({ full_name: "", phone_number: "" });
  const [createdMember, setCreatedMember] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [memberCreatedSuccess, setMemberCreatedSuccess] = useState(null);

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (memberCreatedSuccess) {
      const timer = setTimeout(() => {
        setMemberCreatedSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [memberCreatedSuccess]);

  useEffect(() => {
    // Auto-focus the name input when the form appears
    setTimeout(() => {
      const input = document.getElementById("full_name");
      if (input) {
        input.focus();
      }
    }, 100);
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === "phone_number") {
      processedValue = value.replace(/\D/g, "").slice(0, 10);
    }
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleCreateMember = async (e) => {
    // CRITICAL: Prevent both default behavior and propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!formData.full_name || formData.phone_number.length !== 10) {
      setError("Please provide a full name and a valid 10-digit phone number.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const newMember = await createMember(formData, token);
      setCreatedMember(newMember);
      setMemberCreatedSuccess(
        `Member "${newMember.full_name}" created successfully!`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAssignment = async (e) => {
    // CRITICAL: Prevent both default behavior and propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!selectedMonth) {
      setError("Please select a chit month to assign.");
      return;
    }

    await onAssignment({
      member_id: createdMember.id,
      chit_group_id: groupId,
      chit_month: selectedMonth,
    });
  };

  // Handle Enter key press in inputs
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();

      if (!createdMember) {
        // If on member creation step
        handleCreateMember(e);
      } else if (selectedMonth) {
        // If on month assignment step and month is selected
        handleConfirmAssignment(e);
      }
    }
  };

  return (
    <div className="my-4">
      {error && (
        <Message type="error" onClose={() => setError(null)}>
          {error}
        </Message>
      )}

      {!createdMember ? (
        // Step 1: Create Member - NO FORM TAG, just a div
        <div onKeyDown={handleKeyDown}>
          <MemberDetailsForm
            formData={formData}
            onFormChange={handleFormChange}
          />
          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              onClick={handleCreateMember}
              disabled={loading}
              className="flex items-center justify-center"
            >
              {loading ? (
                <FiLoader className="animate-spin" />
              ) : (
                <>
                  <FiSave className="mr-2" /> Save
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        // Step 2: Assign Month - NO FORM TAG, just a div
        <div onKeyDown={handleKeyDown}>
          {memberCreatedSuccess && (
            <Message type="success">{memberCreatedSuccess}</Message>
          )}
          <h3 className="text-lg font-semibold text-text-primary mb-4 text-center">
            Assign Month for {createdMember.full_name}
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
            >
              <option value="">Select an available month...</option>
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
              onClick={handleConfirmAssignment}
              variant="success"
              disabled={!selectedMonth}
              className="flex items-center justify-center"
            >
              <FiCheck className="mr-2" /> Confirm Assignment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignNewMemberForm;

// frontend/src/components/sections/PayoutsSection.jsx

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { getPayouts, updatePayout } from "../../services/chitsService";
import useScrollToTop from "../../hooks/useScrollToTop";
import {
  FiLoader,
  FiEdit,
  FiSave,
  FiAlertCircle,
  FiArrowLeft,
  FiTrendingUp,
} from "react-icons/fi";
import { RupeeIcon } from "../ui/Icons";
import Message from "../ui/Message";
import Button from "../ui/Button";
import Table from "../ui/Table";

// --- Helper functions for live formatting ---
const formatAmount = (value) => {
  if (value === 0) return "0";
  if (!value) return "";
  const rawValue = value.toString().replace(/[^0-9.]/g, "");
  const parts = rawValue.split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1];

  const formattedInteger = new Intl.NumberFormat("en-IN").format(integerPart);

  if (decimalPart !== undefined) {
    return `${formattedInteger}.${decimalPart.slice(0, 2)}`;
  }
  return formattedInteger;
};

const unformatAmount = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  return value.toString().replace(/,/g, "");
};

const PayoutsSection = ({ groupId, mode, showTitle = true }) => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editAmounts, setEditAmounts] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const { token } = useSelector((state) => state.auth);

  useScrollToTop(success);

  const fetchPayouts = async (showLoading = true) => {
    if (!groupId) {
      setLoading(false);
      return;
    }
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const data = await getPayouts(groupId, token);
      data.payouts.sort((a, b) => a.month - b.month);
      setPayouts(data.payouts);
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [groupId, token]);

  // Timer to clear success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleEditClick = () => {
    const initialAmounts = payouts.reduce((acc, payout) => {
      acc[payout.id] = formatAmount(payout.payout_amount);
      return acc;
    }, {});
    setEditAmounts(initialAmounts);
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleAmountChange = (payoutId, value) => {
    setEditAmounts((prev) => ({
      ...prev,
      [payoutId]: formatAmount(value),
    }));
  };

  const handleSaveClick = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const updatePromises = payouts
      .map((payout) => {
        const editedAmountRaw = unformatAmount(editAmounts[payout.id]);
        const editedAmount =
          editedAmountRaw === "" ? 0 : parseFloat(editedAmountRaw);

        if (isNaN(editedAmount) || editedAmount < 0) {
          throw new Error(
            `Invalid amount for Month ${payout.month}. Please enter a valid number.`
          );
        }
        if (payout.payout_amount !== editedAmount) {
          return updatePayout(
            payout.id,
            { payout_amount: editedAmount },
            token
          );
        }
        return null;
      })
      .filter(Boolean);

    try {
      await Promise.all(updatePromises);
      setIsEditing(false);
      await fetchPayouts(false);
      setSuccess("Payouts have been updated successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputKeyDown = (e, isLastInput) => {
    if (e.key === "Enter" && isLastInput) {
      e.preventDefault();
      handleSaveClick();
    }
  };

  const columns = [
    {
      header: "Month",
      accessor: "month",
      className: "text-center font-medium w-1/4",
    },
    {
      header: "Payout",
      accessor: "payout_amount",
      className: `text-center ${isEditing ? "w-3/4" : "w-auto"}`,
      cell: (row, index) => {
        const isEvenRow = index % 2 === 0;
        const isLastInput = index === payouts.length - 1;
        const inputBgClassName = isEvenRow
          ? "bg-background-primary"
          : "bg-background-secondary";

        return isEditing ? (
          <div className="relative w-full mx-auto">
            <RupeeIcon className="w-4 h-4 text-text-secondary absolute top-1/2 left-3 -translate-y-1/2" />
            <input
              type="text"
              inputMode="tel"
              value={editAmounts[row.id] || ""}
              onFocus={(e) => {
                if (e.target.value === "") {
                  handleAmountChange(row.id, "0");
                }
                // Place cursor at the end
                setTimeout(() => {
                  e.target.setSelectionRange(
                    e.target.value.length,
                    e.target.value.length
                  );
                }, 0);
              }}
              onChange={(e) => handleAmountChange(row.id, e.target.value)}
              onKeyDown={(e) => handleInputKeyDown(e, isLastInput)}
              className={`w-full text-center ${inputBgClassName} border border-border rounded-md pl-8 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-accent`}
            />
          </div>
        ) : (
          <span className="text-text-secondary flex items-center justify-center">
            {row.payout_amount === 0 ? (
              "-"
            ) : (
              <>
                <RupeeIcon className="w-4 h-4 mr-1" />
                {formatAmount(row.payout_amount)}
              </>
            )}
          </span>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <FiLoader className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!groupId) {
    return (
      <p className="text-center text-text-secondary py-4">
        Create the group first to manage payouts.
      </p>
    );
  }

  return (
    <div>
      {/* --- MODIFICATION START --- */}
      {/* Conditionally render the heading and hr */}
      {showTitle && (
        <>
          <div className="relative flex justify-center items-center mb-2">
            {isEditing && (
              <button
                onClick={() => setIsEditing(false)}
                className="absolute left-0 text-text-primary hover:text-accent"
              >
                <FiArrowLeft className="w-6 h-6" />
              </button>
            )}
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <FiTrendingUp /> {isEditing ? "Edit Payouts" : "Payouts"}
            </h2>
          </div>
          <hr className="border-border mb-4" />
        </>
      )}
      {/* --- MODIFICATION END --- */}

      {success && (
        <Message type="success" title="Success">
          {success}
        </Message>
      )}
      {error && (
        <Message type="error" title="Error" onClose={() => setError(null)}>
          {error}
        </Message>
      )}

      {!isEditing && mode !== "view" && payouts.length > 0 && (
        <div className="mb-4">
          <Button
            onClick={handleEditClick}
            variant="primary"
            className="w-full"
          >
            <FiEdit className="inline mr-2" />
            Edit Payouts
          </Button>
        </div>
      )}

      {payouts.length > 0 ? (
        <Table columns={columns} data={payouts} variant="secondary" />
      ) : (
        <div className="text-center py-8">
          <FiAlertCircle className="mx-auto h-8 w-8 text-text-secondary opacity-50" />
          <p className="mt-2 text-sm text-text-secondary">
            No payout data is available for this group.
          </p>
        </div>
      )}

      {isEditing && (
        <div className="mt-6 flex items-center justify-end">
          <Button
            onClick={handleSaveClick}
            variant="success"
            disabled={isSaving}
            className="flex items-center justify-center"
          >
            {isSaving ? (
              <FiLoader className="animate-spin" />
            ) : (
              <>
                <FiSave />
                <span className="ml-2">Save Changes</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PayoutsSection;

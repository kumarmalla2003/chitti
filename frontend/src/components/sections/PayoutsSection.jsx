// frontend/src/components/sections/PayoutsSection.jsx

import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  getPayouts,
  updatePayout,
  getChitById,
} from "../../services/chitsService";
import useScrollToTop from "../../hooks/useScrollToTop";
import {
  FiLoader,
  FiEdit,
  FiSave,
  FiAlertCircle,
  FiArrowLeft,
  FiTrendingUp,
  FiArrowRight,
} from "react-icons/fi";
import { RupeeIcon } from "../ui/Icons";
import Message from "../ui/Message";
import Button from "../ui/Button";
import Table from "../ui/Table";
import useCursorTracking from "../../hooks/useCursorTracking";

const ITEMS_PER_PAGE = 10;

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

// Helper to Calculate Date from Month Index
const calculatePayoutDate = (startDateStr, monthIndex) => {
  if (!startDateStr) return `Month ${monthIndex}`;
  const d = new Date(startDateStr);
  // Add months: (monthIndex - 1) because month 1 is the start date
  d.setMonth(d.getMonth() + (monthIndex - 1));

  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${year}`;
};

const EditablePayoutInput = ({ value, onChange, onKeyDown, isLastInput }) => {
  const inputRef = useRef(null);
  const trackCursor = useCursorTracking(inputRef, value, /\d/);

  return (
    <div className="relative w-full mx-auto">
      <RupeeIcon className="w-4 h-4 text-text-secondary absolute top-1/2 left-2 -translate-y-1/2" />{" "}
      {/* Adjusted left-2 */}
      <input
        ref={inputRef}
        type="text"
        inputMode="tel"
        value={value || ""}
        onFocus={(e) => {
          if (e.target.value === "") {
            onChange("0");
          }
          setTimeout(() => {
            e.target.setSelectionRange(
              e.target.value.length,
              e.target.value.length
            );
          }, 0);
        }}
        onChange={(e) => {
          trackCursor(e);
          onChange(e.target.value);
        }}
        onKeyDown={(e) => onKeyDown(e, isLastInput)}
        className="w-full text-center bg-background-secondary border border-border rounded-md pl-6 pr-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent" /* Adjusted pl-6 and text-sm */
      />
    </div>
  );
};

const PayoutsSection = ({ chitId, mode, showTitle = true }) => {
  const [payouts, setPayouts] = useState([]);
  const [chitStartDate, setChitStartDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editAmounts, setEditAmounts] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useScrollToTop(success);

  const fetchData = async () => {
    if (!chitId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      // Fetch both Payouts and Chit Details (to get start_date)
      const [payoutsData, chitData] = await Promise.all([
        getPayouts(chitId, token),
        getChitById(chitId, token),
      ]);

      payoutsData.payouts.sort((a, b) => a.month - b.month);
      setPayouts(payoutsData.payouts);
      setChitStartDate(chitData.start_date);

      setCurrentPage(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [chitId, token]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleEditClick = () => {
    if (mode === "view") {
      navigate(`/chits/edit/${chitId}`, { state: { initialTab: "payouts" } });
      return;
    }

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
      // Re-fetch to sync state
      const payoutsData = await getPayouts(chitId, token);
      payoutsData.payouts.sort((a, b) => a.month - b.month);
      setPayouts(payoutsData.payouts);

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
    // --- S.No Column (1/8th = 12.5%) ---
    // ADDED !px-1 to override default padding and fit mobile screens
    {
      header: "S.No",
      cell: (row, index) => {
        const offset =
          mode === "view" && !isEditing
            ? (currentPage - 1) * ITEMS_PER_PAGE
            : 0;
        return offset + index + 1;
      },
      className: "text-center text-text-secondary text-sm",
      headerClassName: "w-[20%] !pr-1 text-xs md:text-sm",
      cellClassName: "text-center w-[20%] !pr-1",
    },
    // --- Month Column (1/4th = 25%) ---
    // ADDED !px-1
    {
      header: "Month",
      accessor: "month",
      className: "text-center font-medium text-sm",
      headerClassName: "w-[30%] !px-1 text-xs md:text-sm",
      cellClassName: "w-[30%] !px-1",
      cell: (row) => (
        <div className="text-center w-full">
          {calculatePayoutDate(chitStartDate, row.month)}
        </div>
      ),
    },
    // --- Payout Column (5/8th = 62.5%) ---
    // ADDED !px-1
    {
      header: "Payout",
      accessor: "payout_amount",
      className: "text-center",
      headerClassName: "w-[50%] !pl-1 text-xs md:text-sm",
      cellClassName: "w-[50%] !pl-1",
      cell: (row, index) => {
        const isLastInput = index === payouts.length - 1;

        return isEditing ? (
          <EditablePayoutInput
            value={editAmounts[row.id]}
            onChange={(val) => handleAmountChange(row.id, val)}
            onKeyDown={handleInputKeyDown}
            isLastInput={isLastInput}
          />
        ) : (
          <span className="text-text-secondary flex items-center justify-center text-sm">
            {row.payout_amount === 0 ? (
              "-"
            ) : (
              <>
                <RupeeIcon className="w-3.5 h-3.5 mr-1" />
                {formatAmount(row.payout_amount)}
              </>
            )}
          </span>
        );
      },
    },
  ];

  // --- PAGINATION LOGIC ---
  const totalPages = Math.ceil(payouts.length / ITEMS_PER_PAGE);
  const paginatedPayouts =
    mode === "view" && !isEditing
      ? payouts.slice(
          (currentPage - 1) * ITEMS_PER_PAGE,
          currentPage * ITEMS_PER_PAGE
        )
      : payouts;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <FiLoader className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!chitId) {
    return (
      <p className="text-center text-text-secondary py-4">
        Create the chit first to manage payouts.
      </p>
    );
  }

  return (
    <div>
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
            {mode === "view" && (
              <button
                onClick={handleEditClick}
                className="absolute right-0 p-1 text-warning-accent hover:bg-warning-bg rounded-full transition-colors duration-200 print:hidden"
                title="Edit Payouts"
              >
                <FiEdit className="w-5 h-5" />
              </button>
            )}
          </div>
          <hr className="border-border mb-4" />
        </>
      )}

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
        <>
          <Table
            columns={columns}
            data={paginatedPayouts}
            variant="secondary"
          />

          {mode === "view" && !isEditing && totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 w-full px-2 text-sm text-text-secondary">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-full hover:bg-background-secondary hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Previous Page"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>

              <span className="font-medium">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-full hover:bg-background-secondary hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="Next Page"
              >
                <FiArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <FiAlertCircle className="mx-auto h-8 w-8 text-text-secondary opacity-50" />
          <p className="mt-2 text-sm text-text-secondary">
            No payout data is available for this chit.
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

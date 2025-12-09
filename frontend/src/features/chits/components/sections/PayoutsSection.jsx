// frontend/src/features/chits/components/sections/PayoutsSection.jsx

import { useState, useEffect, useRef, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  updatePayout,
  getPayoutsByChitId,
} from "../../../../services/payoutsService";
import { getChitById } from "../../../../services/chitsService";
import { getAssignmentsForChit } from "../../../../services/assignmentsService";
import useScrollToTop from "../../../../hooks/useScrollToTop";
import {
  Loader2,
  Save,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  SquarePen,
  IndianRupee,
  Search,
} from "lucide-react";
import Message from "../../../../components/ui/Message";
import Button from "../../../../components/ui/Button";
import Table from "../../../../components/ui/Table";
import StatusBadge from "../../../../components/ui/StatusBadge";
import useCursorTracking from "../../../../hooks/useCursorTracking";

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

// Helper for Paid Date: DD/MM/YYYY
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const calculatePayoutDate = (startDateStr, monthIndex) => {
  if (!startDateStr) return `Month ${monthIndex}`;
  const d = new Date(startDateStr);
  d.setMonth(d.getMonth() + (monthIndex - 1));
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${month}/${year}`;
};

const isSameMonthYear = (d1, d2) => {
  return (
    d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth()
  );
};

const EditablePayoutInput = ({ value, onChange, onKeyDown, isLastInput }) => {
  const inputRef = useRef(null);
  const trackCursor = useCursorTracking(inputRef, value, /\d/);

  return (
    <div className="relative w-full mx-auto">
      <IndianRupee className="w-3.5 h-3.5 text-text-secondary absolute top-1/2 left-2 -translate-y-1/2" />
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
        className="w-full text-center bg-background-secondary border border-border rounded-md pl-6 pr-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>
  );
};

const PayoutsSection = ({ chitId, mode, showTitle = true }) => {
  const [payouts, setPayouts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [chitStartDate, setChitStartDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editAmounts, setEditAmounts] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

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
      const [payoutsData, chitData, assignmentsData] = await Promise.all([
        getPayoutsByChitId(chitId, token),
        getChitById(chitId, token),
        getAssignmentsForChit(chitId, token),
      ]);

      const sortedPayouts = Array.isArray(payoutsData.payouts)
        ? payoutsData.payouts.sort((a, b) => a.month - b.month)
        : [];

      setPayouts(sortedPayouts);
      setAssignments(assignmentsData.assignments || []);
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

  const mergedPayouts = useMemo(() => {
    if (!chitStartDate) return payouts;

    return payouts.map((payout) => {
      if (payout.member) {
        return { ...payout, displayMember: payout.member.full_name };
      }

      const payoutDateObj = new Date(chitStartDate);
      payoutDateObj.setMonth(payoutDateObj.getMonth() + (payout.month - 1));

      const foundAssignment = assignments.find((a) => {
        const assignmentDate = new Date(a.chit_month);
        return isSameMonthYear(assignmentDate, payoutDateObj);
      });

      return {
        ...payout,
        displayMember: foundAssignment ? foundAssignment.member.full_name : "-",
      };
    });
  }, [payouts, assignments, chitStartDate]);

  const filteredPayouts = useMemo(() => {
    if (!searchQuery) return mergedPayouts;
    const lowerQuery = searchQuery.toLowerCase();
    return mergedPayouts.filter(
      (p) =>
        p.displayMember.toLowerCase().includes(lowerQuery) ||
        p.month.toString().includes(lowerQuery)
    );
  }, [mergedPayouts, searchQuery]);

  const handleEditClick = () => {
    if (mode === "view") {
      setIsEditing(true);
      const initialAmounts = payouts.reduce((acc, payout) => {
        acc[payout.id] = formatAmount(payout.planned_amount);
        return acc;
      }, {});
      setEditAmounts(initialAmounts);
      return;
    }

    const initialAmounts = payouts.reduce((acc, payout) => {
      acc[payout.id] = formatAmount(payout.planned_amount);
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
          throw new Error(`Invalid amount for Month ${payout.month}.`);
        }
        if (payout.planned_amount !== editedAmount) {
          return updatePayout(
            payout.id,
            { planned_amount: editedAmount },
            token
          );
        }
        return null;
      })
      .filter(Boolean);

    try {
      await Promise.all(updatePromises);
      setIsEditing(false);
      await fetchData();
      setSuccess("Payouts updated successfully!");
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

  const columns = useMemo(() => {
    const indexColumn = {
      header: "S.No",
      cell: (row, index) => {
        const offset =
          mode === "view" && !isEditing
            ? (currentPage - 1) * ITEMS_PER_PAGE
            : 0;
        return offset + index + 1;
      },
      className: "text-center text-text-secondary text-sm",
      headerClassName: "w-[10%] text-xs md:text-sm text-center",
      cellClassName: "text-center w-[10%]",
    };

    const monthColumn = {
      header: "Month",
      accessor: "month",
      className: "text-center font-medium text-sm",
      headerClassName: "w-[15%] text-xs md:text-sm text-center",
      cellClassName: "w-[15%]",
      cell: (row) => calculatePayoutDate(chitStartDate, row.month),
    };

    if (mode === "view" && !isEditing) {
      return [
        indexColumn,
        monthColumn,
        {
          header: "Payout Amount", // RENAMED from "Payout"
          accessor: "planned_amount",
          className: "text-center font-medium",
          headerClassName: "text-center",
          cell: (row) => (
            <span className="text-text-primary">
              ₹{formatAmount(row.planned_amount)}
            </span>
          ),
        },
        {
          header: "Amount Paid",
          accessor: "amount",
          className: "text-center font-medium",
          headerClassName: "text-center",
          cell: (row) => (
            <span
              className={
                row.amount > 0 ? "text-success-accent" : "text-text-secondary"
              }
            >
              {row.amount > 0 ? `₹${formatAmount(row.amount)}` : "-"}
            </span>
          ),
        },
        {
          header: "Paid Date",
          accessor: "paid_date",
          className: "text-center text-sm text-text-secondary",
          headerClassName: "text-center",
          cell: (row) => formatDate(row.paid_date),
        },
        {
          header: "Status",
          accessor: "status",
          className: "text-center",
          headerClassName: "text-center",
          cell: (row) => (
            <div className="flex justify-center">
              {row.paid_date ? (
                <StatusBadge status="Paid" />
              ) : (
                // UPDATED: Standard Warning Color for Pending
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-warning-bg text-warning-accent">
                  Pending
                </span>
              )}
            </div>
          ),
        },
      ];
    }

    // EDIT/CREATE MODE
    return [
      indexColumn,
      monthColumn,
      {
        header: "Payout Amount",
        accessor: "planned_amount",
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
              {row.planned_amount === 0 ? (
                "-"
              ) : (
                <>
                  <IndianRupee className="w-3.5 h-3.5 mr-1" />
                  {formatAmount(row.planned_amount)}
                </>
              )}
            </span>
          );
        },
      },
    ];
  }, [
    mode,
    isEditing,
    payouts,
    currentPage,
    editAmounts,
    chitStartDate,
    mergedPayouts,
  ]);

  const totalPages = Math.ceil(filteredPayouts.length / ITEMS_PER_PAGE);
  const paginatedPayouts =
    mode === "view" && !isEditing
      ? filteredPayouts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
      )
      : filteredPayouts;

  const displayData = isEditing && mode !== "view" ? payouts : paginatedPayouts;

  if (loading)
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  if (!chitId)
    return (
      <p className="text-center text-text-secondary py-4">
        Create the chit first to manage payouts.
      </p>
    );

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
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />{" "}
              {isEditing ? "Edit Payouts" : "Payout Schedule"}
            </h2>
          </div>
          <hr className="border-border mb-4" />
        </>
      )}

      {/* Search Bar - View Mode Only */}
      {mode === "view" && !isEditing && (
        <div className="relative flex items-center mb-4">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="w-5 h-5 text-text-secondary" />
          </span>
          <div className="absolute left-10 h-6 w-px bg-border"></div>
          <input
            type="text"
            placeholder="Search by member..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-background-secondary border rounded-md focus:outline-none focus:ring-2 border-border focus:ring-accent"
          />
        </div>
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
            <SquarePen className="w-5 h-5 inline mr-2" />
            Edit Payouts
          </Button>
        </div>
      )}

      {payouts.length > 0 ? (
        <>
          <Table columns={columns} data={displayData} variant="secondary" />
          {mode === "view" && !isEditing && totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 w-full px-2 text-sm text-text-secondary">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-full hover:bg-background-secondary hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
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
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <AlertCircle className="mx-auto h-8 w-8 text-text-secondary opacity-50" />
          <p className="mt-2 text-sm text-text-secondary">
            No payout data available.
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
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
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

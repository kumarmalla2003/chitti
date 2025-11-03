// frontend/src/components/sections/PaymentHistoryList.jsx

import { useState, useEffect, useMemo } from "react"; // <-- IMPORT useState & useMemo
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Table from "../ui/Table";
import Message from "../ui/Message";
import { FiLoader, FiAlertCircle, FiSearch } from "react-icons/fi"; // <-- IMPORT FiSearch
import {
  getPaymentsByGroupId,
  getPaymentsByMemberId,
} from "../../services/paymentsService";
import PaymentHistoryCard from "../ui/PaymentHistoryCard";

const PaymentHistoryList = ({ groupId, memberId }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // --- NEW: State for search query ---
  const [searchQuery, setSearchQuery] = useState("");

  const viewType = groupId ? "group" : "member";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        let data;
        if (groupId) {
          data = await getPaymentsByGroupId(groupId, token);
        } else if (memberId) {
          data = await getPaymentsByMemberId(memberId, token);
        }
        setPayments(data.payments);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token && (groupId || memberId)) {
      fetchData();
    }
  }, [groupId, memberId, token]);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  // --- NEW: Filtered payments memo ---
  const filteredPayments = useMemo(() => {
    if (!searchQuery) return payments;
    const lowercasedQuery = searchQuery.toLowerCase();
    return payments.filter((p) => {
      const amountMatch = p.amount_paid.toString().includes(lowercasedQuery);
      const methodMatch = p.payment_method
        .toLowerCase()
        .includes(lowercasedQuery);

      if (viewType === "group") {
        const memberMatch = p.member.full_name
          .toLowerCase()
          .includes(lowercasedQuery);
        return memberMatch || amountMatch || methodMatch;
      } else {
        // viewType === 'member'
        const groupMatch = p.chit_group.name
          .toLowerCase()
          .includes(lowercasedQuery);
        return groupMatch || amountMatch || methodMatch;
      }
    });
  }, [payments, searchQuery, viewType]);

  // --- NEW: Dynamic placeholder for search ---
  const searchPlaceholder =
    viewType === "group"
      ? "Search by member, amount, or method..."
      : "Search by group, amount, or method...";

  const columns = [
    {
      header: "Date",
      accessor: "payment_date",
      cell: (row) => formatDate(row.payment_date),
      className: "text-center",
    },
    ...(memberId
      ? [
          {
            header: "Group",
            accessor: "chit_group.name",
            className: "text-left",
          },
        ]
      : []),
    ...(groupId
      ? [
          {
            header: "Member",
            accessor: "member.full_name",
            className: "text-left",
          },
        ]
      : []),
    {
      header: "Amount",
      accessor: "amount_paid",
      cell: (row) => `₹${row.amount_paid.toLocaleString("en-IN")}/-`,
      className: "text-center",
    },
    {
      header: "Method",
      accessor: "payment_method",
      className: "text-center",
    },
    {
      header: "Notes",
      accessor: "notes",
      className: "text-left truncate max-w-xs",
      cell: (row) => row.notes || "-",
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <FiLoader className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return <Message type="error">{error}</Message>;
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <FiAlertCircle className="mx-auto h-8 w-8 text-text-secondary opacity-50" />
        <p className="mt-2 text-sm text-text-secondary">
          No payments have been logged yet.
        </p>
      </div>
    );
  }

  // --- MODIFICATION: Updated render logic ---
  return (
    <>
      {/* --- NEW: Search Bar --- */}
      {payments.length > 1 && (
        <div className="relative flex items-center mb-4">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <FiSearch className="w-5 h-5 text-text-secondary" />
          </span>
          <div className="absolute left-10 h-6 w-px bg-border"></div>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-background-secondary border rounded-md focus:outline-none focus:ring-2 border-border focus:ring-accent"
          />
        </div>
      )}

      {/* --- NEW: Conditional render for no results --- */}
      {filteredPayments.length === 0 ? (
        <div className="text-center py-8">
          <FiSearch className="mx-auto h-8 w-8 text-text-secondary opacity-50" />
          <p className="mt-2 text-sm text-text-secondary">
            No payments found matching "{searchQuery}".
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table
              columns={columns}
              data={filteredPayments} // <-- Use filtered data
              variant="secondary"
              onRowClick={(row) => navigate(`/payments/view/${row.id}`)}
            />
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden space-y-4">
            {filteredPayments.map(
              (
                payment // <-- Use filtered data
              ) => (
                <PaymentHistoryCard
                  key={payment.id}
                  payment={payment}
                  viewType={viewType}
                  onClick={() => navigate(`/payments/view/${payment.id}`)}
                />
              )
            )}
          </div>
        </>
      )}
    </>
  );
};

export default PaymentHistoryList;

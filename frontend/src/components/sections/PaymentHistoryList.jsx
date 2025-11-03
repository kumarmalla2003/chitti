// frontend/src/components/sections/PaymentHistoryList.jsx

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom"; // <-- IMPORT
import Table from "../ui/Table";
import Message from "../ui/Message";
import { FiLoader, FiAlertCircle } from "react-icons/fi";
import { RupeeIcon } from "../ui/Icons";
import {
  getPaymentsByGroupId,
  getPaymentsByMemberId,
} from "../../services/paymentsService";

const PaymentHistoryList = ({ groupId, memberId }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate(); // <-- ADD HOOK

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
      cell: (row) => `₹${row.amount_paid.toLocaleString("en-IN")}`,
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

  return (
    <Table
      columns={columns}
      data={payments}
      variant="secondary"
      onRowClick={(row) => navigate(`/payments/view/${row.id}`)} // <-- ADD THIS
    />
  );
};

export default PaymentHistoryList;

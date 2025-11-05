// frontend/src/components/sections/PaymentHistoryList.jsx

import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Table from "../ui/Table";
import Message from "../ui/Message";
import Button from "../ui/Button";
import PaymentDetailsForm from "../forms/PaymentDetailsForm";
import Card from "../ui/Card";
import {
  FiLoader,
  FiAlertCircle,
  FiSearch,
  FiPlus,
  FiArrowLeft,
} from "react-icons/fi";
import { RupeeIcon } from "../ui/Icons";
import {
  getPaymentsByChitId,
  getPaymentsByMemberId,
  createPayment,
} from "../../services/paymentsService";
import PaymentHistoryCard from "../ui/PaymentHistoryCard";
import useScrollToTop from "../../hooks/useScrollToTop";

const PaymentHistoryList = ({
  chitId,
  memberId,
  mode,
  paymentDefaults, // <-- ADDED
  setPaymentDefaults, // <-- ADDED
}) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState("list"); // 'list' or 'create'
  const [formData, setFormData] = useState({
    chit_assignment_id: "",
    amount_paid: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "Cash",
    notes: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  useScrollToTop(formSuccess || formError);

  const viewType = chitId ? "chit" : "member";

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (chitId) {
        data = await getPaymentsByChitId(chitId, token);
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

  useEffect(() => {
    if (token && (chitId || memberId)) {
      fetchData();
    }
  }, [chitId, memberId, token]);

  useEffect(() => {
    if (formSuccess) {
      const timer = setTimeout(() => setFormSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [formSuccess]);

  // --- ADDED THIS EFFECT ---
  useEffect(() => {
    if (paymentDefaults) {
      setView("create"); // Open the form
      // Pre-fill the assignment ID in the form data
      setFormData((prev) => ({
        ...prev,
        chit_assignment_id: paymentDefaults.assignmentId,
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: "Cash",
        amount_paid: "",
        notes: "",
      }));
      setFormError(null);
      setFormSuccess(null);
    }
  }, [paymentDefaults]);
  // --- END ADD ---

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const filteredPayments = useMemo(() => {
    if (!searchQuery) return payments;
    const lowercasedQuery = searchQuery.toLowerCase();
    return payments.filter((p) => {
      const amountMatch = p.amount_paid.toString().includes(lowercasedQuery);
      const methodMatch = p.payment_method
        .toLowerCase()
        .includes(lowercasedQuery);

      if (viewType === "chit") {
        const memberMatch = p.member.full_name
          .toLowerCase()
          .includes(lowercasedQuery);
        return memberMatch || amountMatch || methodMatch;
      } else {
        const chitMatch = p.chit.name.toLowerCase().includes(lowercasedQuery);
        return chitMatch || amountMatch || methodMatch;
      }
    });
  }, [payments, searchQuery, viewType]);

  const searchPlaceholder =
    viewType === "chit"
      ? "Search by member, amount, or method..."
      : "Search by chit, amount, or method...";

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
            header: "Chit",
            accessor: "chit.name",
            className: "text-left",
          },
        ]
      : []),
    ...(chitId
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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormError(null);
    setFormSuccess(null);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const dataToSend = {
        ...formData,
        amount_paid: parseFloat(formData.amount_paid.replace(/,/g, "")),
        chit_assignment_id: parseInt(formData.chit_assignment_id),
      };

      await createPayment(dataToSend, token);
      setFormSuccess("Payment logged successfully!");
      setFormData({
        chit_assignment_id: "",
        amount_paid: "",
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: "Cash",
        notes: "",
      });
      setView("list");
      fetchData();
      if (setPaymentDefaults) {
        // <-- MODIFIED
        setPaymentDefaults(null); // Clear the defaults
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleShowForm = () => {
    setView("create");
    setFormError(null);
    setFormSuccess(null);
    if (setPaymentDefaults) {
      // <-- MODIFIED
      setPaymentDefaults(null); // Clear any defaults
    }
  };

  const handleShowList = () => {
    setView("list");
    setFormError(null);
    if (setPaymentDefaults) {
      // <-- MODIFIED
      setPaymentDefaults(null); // Clear defaults when manually going back
    }
  };

  const headerTitle = view === "list" ? "Payments" : "Log New Payment";

  if (loading) {
    return (
      <Card className="flex-1 flex flex-col">
        <div className="flex justify-center items-center py-8">
          <FiLoader className="w-6 h-6 animate-spin text-accent" />
        </div>
      </Card>
    );
  }

  if (error) {
    return <Message type="error">{error}</Message>;
  }

  return (
    <Card className="flex-1 flex flex-col">
      <div className="relative flex justify-center items-center mb-2">
        {view === "create" && (
          <button
            type="button"
            onClick={handleShowList}
            className="absolute left-0 text-text-primary hover:text-accent"
          >
            <FiArrowLeft className="w-6 h-6" />
          </button>
        )}
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <RupeeIcon className="w-5 h-5" /> {headerTitle}
        </h2>
      </div>
      <hr className="border-border mb-4" />

      {/* --- Render Create View --- */}
      {view === "create" ? (
        <form onSubmit={handleFormSubmit}>
          {formSuccess && <Message type="success">{formSuccess}</Message>}
          {formError && (
            <Message type="error" onClose={() => setFormError(null)}>
              {formError}
            </Message>
          )}

          <PaymentDetailsForm
            mode="create"
            formData={formData}
            onFormChange={handleFormChange}
            // --- MODIFIED ---
            defaultAssignmentId={paymentDefaults?.assignmentId}
            defaultChitId={paymentDefaults?.chitId || chitId}
            defaultMemberId={paymentDefaults?.memberId || memberId}
            // --- END MODIFICATION ---
          />
          <div className="flex justify-end mt-6">
            <Button
              type="submit"
              variant="success"
              disabled={formLoading}
              className="w-full"
            >
              {formLoading ? (
                <FiLoader className="animate-spin mx-auto" />
              ) : (
                <>
                  <FiPlus className="inline-block mr-2" />
                  Submit Payment
                </>
              )}
            </Button>
          </div>
        </form>
      ) : (
        // --- Render List View ---
        <>
          {formSuccess && <Message type="success">{formSuccess}</Message>}
          {mode !== "view" && (
            <div className="mb-4">
              <Button
                variant="primary"
                className="w-full md:w-auto flex items-center justify-center"
                onClick={handleShowForm}
              >
                <FiPlus className="mr-2" /> Log New Payment
              </Button>
            </div>
          )}

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

          {payments.length === 0 && (
            <div className="text-center py-8">
              <FiAlertCircle className="mx-auto h-8 w-8 text-text-secondary opacity-50" />
              <p className="mt-2 text-sm text-text-secondary">
                No payments have been logged yet.
              </p>
            </div>
          )}

          {payments.length > 0 && filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <FiSearch className="mx-auto h-8 w-8 text-text-secondary opacity-50" />
              <p className="mt-2 text-sm text-text-secondary">
                No payments found matching "{searchQuery}".
              </p>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <Table
                  columns={columns}
                  data={filteredPayments}
                  variant="secondary"
                  onRowClick={(row) => navigate(`/payments/view/${row.id}`)}
                />
              </div>
              <div className="block md:hidden space-y-4">
                {filteredPayments.map((payment) => (
                  <PaymentHistoryCard
                    key={payment.id}
                    payment={payment}
                    viewType={viewType}
                    onClick={() => navigate(`/payments/view/${payment.id}`)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </Card>
  );
};

export default PaymentHistoryList;

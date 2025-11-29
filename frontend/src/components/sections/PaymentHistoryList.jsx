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
  FiArrowRight,
  FiEdit, // <-- Imported
} from "react-icons/fi";
import { RupeeIcon } from "../ui/Icons";
import {
  getPaymentsByChitId,
  getPaymentsByMemberId,
  createPayment,
} from "../../services/paymentsService";
import PaymentHistoryCard from "../ui/PaymentHistoryCard";
import useScrollToTop from "../../hooks/useScrollToTop";

const ITEMS_PER_PAGE = 10;

const PaymentHistoryList = ({
  chitId,
  memberId,
  mode,
  paymentDefaults,
  setPaymentDefaults,
  forceTable = false,
  onManage, // <-- Prop
}) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState("list");
  const [currentPage, setCurrentPage] = useState(1);

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
      setCurrentPage(1);
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
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (formSuccess) {
      const timer = setTimeout(() => setFormSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [formSuccess]);

  useEffect(() => {
    if (paymentDefaults) {
      setView("create");
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

  // Modified logic: Only for ChitViewDashboard standard usage
  const handleAddPaymentClick = () => {
    if (mode === "view" && chitId) {
      navigate(`/chits/edit/${chitId}`, { state: { initialTab: "payments" } });
    }
  };

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

  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);
  const paginatedPayments =
    mode === "view"
      ? filteredPayments.slice(
          (currentPage - 1) * ITEMS_PER_PAGE,
          currentPage * ITEMS_PER_PAGE
        )
      : filteredPayments;

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
            className: "text-center",
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
      className: "text-center truncate max-w-xs",
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
        setPaymentDefaults(null);
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
      setPaymentDefaults(null);
    }
  };

  const handleShowList = () => {
    setView("list");
    setFormError(null);
    if (setPaymentDefaults) {
      setPaymentDefaults(null);
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

        {/* --- UPDATE: Changed Edit to Add (Plus) Icon --- */}
        {mode === "view" && view === "list" && (
          <button
            onClick={onManage || handleAddPaymentClick}
            className="absolute right-0 p-1 text-success-accent hover:bg-success-bg rounded-full transition-colors duration-200 print:hidden"
            title="Add Payment"
          >
            <FiPlus className="w-5 h-5" />
          </button>
        )}
        {/* --- END UPDATE --- */}
      </div>
      <hr className="border-border mb-4" />

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
            defaultAssignmentId={paymentDefaults?.assignmentId}
            defaultChitId={paymentDefaults?.chitId || chitId}
            defaultMemberId={paymentDefaults?.memberId || memberId}
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

          {payments.length === 0 ? (
            <div className="text-center py-8">
              <FiAlertCircle className="mx-auto h-8 w-8 text-text-secondary opacity-50" />
              <p className="mt-2 text-sm text-text-secondary">
                No payments have been logged yet.
              </p>
            </div>
          ) : (
            <>
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

              {filteredPayments.length === 0 ? (
                <div className="text-center py-8">
                  <FiSearch className="mx-auto h-8 w-8 text-text-secondary opacity-50" />
                  <p className="mt-2 text-sm text-text-secondary">
                    No payments found matching "{searchQuery}".
                  </p>
                </div>
              ) : (
                <>
                  <div
                    className={
                      forceTable ? "block overflow-x-auto" : "hidden md:block"
                    }
                  >
                    <Table
                      columns={columns}
                      data={paginatedPayments}
                      variant="secondary"
                      onRowClick={(row) => navigate(`/payments/view/${row.id}`)}
                    />

                    {mode === "view" && totalPages > 1 && (
                      <div className="flex justify-between items-center mt-4 w-full px-2 text-sm text-text-secondary">
                        <button
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={currentPage === 1}
                          className="p-2 rounded-full hover:bg-background-secondary hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
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
                        >
                          <FiArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {!forceTable && (
                    <div className="block md:hidden space-y-4">
                      {paginatedPayments.map((payment) => (
                        <PaymentHistoryCard
                          key={payment.id}
                          payment={payment}
                          viewType={viewType}
                          onClick={() =>
                            navigate(`/payments/view/${payment.id}`)
                          }
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </Card>
  );
};

export default PaymentHistoryList;

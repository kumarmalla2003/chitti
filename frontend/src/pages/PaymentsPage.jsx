// frontend/src/pages/PaymentsPage.jsx

import { useState, useEffect, useMemo } from "react";
import useScrollToTop from "../hooks/useScrollToTop";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAllPayments, deletePayment } from "../services/paymentsService";
import { useSelector } from "react-redux";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import BottomNav from "../components/layout/BottomNav";
import Message from "../components/ui/Message";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Table from "../components/ui/Table";
import PaymentCard from "../components/ui/PaymentCard";
import ConfirmationModal from "../components/ui/ConfirmationModal";
import {
  FiPlus,
  FiLoader,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiPrinter,
  FiGrid, // <-- Added
  FiList, // <-- Added
} from "react-icons/fi";

// --- REPORT IMPORTS ---
import { pdf } from "@react-pdf/renderer";
import PaymentReportPDF from "../components/reports/PaymentReportPDF";
import PaymentReportModal from "../components/reports/PaymentReportModal";

const PaymentsPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { token } = useSelector((state) => state.auth);

  // --- View Mode State ---
  const [viewMode, setViewMode] = useState(() =>
    window.innerWidth < 768 ? "card" : "table"
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // --- REPORT STATE ---
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  useScrollToTop(success || error);

  // Handle Resize for View Mode
  useEffect(() => {
    const handleResize = () => {
      // Optional: Auto-switch view on resize if desired
      // if (window.innerWidth < 768) setViewMode("card");
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [viewMode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllPayments(token);
      setPayments(data.payments);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleDeleteClick = (payment) => {
    setItemToDelete(payment);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);
    setError(null);
    try {
      await deletePayment(itemToDelete.id, token);
      setPayments((prevPayments) =>
        prevPayments.filter((p) => p.id !== itemToDelete.id)
      );
      setSuccess(`Payment record has been deleted.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteLoading(false);
      setIsModalOpen(false);
      setItemToDelete(null);
    }
  };

  // --- REPORT GENERATION HANDLER ---
  const handleGenerateReport = async (filters) => {
    setReportLoading(true);
    setError(null);
    try {
      // 1. Fetch filtered data.
      const data = await getAllPayments(token, filters);

      if (!data.payments || data.payments.length === 0) {
        setError("No payments found for the selected criteria.");
        setReportLoading(false);
        // We keep the modal open so they can try again
        return;
      }

      // 2. Generate PDF
      const blob = await pdf(
        <PaymentReportPDF payments={data.payments} filters={filters} />
      ).toBlob();

      // 3. Trigger Download
      let filename = "Payment_Report.pdf";

      if (filters.chitName) {
        let name = filters.chitName;
        // Append "Chit" logic
        if (!name.toLowerCase().endsWith("chit")) {
          name += " Chit";
        }
        // Format: "Chit Name Payments Report.pdf" (Spaces preserved)
        filename = `${filters.chitName} Payments Report.pdf`;
      } else if (filters.memberName) {
        // Format: "Member Name Payments Report.pdf" (Spaces preserved)
        filename = `${filters.memberName} Payments Report.pdf`;
      } else if (filters.startDate) {
        // Format dates as DD-MM-YYYY
        const formatDateForFilename = (dateStr) => {
          if (!dateStr) return "";
          const [y, m, d] = dateStr.split("-");
          return `${d}-${m}-${y}`;
        };
        const startStr = formatDateForFilename(filters.startDate);
        const endStr = formatDateForFilename(filters.endDate);

        // Format: "DD-MM-YYYY to DD-MM-YYYY Payments Report.pdf" (Spaces preserved)
        filename = `${startStr} to ${endStr} Payments Report.pdf`;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsReportModalOpen(false);
    } catch (err) {
      console.error("Report generation failed", err);
      setError(err.message || "Failed to generate report.");
    } finally {
      setReportLoading(false);
    }
  };

  const filteredPayments = useMemo(() => {
    if (!searchQuery) return payments;
    const lowercasedQuery = searchQuery.toLowerCase();
    return payments.filter(
      (p) =>
        p.member.full_name.toLowerCase().includes(lowercasedQuery) ||
        p.chit.name.toLowerCase().includes(lowercasedQuery) ||
        p.amount_paid.toString().includes(lowercasedQuery)
    );
  }, [payments, searchQuery]);

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
    {
      header: "Member",
      accessor: "member.full_name",
      className: "text-center",
    },
    {
      header: "Chit",
      accessor: "chit.name",
      className: "text-center",
    },
    {
      header: "Amount",
      accessor: "amount_paid",
      className: "text-center",
      cell: (row) => `₹${row.amount_paid.toLocaleString("en-IN")}`,
    },
    {
      header: "Method",
      accessor: "payment_method",
      className: "text-center",
    },
    {
      header: "Actions",
      accessor: "actions",
      className: "text-center",
      cell: (row) => (
        <div className="flex items-center justify-center space-x-2">
          {/* View Button Removed */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/payments/edit/${row.id}`);
            }}
            className="p-2 text-lg rounded-md text-warning-accent hover:bg-warning-accent hover:text-white transition-colors duration-200 cursor-pointer"
            title="Edit Payment"
          >
            <FiEdit />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(row);
            }}
            className="p-2 text-lg rounded-md text-error-accent hover:bg-error-accent hover:text-white transition-colors duration-200 cursor-pointer"
            title="Delete Payment"
          >
            <FiTrash2 />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div
        className={`transition-all duration-300 ${isMenuOpen ? "blur-sm" : ""}`}
      >
        <Header
          onMenuOpen={() => setIsMenuOpen(true)}
          activeSection="payments"
        />
        <div className="pb-16 md:pb-0">
          <main className="flex-grow min-h-[calc(100vh-128px)] bg-background-primary px-4 py-8">
            <div className="container mx-auto">
              {/* --- HEADER ROW WITH PRINT BUTTON --- */}
              <div className="relative flex justify-center items-center mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary text-center">
                  All Payments
                </h1>

                {/* Print Button */}
                {payments.length > 0 && (
                  <div className="absolute right-0 flex items-center">
                    <button
                      onClick={() => setIsReportModalOpen(true)}
                      className="p-2 text-info-accent hover:bg-info-bg rounded-full transition-colors duration-200 cursor-pointer"
                      title="Generate Report"
                    >
                      <FiPrinter className="w-6 h-6" />
                    </button>
                  </div>
                )}
              </div>

              <hr className="my-4 border-border" />

              {success && <Message type="success">{success}</Message>}
              {error && (
                <Message type="error" onClose={() => setError(null)}>
                  {error}
                </Message>
              )}

              {/* --- CONTROLS ROW: Search + View Toggle --- */}
              <div className="mb-6 flex flex-row gap-2 items-stretch justify-between">
                <div className="relative flex-grow md:max-w-md flex items-center">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <FiSearch className="w-5 h-5 text-text-secondary" />
                  </span>
                  <div className="absolute left-10 h-6 w-px bg-border"></div>
                  <input
                    type="text"
                    placeholder="Search by member, chit, or amount..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-background-secondary border rounded-md focus:outline-none focus:ring-2 border-border focus:ring-accent"
                  />
                </div>

                <div className="flex-shrink-0">
                  <button
                    onClick={() =>
                      setViewMode((prev) =>
                        prev === "table" ? "card" : "table"
                      )
                    }
                    className="h-full px-4 rounded-md bg-background-secondary text-text-secondary hover:bg-background-tertiary transition-all shadow-sm border border-border flex items-center justify-center"
                    title={
                      viewMode === "table"
                        ? "Switch to Card View"
                        : "Switch to Table View"
                    }
                  >
                    {viewMode === "table" ? (
                      <FiGrid className="w-5 h-5" />
                    ) : (
                      <FiList className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {loading && (
                <div className="flex justify-center items-center h-64">
                  <FiLoader className="w-10 h-10 animate-spin text-accent" />
                </div>
              )}

              {!loading && !error && filteredPayments.length === 0 && (
                <Card className="text-center p-8">
                  <h2 className="text-2xl font-bold text-text-primary mb-2">
                    {searchQuery ? "No Matching Payments" : "No Payments Found"}
                  </h2>
                  <p className="text-text-secondary">
                    {searchQuery
                      ? "Try a different search term."
                      : "You haven't logged any payments yet. Click the button below to start!"}
                  </p>
                </Card>
              )}

              {!loading && !error && filteredPayments.length > 0 && (
                <>
                  {/* --- CONDITIONAL RENDERING BASED ON VIEW MODE --- */}
                  {viewMode === "table" ? (
                    <div className="overflow-x-auto rounded-lg shadow-sm">
                      <Table
                        columns={columns}
                        data={filteredPayments}
                        onRowClick={(row) =>
                          navigate(`/payments/view/${row.id}`)
                        }
                      />
                    </div>
                  ) : (
                    // Card View
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredPayments.map((payment) => (
                        <PaymentCard
                          key={payment.id}
                          payment={payment}
                          onEdit={() =>
                            navigate(`/payments/edit/${payment.id}`)
                          }
                          onDelete={() => handleDeleteClick(payment)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
          <Footer />
        </div>
      </div>
      <MobileNav
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeSection="payments"
      />
      <BottomNav />
      <Link to="/payments/create" className="group">
        <Button variant="fab" className="group-hover:scale-110">
          <FiPlus className="w-6 h-6" />
        </Button>
      </Link>

      {/* --- REPORT MODAL --- */}
      <PaymentReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onGenerate={handleGenerateReport}
        token={token}
        loading={reportLoading}
      />

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Payment?"
        message={`Are you sure you want to permanently delete this payment record? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </>
  );
};

export default PaymentsPage;

// frontend/src/features/payouts/pages/PayoutsPage.jsx

import { useState, useMemo } from "react";
import useScrollToTop from "../../../hooks/useScrollToTop";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePayouts, useDeletePayout } from "../hooks/usePayouts";
import { getAllPayouts } from "../api/payoutsService"; // Keep for report
import { useSelector } from "react-redux";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/layout/Footer";
import MobileNav from "../../../components/layout/MobileNav";
import BottomNav from "../../../components/layout/BottomNav";
import Message from "../../../components/ui/Message";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Table from "../../../components/ui/Table";
import PayoutCard from "../../../components/ui/PayoutCard";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import {
  Plus,
  Loader2,
  Search,
  SquarePen,
  Trash2,
  LayoutGrid,
  List,
  TrendingUp,
  Printer,
} from "lucide-react";

import { pdf } from "@react-pdf/renderer";
import PayoutReportPDF from "../components/reports/PayoutReportPDF"; // Assuming not moved or path corrected
import PayoutReportModal from "../components/PayoutReportModal";

const PayoutsPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const { isLoggedIn } = useSelector((state) => state.auth);

  const [viewMode, setViewMode] = useState(() =>
    window.innerWidth < 768 ? "card" : "table"
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  // --- React Query ---
  const { data, isLoading: loading, error: queryError } = usePayouts();
  const payouts = useMemo(() => {
      if (!data) return [];
      return Array.isArray(data) ? data : data.payouts || [];
  }, [data]);
  const deletePayoutMutation = useDeletePayout();

  useScrollToTop(success || error || queryError);

  if (location.state?.success && !success) {
      setSuccess(location.state.success);
      window.history.replaceState({}, document.title);
  }

  if (success) {
      setTimeout(() => setSuccess(null), 3000);
  }

  const handleDeleteClick = (payout) => {
    setItemToDelete(payout);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setError(null);
    deletePayoutMutation.mutate(itemToDelete.id, {
        onSuccess: () => {
            setSuccess(`Payout record has been deleted.`);
            setIsModalOpen(false);
            setItemToDelete(null);
        },
        onError: (err) => {
            setError(err.message);
            setIsModalOpen(false);
        }
    });
  };

  const handleGenerateReport = async (filters) => {
    setReportLoading(true);
    setError(null);
    try {
      const data = await getAllPayouts(filters); // Direct service call
      const reportPayouts = Array.isArray(data) ? data : data.payouts || [];

      if (!reportPayouts || reportPayouts.length === 0) {
        setError("No payouts found for the selected criteria.");
        setReportLoading(false);
        return;
      }

      const blob = await pdf(
        <PayoutReportPDF payouts={reportPayouts} filters={filters} />
      ).toBlob();

      // ... filename logic ...
      let filename = "Payout_Report.pdf";
      if (filters.chitName) {
        let name = filters.chitName;
        if (!name.toLowerCase().endsWith("chit")) name += " Chit";
        filename = `${filters.chitName} Payouts Report.pdf`;
      } else if (filters.memberName) {
        filename = `${filters.memberName} Payouts Report.pdf`;
      } else if (filters.startDate) {
        const formatDateForFilename = (dateStr) => {
          if (!dateStr) return "";
          const [y, m, d] = dateStr.split("-");
          return `${d}-${m}-${y}`;
        };
        const startStr = formatDateForFilename(filters.startDate);
        const endStr = formatDateForFilename(filters.endDate);
        filename = `${startStr} to ${endStr} Payouts Report.pdf`;
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

  const filteredPayouts = useMemo(() => {
    if (!searchQuery) return payouts;
    const lowercasedQuery = searchQuery.toLowerCase();
    return payouts.filter(
      (p) =>
        p.member?.full_name?.toLowerCase().includes(lowercasedQuery) ||
        p.chit?.name?.toLowerCase().includes(lowercasedQuery) ||
        (p.amount || 0).toString().includes(lowercasedQuery)
    );
  }, [payouts, searchQuery]);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const columns = [
    {
      header: "Date",
      accessor: "paid_date",
      cell: (row) => formatDate(row.paid_date),
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
      accessor: "amount",
      className: "text-center font-medium text-error-accent",
      cell: (row) => `₹${(row.amount || 0).toLocaleString("en-IN")}`,
    },
    {
      header: "Method",
      accessor: "method",
      className: "text-center",
    },
    {
      header: "Actions",
      accessor: "actions",
      className: "text-center",
      cell: (row) => (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/payouts/edit/${row.id}`);
            }}
            className="p-2 text-lg rounded-md text-warning-accent hover:bg-warning-accent hover:text-white transition-colors duration-200 cursor-pointer"
            title="Edit Payout"
          >
            <SquarePen className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(row);
            }}
            className="p-2 text-lg rounded-md text-error-accent hover:bg-error-accent hover:text-white transition-colors duration-200 cursor-pointer"
            title="Delete Payout"
          >
            <Trash2 className="w-5 h-5" />
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
          activeSection="payouts"
        />
        <div className="pb-16 md:pb-0">
          <main className="flex-grow min-h-[calc(100vh-128px)] bg-background-primary px-4 py-8">
            <div className="container mx-auto">
              <div className="relative flex justify-center items-center mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary text-center flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-error-accent" /> All
                  Payouts
                </h1>

                {payouts.length > 0 && (
                  <div className="absolute right-0 flex items-center">
                    <button
                      onClick={() => setIsReportModalOpen(true)}
                      className="p-2 text-info-accent hover:bg-info-bg rounded-full transition-colors duration-200 cursor-pointer"
                      title="Generate Report"
                    >
                      <Printer className="w-6 h-6" />
                    </button>
                  </div>
                )}
              </div>

              <hr className="my-4 border-border" />

              {success && <Message type="success">{success}</Message>}
              {error && <Message type="error" onClose={() => setError(null)}>{error}</Message>}
              {queryError && <Message type="error">{queryError.message}</Message>}

              <div className="mb-6 flex flex-row gap-2 items-stretch justify-between">
                <div className="relative flex-grow md:max-w-md flex items-center">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="w-5 h-5 text-text-secondary" />
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
                  >
                    {viewMode === "table" ? (
                      <LayoutGrid className="w-5 h-5" />
                    ) : (
                      <List className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {loading && (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="w-10 h-10 animate-spin text-accent" />
                </div>
              )}

              {!loading && !queryError && filteredPayouts.length === 0 && (
                <Card className="text-center p-8">
                  <h2 className="text-2xl font-bold text-text-primary mb-2">
                    {searchQuery ? "No Matching Payouts" : "No Payouts Found"}
                  </h2>
                  <p className="text-text-secondary">
                    {searchQuery
                      ? "Try a different search term."
                      : "You haven't recorded any payouts yet. Click the button below to start!"}
                  </p>
                </Card>
              )}

              {!loading && !queryError && filteredPayouts.length > 0 && (
                <>
                  {viewMode === "table" ? (
                    <div className="overflow-x-auto rounded-lg shadow-sm">
                      <Table
                        columns={columns}
                        data={filteredPayouts}
                        onRowClick={(row) =>
                          navigate(`/payouts/view/${row.id}`)
                        }
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredPayouts.map((payout) => (
                        <PayoutCard
                          key={payout.id}
                          payout={payout}
                          onEdit={() => navigate(`/payouts/edit/${payout.id}`)}
                          onDelete={() => handleDeleteClick(payout)}
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
        activeSection="payouts"
      />
      <BottomNav />
      <Link to="/payouts/create" className="group">
        <Button variant="fab" className="group-hover:scale-110">
          <Plus className="w-6 h-6" />
        </Button>
      </Link>

      <PayoutReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onGenerate={handleGenerateReport}
        // token removed
        loading={reportLoading}
      />

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Payout?"
        message={`Are you sure you want to permanently delete this payout record? This action cannot be undone.`}
        loading={deletePayoutMutation.isPending}
      />
    </>
  );
};

export default PayoutsPage;

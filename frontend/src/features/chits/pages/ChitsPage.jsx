// frontend/src/features/chits/pages/ChitsPage.jsx

import { useState, useEffect, useMemo } from "react";
import useScrollToTop from "../../../hooks/useScrollToTop";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ChitCard from "../components/cards/ChitCard";
import ChitCardSkeleton from "../components/cards/ChitCardSkeleton";
import Skeleton from "../../../components/ui/Skeleton";
import EmptyState from "../../../components/ui/EmptyState";
import { useChits, useDeleteChit } from "../hooks/useChits";
import { getPayoutsByChitId } from "../../../services/payoutsService";
import { getAssignmentsForChit } from "../../../services/assignmentsService";
import { getCollectionsByChitId } from "../../../services/collectionsService";
import { useSelector } from "react-redux";
import Message from "../../../components/ui/Message";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import Table from "../../../components/ui/Table";
import StatusBadge from "../../../components/ui/StatusBadge";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import {
  Plus,
  SquarePen,
  Search,
  Trash2,
  LayoutGrid,
  List,
  Printer,
  Loader2,
  FileStack,
} from "lucide-react";

import ChitsListReportPDF from "../components/reports/ChitsListReportPDF";
import ChitReportPDF from "../components/reports/ChitReportPDF";
import { pdf } from "@react-pdf/renderer";

/**
 * ChitsPage component - displays a list of all chits with search, view toggle, and CRUD operations.
 * Uses React Query for data fetching and caching.
 */
const ChitsPage = () => {
  const navigate = useNavigate();
  // isMenuOpen removed (handled by MainLayout)
  const location = useLocation();
  const [success, setSuccess] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { isLoggedIn } = useSelector((state) => state.auth);

  const [isPrintingAll, setIsPrintingAll] = useState(false);
  const [printingChitId, setPrintingChitId] = useState(null);

  const [viewMode, setViewMode] = useState(() =>
    window.innerWidth < 768 ? "card" : "table"
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // React Query hooks
  const {
    data: chitsData,
    isLoading: loading,
    error: queryError,
  } = useChits();

  const deleteChitMutation = useDeleteChit();

  // Extract chits from query data
  const chits = chitsData?.chits ?? [];

  // Combine query error with local error
  const error = localError || (queryError?.message ?? null);

  useScrollToTop(success || error);

  useEffect(() => {
    const handleResize = () => { };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [viewMode]);

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

  const handleDeleteClick = (chit) => {
    setItemToDelete(chit);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setLocalError(null);

    deleteChitMutation.mutate(itemToDelete.id, {
      onSuccess: () => {
        setSuccess(`Chit "${itemToDelete.name}" has been deleted.`);
        setIsModalOpen(false);
        setItemToDelete(null);
      },
      onError: (err) => {
        setLocalError(err.message);
        setIsModalOpen(false);
        setItemToDelete(null);
      },
    });
  };

  const filteredChits = useMemo(() => {
    if (!searchQuery) {
      return chits;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return chits.filter((chit) => {
      const nameMatch = chit.name.toLowerCase().includes(lowercasedQuery);
      const valueMatch = chit.chit_value.toString().includes(lowercasedQuery);
      return nameMatch || valueMatch;
    });
  }, [chits, searchQuery]);

  const handlePrintAll = async () => {
    if (filteredChits.length === 0) return;

    setIsPrintingAll(true);
    try {
      const blob = await pdf(
        <ChitsListReportPDF chits={filteredChits} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "All Chits Report.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Print failed", err);
      setLocalError("Failed to generate report.");
    } finally {
      setIsPrintingAll(false);
    }
  };

  const handlePrintChit = async (chit) => {
    setPrintingChitId(chit.id);
    setLocalError(null);

    try {
      const [payoutsData, assignmentsData, collectionsData] = await Promise.all(
        [
          getPayoutsByChitId(chit.id),
          getAssignmentsForChit(chit.id),
          getCollectionsByChitId(chit.id),
        ]
      );

      const reportProps = {
        chit: chit,
        payouts: payoutsData.payouts,
        assignments: assignmentsData.assignments,
        collections: collectionsData.collections,
      };

      let reportName = chit.name;
      if (!reportName.toLowerCase().endsWith("chit")) {
        reportName += " Chit";
      }
      reportName += " Report";

      const blob = await pdf(<ChitReportPDF {...reportProps} />).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${reportName}.pdf`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Single chit print failed", err);
      setLocalError("Failed to generate report for this chit.");
    } finally {
      setPrintingChitId(null);
    }
  };

  const columns = [
    {
      header: "S.No",
      accessor: "s_no",
      className: "text-center",
      cell: (row, index) => index + 1,
    },
    {
      header: "Chit Name",
      accessor: "name",
      className: "text-center",
    },
    {
      header: "Chit Value",
      accessor: "chit_value",
      className: "text-center",
      cell: (row) => `₹${row.chit_value.toLocaleString("en-IN")}`,
    },
    {
      header: "Chit Cycle",
      accessor: "chit_cycle",
      className: "text-center",
    },
    {
      header: "Status",
      accessor: "status",
      className: "text-center",
      cell: (row) => <StatusBadge status={row.status} />,
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
              handlePrintChit(row);
            }}
            disabled={printingChitId === row.id}
            className="p-2 text-lg rounded-md text-info-accent hover:bg-info-accent hover:text-white transition-colors duration-200 cursor-pointer disabled:opacity-50"
            title="Download PDF"
          >
            {printingChitId === row.id ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Printer className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/chits/edit/${row.id}`);
            }}
            className="p-2 text-lg rounded-md text-warning-accent hover:bg-warning-accent hover:text-white transition-colors duration-200 cursor-pointer"
            title="Edit Chit"
          >
            <SquarePen className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(row);
            }}
            className="p-2 text-lg rounded-md text-error-accent hover:bg-error-accent hover:text-white transition-colors duration-200 cursor-pointer"
            title="Delete Chit"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="container mx-auto">
        {/* --- HEADER ROW WITH PRINT BUTTON --- */}
        <div className="relative flex justify-center items-center mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary text-center">
            All Chits
          </h1>
          {filteredChits.length > 0 && (
            <div className="absolute right-0 flex items-center">
              <button
                onClick={handlePrintAll}
                disabled={isPrintingAll}
                className="p-2 text-info-accent hover:bg-info-bg rounded-full transition-colors duration-200 disabled:opacity-50"
                title="Print All Chits"
              >
                {isPrintingAll ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Printer className="w-6 h-6" />
                )}
              </button>
            </div>
          )}
        </div>

        <hr className="my-4 border-border" />

        {success && <Message type="success">{success}</Message>}
        {error && (
          <Message type="error" onClose={() => setLocalError(null)}>
            {error}
          </Message>
        )}

        {/* Controls Row: Search + View Toggle */}
        <div className="mb-6 flex flex-row gap-2 items-stretch justify-between">
          <div className="relative flex-grow md:max-w-md flex items-center">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="w-5 h-5 text-text-secondary" />
            </span>
            <div className="absolute left-10 h-6 w-px bg-border"></div>
            <input
              type="text"
              placeholder="Search by name or value..."
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
                <LayoutGrid className="w-5 h-5" />
              ) : (
                <List className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {loading && (
          viewMode === "table" ? (
            <Skeleton.Table rows={5} columns={6} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <ChitCardSkeleton key={i} />
              ))}
            </div>
          )
        )}

        {!loading && filteredChits.length === 0 && (
          <EmptyState
            icon={FileStack}
            title={searchQuery ? "No Matching Chits" : "No Chits Found"}
            description={
              searchQuery
                ? "Try a different search term."
                : "You don't have any chits yet. Click the + button to create one!"
            }
          />
        )}

        {!loading && filteredChits.length > 0 && (
          <>
            {/* Conditional Rendering based on viewMode */}
            {viewMode === "table" ? (
              <div className="overflow-x-auto rounded-lg shadow-sm">
                <Table
                  columns={columns}
                  data={filteredChits}
                  onRowClick={(row) => navigate(`/chits/view/${row.id}`)}
                />
              </div>
            ) : (
              // Card View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredChits.map((chit) => (
                  <ChitCard
                    key={chit.id}
                    chit={chit}
                    onView={() => navigate(`/chits/view/${chit.id}`)}
                    onEdit={() => navigate(`/chits/edit/${chit.id}`)}
                    onDelete={() => handleDeleteClick(chit)}
                    onPrint={handlePrintChit}
                    isPrinting={printingChitId === chit.id}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Link to="/chits/create" className="chit">
        <Button variant="fab" className="chit-hover:scale-110">
          <Plus className="w-6 h-6" />
        </Button>
      </Link>
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Chit?"
        message={`Are you sure you want to permanently delete "${itemToDelete?.name}"? This action cannot be undone.`}
        loading={deleteChitMutation.isPending}
      />
    </>
  );
};

export default ChitsPage;

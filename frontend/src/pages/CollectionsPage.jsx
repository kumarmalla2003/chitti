// frontend/src/pages/CollectionsPage.jsx

import { useState, useEffect, useMemo } from "react";
import useScrollToTop from "../hooks/useScrollToTop";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  getAllCollections,
  deleteCollection,
} from "../services/collectionsService";
import { useSelector } from "react-redux";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import MobileNav from "../components/layout/MobileNav";
import BottomNav from "../components/layout/BottomNav";
import Message from "../components/ui/Message";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Table from "../components/ui/Table";
import CollectionCard from "../components/ui/CollectionCard";
import ConfirmationModal from "../components/ui/ConfirmationModal";
import {
  Plus,
  Loader2,
  Search,
  SquarePen,
  Trash2,
  Printer,
  LayoutGrid,
  List,
} from "lucide-react";

import CollectionReportPDF from "../components/reports/CollectionReportPDF";
import CollectionReportModal from "../components/reports/CollectionReportModal";
import { pdf } from "@react-pdf/renderer";

const CollectionsPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { isLoggedIn } = useSelector((state) => state.auth);

  const [viewMode, setViewMode] = useState(() =>
    window.innerWidth < 768 ? "card" : "table"
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  useScrollToTop(success || error);

  useEffect(() => {
    const handleResize = () => {
      // Optional: Auto-switch view on resize if desired
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [viewMode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllCollections();
      setCollections(data.collections);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn]);

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

  const handleDeleteClick = (collection) => {
    setItemToDelete(collection);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);
    setError(null);
    try {
      await deleteCollection(itemToDelete.id);
      setCollections((prevCollections) =>
        prevCollections.filter((p) => p.id !== itemToDelete.id)
      );
      setSuccess(`Collection record has been deleted.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteLoading(false);
      setIsModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleGenerateReport = async (filters) => {
    setReportLoading(true);
    setError(null);
    try {
      const data = await getAllCollections(filters);

      if (!data.collections || data.collections.length === 0) {
        setError("No collections found for the selected criteria.");
        setReportLoading(false);
        return;
      }

      const blob = await pdf(
        <CollectionReportPDF collections={data.collections} filters={filters} />
      ).toBlob();

      let filename = "Collection_Report.pdf";

      if (filters.chitName) {
        let name = filters.chitName;
        if (!name.toLowerCase().endsWith("chit")) {
          name += " Chit";
        }
        filename = `${filters.chitName} Collections Report.pdf`;
      } else if (filters.memberName) {
        filename = `${filters.memberName} Collections Report.pdf`;
      } else if (filters.startDate) {
        const formatDateForFilename = (dateStr) => {
          if (!dateStr) return "";
          const [y, m, d] = dateStr.split("-");
          return `${d}-${m}-${y}`;
        };
        const startStr = formatDateForFilename(filters.startDate);
        const endStr = formatDateForFilename(filters.endDate);
        filename = `${startStr} to ${endStr} Collections Report.pdf`;
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

  const filteredCollections = useMemo(() => {
    if (!searchQuery) return collections;
    const lowercasedQuery = searchQuery.toLowerCase();
    return collections.filter(
      (p) =>
        p.member.full_name.toLowerCase().includes(lowercasedQuery) ||
        p.chit.name.toLowerCase().includes(lowercasedQuery) ||
        p.amount_paid.toString().includes(lowercasedQuery)
    );
  }, [collections, searchQuery]);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const columns = [
    {
      header: "Date",
      accessor: "collection_date",
      cell: (row) => formatDate(row.collection_date),
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
      accessor: "collection_method",
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
              navigate(`/collections/edit/${row.id}`);
            }}
            className="p-2 text-lg rounded-md text-warning-accent hover:bg-warning-accent hover:text-white transition-colors duration-200 cursor-pointer"
            title="Edit Collection"
          >
            <SquarePen className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(row);
            }}
            className="p-2 text-lg rounded-md text-error-accent hover:bg-error-accent hover:text-white transition-colors duration-200 cursor-pointer"
            title="Delete Collection"
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
          activeSection="collections"
        />
        <div className="pb-16 md:pb-0">
          <main className="flex-grow min-h-[calc(100vh-128px)] bg-background-primary px-4 py-8">
            <div className="container mx-auto">
              {/* --- HEADER ROW WITH PRINT BUTTON --- */}
              <div className="relative flex justify-center items-center mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary text-center">
                  All Collections
                </h1>

                {/* Print Button */}
                {collections.length > 0 && (
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
              {error && (
                <Message type="error" onClose={() => setError(null)}>
                  {error}
                </Message>
              )}

              {/* --- CONTROLS ROW: Search + View Toggle --- */}
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
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="w-10 h-10 animate-spin text-accent" />
                </div>
              )}

              {!loading && !error && filteredCollections.length === 0 && (
                <Card className="text-center p-8">
                  <h2 className="text-2xl font-bold text-text-primary mb-2">
                    {searchQuery
                      ? "No Matching Collections"
                      : "No Collections Found"}
                  </h2>
                  <p className="text-text-secondary">
                    {searchQuery
                      ? "Try a different search term."
                      : "You haven't logged any collections yet. Click the button below to start!"}
                  </p>
                </Card>
              )}

              {!loading && !error && filteredCollections.length > 0 && (
                <>
                  {/* --- CONDITIONAL RENDERING BASED ON VIEW MODE --- */}
                  {viewMode === "table" ? (
                    <div className="overflow-x-auto rounded-lg shadow-sm">
                      <Table
                        columns={columns}
                        data={filteredCollections}
                        onRowClick={(row) =>
                          navigate(`/collections/view/${row.id}`)
                        }
                      />
                    </div>
                  ) : (
                    // Card View
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredCollections.map((collection) => (
                        <CollectionCard
                          key={collection.id}
                          collection={collection}
                          onEdit={() =>
                            navigate(`/collections/edit/${collection.id}`)
                          }
                          onDelete={() => handleDeleteClick(collection)}
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
        activeSection="collections"
      />
      <BottomNav />
      <Link to="/collections/create" className="group">
        <Button variant="fab" className="group-hover:scale-110">
          <Plus className="w-6 h-6" />
        </Button>
      </Link>

      {/* --- REPORT MODAL --- */}
      <CollectionReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onGenerate={handleGenerateReport}
        loading={reportLoading}
      />

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Collection?"
        message={`Are you sure you want to permanently delete this collection record? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </>
  );
};

export default CollectionsPage;

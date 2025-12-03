// frontend/src/components/sections/CollectionHistoryList.jsx

import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Table from "../ui/Table";
import Message from "../ui/Message";
import Button from "../ui/Button";
import CollectionDetailsForm from "../forms/CollectionDetailsForm";
import Card from "../ui/Card";
import {
  Loader2,
  AlertCircle,
  Search,
  Plus,
  ArrowLeft,
  ArrowRight,
  IndianRupee,
} from "lucide-react";
import {
  getCollectionsByChitId,
  getCollectionsByMemberId,
  createCollection,
} from "../../services/collectionsService";
// --- FIXED IMPORT BELOW ---
import CollectionHistoryCard from "../ui/CollectionHistoryCard";
import useScrollToTop from "../../hooks/useScrollToTop";

const ITEMS_PER_PAGE = 10;

const CollectionHistoryList = ({
  chitId,
  memberId,
  mode,
  collectionDefaults,
  setCollectionDefaults,
  forceTable = false,
  onManage,
}) => {
  const [collections, setCollections] = useState([]);
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
    collection_date: new Date().toISOString().split("T")[0],
    collection_method: "Cash",
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
        data = await getCollectionsByChitId(chitId, token);
      } else if (memberId) {
        data = await getCollectionsByMemberId(memberId, token);
      }
      setCollections(data.collections || []);
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
    if (collectionDefaults) {
      setView("create");
      setFormData((prev) => ({
        ...prev,
        chit_assignment_id: collectionDefaults.assignmentId,
        collection_date: new Date().toISOString().split("T")[0],
        collection_method: "Cash",
        amount_paid: "",
        notes: "",
      }));
      setFormError(null);
      setFormSuccess(null);
    }
  }, [collectionDefaults]);

  const handleAddCollectionClick = () => {
    if (mode === "view" && chitId) {
      navigate(`/chits/edit/${chitId}`, {
        state: { initialTab: "collections" },
      });
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const filteredCollections = useMemo(() => {
    if (!searchQuery) return collections;
    const lowercasedQuery = searchQuery.toLowerCase();
    return collections.filter((c) => {
      const amountMatch = c.amount_paid.toString().includes(lowercasedQuery);
      const method = c.collection_method || c.payment_method || "";
      const methodMatch = method.toLowerCase().includes(lowercasedQuery);

      if (viewType === "chit") {
        const memberMatch = c.member.full_name
          .toLowerCase()
          .includes(lowercasedQuery);
        return memberMatch || amountMatch || methodMatch;
      } else {
        const chitMatch = c.chit.name.toLowerCase().includes(lowercasedQuery);
        return chitMatch || amountMatch || methodMatch;
      }
    });
  }, [collections, searchQuery, viewType]);

  const totalPages = Math.ceil(filteredCollections.length / ITEMS_PER_PAGE);
  const paginatedCollections =
    mode === "view"
      ? filteredCollections.slice(
          (currentPage - 1) * ITEMS_PER_PAGE,
          currentPage * ITEMS_PER_PAGE
        )
      : filteredCollections;

  const searchPlaceholder =
    viewType === "chit"
      ? "Search by member, amount, or method..."
      : "Search by chit, amount, or method...";

  const columns = [
    {
      header: "Date",
      accessor: "collection_date",
      cell: (row) => formatDate(row.collection_date || row.payment_date),
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
      className: "text-center text-green-600 font-medium",
    },
    {
      header: "Method",
      accessor: "collection_method",
      cell: (row) => row.collection_method || row.payment_method,
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
        collection_date: formData.collection_date,
        collection_method: formData.collection_method,
      };

      await createCollection(dataToSend, token);
      setFormSuccess("Collection logged successfully!");
      setFormData({
        chit_assignment_id: "",
        amount_paid: "",
        collection_date: new Date().toISOString().split("T")[0],
        collection_method: "Cash",
        notes: "",
      });
      setView("list");
      fetchData();
      if (setCollectionDefaults) {
        setCollectionDefaults(null);
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
    if (setCollectionDefaults) {
      setCollectionDefaults(null);
    }
  };

  const handleShowList = () => {
    setView("list");
    setFormError(null);
    if (setCollectionDefaults) {
      setCollectionDefaults(null);
    }
  };

  const headerTitle = view === "list" ? "Collections" : "Log New Collection";

  if (loading) {
    return (
      <Card className="flex-1 flex flex-col">
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
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
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <IndianRupee className="w-6 h-6 text-green-600" /> {headerTitle}
        </h2>

        {mode === "view" && view === "list" && (
          <button
            onClick={onManage || handleAddCollectionClick}
            className="absolute right-0 p-1 text-success-accent hover:bg-success-bg rounded-full transition-colors duration-200 print:hidden"
            title="Add Collection"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
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

          <CollectionDetailsForm
            mode="create"
            formData={formData}
            onFormChange={handleFormChange}
            defaultAssignmentId={collectionDefaults?.assignmentId}
            defaultChitId={collectionDefaults?.chitId || chitId}
            defaultMemberId={collectionDefaults?.memberId || memberId}
          />
          <div className="flex justify-end mt-6">
            <Button
              type="submit"
              variant="success"
              disabled={formLoading}
              className="w-full"
            >
              {formLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                <>
                  <Plus className="w-5 h-5 inline-block mr-2" />
                  Submit Collection
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
                <IndianRupee className="w-6 h-6 text-green-600" /> Log New
                Collection
              </Button>
            </div>
          )}

          {collections.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-8 w-8 text-text-secondary opacity-50" />
              <p className="mt-2 text-sm text-text-secondary">
                No collections have been logged yet.
              </p>
            </div>
          ) : (
            <>
              {collections.length > 1 && (
                <div className="relative flex items-center mb-4">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="w-5 h-5 text-text-secondary" />
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

              {filteredCollections.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="mx-auto h-8 w-8 text-text-secondary opacity-50" />
                  <p className="mt-2 text-sm text-text-secondary">
                    No collections found matching "{searchQuery}".
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
                      data={paginatedCollections}
                      variant="secondary"
                      onRowClick={(row) =>
                        navigate(`/collections/view/${row.id}`)
                      }
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
                  </div>

                  {!forceTable && (
                    <div className="block md:hidden space-y-4">
                      {paginatedCollections.map((collection) => (
                        // --- FIXED COMPONENT USAGE ---
                        <CollectionHistoryCard
                          key={collection.id}
                          collection={collection} // Changed from payment={collection}
                          viewType={viewType}
                          onClick={() =>
                            navigate(`/collections/view/${collection.id}`)
                          }
                        />
                        // --- END FIX ---
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

export default CollectionHistoryList;

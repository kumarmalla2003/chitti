// frontend/src/features/chits/components/sections/PayoutHistoryList.jsx

import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Table from "../../../../components/ui/Table";
import Message from "../../../../components/ui/Message";
import Card from "../../../../components/ui/Card";
import {
  Loader2,
  AlertCircle,
  Search,
  Plus,
  ArrowLeft,
  ArrowRight,
  HandCoins,
} from "lucide-react";
import {
  getPayoutsByChitId,
  getPayoutsByMemberId,
} from "../../../../services/payoutsService";
import useScrollToTop from "../../../../hooks/useScrollToTop";
import PayoutHistoryCard from "../../../payouts/components/cards/PayoutHistoryCard";
import Skeleton from "../../../../components/ui/Skeleton";

const ITEMS_PER_PAGE = 10;

const PayoutHistoryList = ({
  chitId,
  memberId,
  mode = "view",
  forceTable = false,
}) => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useScrollToTop(error);

  const viewType = chitId ? "chit" : "member";

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (chitId) {
        data = await getPayoutsByChitId(chitId, token);
        const all = Array.isArray(data) ? data : data.payouts || [];
        setPayouts(all.filter((p) => p.paid_date)); // Only show PAID
      } else if (memberId) {
        data = await getPayoutsByMemberId(memberId, token);
        setPayouts(Array.isArray(data) ? data : data.payouts || []);
      }
      setCurrentPage(1);
    } catch (err) {
      setError(err.message || "Failed to load payouts");
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

  const handleAddPayoutClick = () => {
    navigate(`/payouts/create`);
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const filteredPayouts = useMemo(() => {
    if (!searchQuery) return payouts;
    const lowercasedQuery = searchQuery.toLowerCase();
    return payouts.filter((p) => {
      const amountMatch = (p.amount || 0).toString().includes(lowercasedQuery);
      const methodMatch = (p.method || "")
        .toLowerCase()
        .includes(lowercasedQuery);

      if (viewType === "chit") {
        const memberName = p.member?.full_name || "";
        return (
          memberName.toLowerCase().includes(lowercasedQuery) ||
          amountMatch ||
          methodMatch
        );
      } else {
        const chitName = p.chit?.name || "";
        return (
          chitName.toLowerCase().includes(lowercasedQuery) ||
          amountMatch ||
          methodMatch
        );
      }
    });
  }, [payouts, searchQuery, viewType]);

  const totalPages = Math.ceil(filteredPayouts.length / ITEMS_PER_PAGE);
  const paginatedPayouts = filteredPayouts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const searchPlaceholder =
    viewType === "chit"
      ? "Search by member, amount, or method..."
      : "Search by chit, amount, or method...";

  const columns = [
    {
      header: "Date",
      accessor: "paid_date",
      cell: (row) => formatDate(row.paid_date),
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
      accessor: "amount",
      cell: (row) => `₹${(row.amount || 0).toLocaleString("en-IN")}/-`,
      className: "text-center font-bold text-red-600 dark:text-red-400",
    },
    {
      header: "Method",
      accessor: "method",
      className: "text-center",
    },
    {
      header: "Notes",
      accessor: "notes",
      className: "text-center truncate max-w-xs",
      cell: (row) => row.notes || "-",
    },
  ];

  if (loading) {
    return (
      <Card className="flex-1 flex flex-col">
        <div className="p-4">
          <Skeleton.Table rows={5} columns={5} />
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
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <HandCoins className="w-6 h-6 text-red-500" />
          {memberId ? "Payouts Received" : "Payout Transactions"}
          {/* Add Button */}
          <Plus className="w-5 h-5" />
        </h2>

        {mode === "view" && (
          <button
            onClick={handleAddPayoutClick}
            className="absolute right-0 p-1 text-success-accent hover:bg-success-bg rounded-full transition-colors duration-200 print:hidden"
            title="Record New Payout"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>
      <hr className="border-border mb-4" />

      {payouts.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="mx-auto h-8 w-8 text-text-secondary opacity-50" />
          <p className="mt-2 text-sm text-text-secondary">
            No payouts have been recorded yet.
          </p>
        </div>
      ) : (
        <>
          {payouts.length > 1 && (
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

          {filteredPayouts.length === 0 ? (
            <div className="text-center py-8">
              <Search className="mx-auto h-8 w-8 text-text-secondary opacity-50" />
              <p className="mt-2 text-sm text-text-secondary">
                No payouts found matching "{searchQuery}".
              </p>
            </div>
          ) : (
            <div className="block overflow-x-auto">
              <Table
                columns={columns}
                data={paginatedPayouts}
                variant="secondary"
                onRowClick={(row) => navigate(`/payouts/view/${row.id}`)}
              />

              {totalPages > 1 && (
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
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default PayoutHistoryList;

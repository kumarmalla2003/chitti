// frontend/src/features/chits/components/sections/TransactionsSection/index.jsx

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Table from "../../../../../components/ui/Table";
import Pagination from "../../../../../components/ui/Pagination";
import Message from "../../../../../components/ui/Message";
import Skeleton from "../../../../../components/ui/Skeleton";
import { formatAmount, formatDate, ITEMS_PER_PAGE } from "./utils/helpers";

import { useCollectionsByChit } from "../../../../collections/hooks/useCollections";
import { usePayoutsByChit } from "../../../../payouts/hooks/usePayouts";

import {
    Search,
    Receipt,
    ArrowDownLeft,
    ArrowUpRight,
    Plus,
    WalletMinimal,
} from "lucide-react";

/**
 * TransactionsSection - Simplified Chit-scoped financial activity
 * Displays a list of all payments (Collections & Payouts) with search and log payment action.
 */
const TransactionsSection = ({ mode, chitId }) => {
    const navigate = useNavigate();

    // --- UI State ---
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // --- React Query Hooks ---
    const {
        data: collectionsResponse,
        isLoading: collectionsLoading,
        error: collectionsError,
    } = useCollectionsByChit(chitId);

    const {
        data: payoutsResponse,
        isLoading: payoutsLoading,
        error: payoutsError,
    } = usePayoutsByChit(chitId);

    // --- Extract Data ---
    const collections = collectionsResponse?.collections ?? [];
    const payouts = payoutsResponse?.payouts ?? [];

    const loading = collectionsLoading || payoutsLoading;
    const error = collectionsError?.message || payoutsError?.message || null;

    // --- Build unified transactions list ---
    const allTransactions = useMemo(() => {
        const collectionItems = collections.map((c) => ({
            id: c.id,
            type: "collection",
            date: c.collection_date,
            member: c.member?.full_name || "-",
            amount: c.amount_paid || 0,
            method: c.collection_method,
            status: "Paid",
            original: c,
        }));

        const payoutItems = payouts
            .filter((p) => p.paid_date)
            .map((p) => ({
                id: p.id,
                type: "payout",
                date: p.paid_date,
                member: p.member?.full_name || "-",
                amount: p.amount || 0,
                method: p.method,
                status: "Paid",
                original: p,
            }));

        // Sort by date descending
        return [...collectionItems, ...payoutItems].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
        );
    }, [collections, payouts]);

    // --- Filter & Search ---
    const filteredData = useMemo(() => {
        let data = allTransactions;

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            data = data.filter(
                (t) =>
                    t.member.toLowerCase().includes(lowerQuery) ||
                    t.amount.toString().includes(lowerQuery)
            );
        }

        return data;
    }, [allTransactions, searchQuery]);

    // --- Pagination ---
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredData, currentPage]);

    // --- Handlers ---
    const handleLogPayment = () => {
        navigate("/ledger/create", { state: { chitId, type: "collection" } });
    };

    // --- Table Columns ---
    const columns = useMemo(
        () => [
            {
                header: "S.No",
                className: "text-center",
                cell: (_, index) => (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
            },
            {
                header: "Type",
                className: "text-center",
                cell: (row) => (
                    <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${row.type === "collection"
                            ? "bg-success-bg text-success-accent"
                            : "bg-error-bg text-error-accent"
                            }`}
                    >
                        {row.type === "collection" ? (
                            <>
                                <ArrowDownLeft className="w-3 h-3" /> In
                            </>
                        ) : (
                            <>
                                <ArrowUpRight className="w-3 h-3" /> Out
                            </>
                        )}
                    </span>
                ),
            },
            {
                header: "Date",
                className: "text-center",
                cell: (row) => formatDate(row.date),
            },
            {
                header: "Member",
                className: "text-center",
                cell: (row) => row.member,
            },
            {
                header: "Amount",
                className: "text-center",
                cell: (row) => (
                    <span
                        className={
                            row.type === "collection" ? "text-success-accent" : "text-error-accent"
                        }
                    >
                        {row.type === "collection" ? "+" : "-"}₹{formatAmount(row.amount)}
                    </span>
                ),
            },
            {
                header: "Method",
                className: "text-center",
                cell: (row) => row.method || "-",
            },
        ],
        [currentPage]
    );

    return (
        <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="relative flex justify-center items-center mb-4">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                    <Receipt className="w-6 h-6" /> Payments
                </h2>
                {mode !== "view" && (
                    <button
                        onClick={handleLogPayment}
                        className="absolute right-0 flex items-center gap-1.5 px-3 py-1.5 bg-success-bg text-success-accent hover:bg-success-accent hover:text-white rounded-full transition-all duration-200 text-sm font-medium"
                        title="Log Payment"
                    >
                        <Plus className="w-4 h-4" /> Log Payment
                    </button>
                )}
            </div>
            <hr className="border-border mb-4" />

            {/* Error Message */}
            {error && <Message type="error">{error}</Message>}

            {loading && !allTransactions.length ? (
                <div className="p-4">
                    <Skeleton.Table rows={5} columns={5} />
                </div>
            ) : (
                <>
                    {/* Search Bar */}
                    <div className="mb-4">
                        <div className="relative flex items-center">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="w-5 h-5 text-text-secondary" />
                            </span>
                            <div className="absolute left-10 h-6 w-px bg-border"></div>
                            <input
                                type="text"
                                placeholder="Search by member or amount..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-12 pr-4 py-3 bg-background-secondary border rounded-md focus:outline-none focus:ring-2 border-border focus:ring-accent"
                            />
                        </div>
                    </div>

                    {/* Empty State */}
                    {filteredData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4">
                            <div className="w-16 h-16 mb-4 rounded-full bg-background-secondary flex items-center justify-center">
                                <WalletMinimal className="w-8 h-8 text-text-secondary" />
                            </div>
                            <p className="text-text-secondary text-center text-sm">
                                {searchQuery
                                    ? "No payments match your search"
                                    : "No payments recorded yet"}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Table */}
                            <div className="block">
                                <Table
                                    columns={columns}
                                    data={paginatedData}
                                    variant="secondary"
                                    onRowClick={(row) => {
                                        navigate(`/ledger/edit/${row.id}`, { state: { type: row.type } });
                                    }}
                                />
                            </div>

                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default TransactionsSection;

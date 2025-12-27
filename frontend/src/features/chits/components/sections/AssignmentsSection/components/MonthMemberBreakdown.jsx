// frontend/src/features/chits/components/sections/AssignmentsSection/components/MonthMemberBreakdown.jsx

import { useState, useMemo } from "react";
import { Search, ChevronUp, Phone, Loader2, HandCoins, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { useMonthMembers } from "../../../../../assignments/hooks/useAssignments";
import Skeleton from "../../../../../../components/ui/Skeleton";

/**
 * Formats a number as Indian Rupees with thousand separators.
 */
const formatAmount = (amount) => {
    if (!amount && amount !== 0) return "0";
    return new Intl.NumberFormat("en-IN").format(amount);
};

/**
 * Status badge component with appropriate colors.
 */
const StatusBadge = ({ status }) => {
    const statusConfig = {
        Paid: {
            icon: CheckCircle,
            bgColor: "bg-success-bg",
            textColor: "text-success-accent",
            label: "Paid"
        },
        Partial: {
            icon: AlertCircle,
            bgColor: "bg-warning-bg",
            textColor: "text-warning-accent",
            label: "Partial"
        },
        Unpaid: {
            icon: XCircle,
            bgColor: "bg-error-bg",
            textColor: "text-error-accent",
            label: "Unpaid"
        }
    };

    const config = statusConfig[status] || statusConfig.Unpaid;
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
            <Icon className="w-3 h-3" />
            {config.label}
        </span>
    );
};

/**
 * MonthMemberBreakdown component - Expandable section showing per-member data for a month.
 * Features search toolbar, status badges, and payment summaries.
 */
const MonthMemberBreakdown = ({
    chitId,
    month,
    monthLabel,
    onClose,
    onLogPayment
}) => {
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch per-member data (always enabled when this component is rendered)
    const { data, isLoading, error } = useMonthMembers(chitId, month, true);

    // Filter members by search query
    const filteredMembers = useMemo(() => {
        if (!data?.members) return [];
        if (!searchQuery.trim()) return data.members;

        const query = searchQuery.toLowerCase().trim();
        return data.members.filter(member =>
            member.member_name.toLowerCase().includes(query) ||
            member.phone_number.includes(query)
        );
    }, [data?.members, searchQuery]);

    // Calculate summary stats
    const summaryStats = useMemo(() => {
        if (!data) return { paid: 0, partial: 0, unpaid: 0 };
        return {
            paid: data.members?.filter(m => m.status === "Paid").length || 0,
            partial: data.members?.filter(m => m.status === "Partial").length || 0,
            unpaid: data.members?.filter(m => m.status === "Unpaid").length || 0,
        };
    }, [data]);

    if (error) {
        return (
            <div className="p-4 bg-error-bg border border-error-accent rounded-lg text-error-accent text-sm">
                Failed to load member data: {error.message}
            </div>
        );
    }

    return (
        <div className="bg-background-secondary border border-border rounded-lg shadow-sm overflow-hidden mt-2 mb-3">
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-background-tertiary border-b border-border">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">
                        Month {month}
                    </span>
                    <span className="text-text-secondary text-sm">
                        - {monthLabel}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-background-secondary transition-colors"
                    title="Close"
                >
                    <ChevronUp className="w-4 h-4" />
                </button>
            </div>

            {isLoading ? (
                <div className="p-4">
                    <Skeleton.Table rows={3} columns={4} />
                </div>
            ) : (
                <>
                    {/* Search Bar */}
                    <div className="p-3 border-b border-border">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="w-4 h-4 text-text-secondary" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search members by name or phone..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm bg-background-primary border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
                            />
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="flex items-center justify-between px-4 py-2 bg-background-tertiary/50 border-b border-border text-xs">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1 text-success-accent">
                                <CheckCircle className="w-3 h-3" />
                                {summaryStats.paid} Paid
                            </span>
                            <span className="flex items-center gap-1 text-warning-accent">
                                <AlertCircle className="w-3 h-3" />
                                {summaryStats.partial} Partial
                            </span>
                            <span className="flex items-center gap-1 text-error-accent">
                                <XCircle className="w-3 h-3" />
                                {summaryStats.unpaid} Unpaid
                            </span>
                        </div>
                        <div className="text-text-secondary">
                            <span className="font-medium text-accent">{data?.collection_percentage || 0}%</span> collected
                        </div>
                    </div>

                    {/* Members Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-background-tertiary">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-text-secondary">Member</th>
                                    <th className="px-4 py-2 text-right font-medium text-text-secondary">Expected</th>
                                    <th className="px-4 py-2 text-right font-medium text-text-secondary">Paid</th>
                                    <th className="px-4 py-2 text-center font-medium text-text-secondary">Status</th>
                                    {onLogPayment && (
                                        <th className="px-4 py-2 text-center font-medium text-text-secondary">Action</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan={onLogPayment ? 5 : 4} className="px-4 py-8 text-center text-text-secondary">
                                            {searchQuery ? "No members match your search" : "No members assigned"}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMembers.map((member, index) => (
                                        <tr key={`${member.member_id}-${index}`} className="border-t border-border hover:bg-background-tertiary/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-text-primary">{member.member_name}</span>
                                                    <span className="flex items-center gap-1 text-xs text-text-secondary">
                                                        <Phone className="w-3 h-3" />
                                                        {member.phone_number}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-text-secondary">
                                                ₹{formatAmount(member.expected_amount)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-text-primary">
                                                ₹{formatAmount(member.amount_paid)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <StatusBadge status={member.status} />
                                            </td>
                                            {onLogPayment && (
                                                <td className="px-4 py-3 text-center">
                                                    {member.status !== "Paid" && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onLogPayment(member)}
                                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-accent hover:bg-accent hover:text-white rounded-md transition-colors"
                                                            title="Log Payment"
                                                        >
                                                            <HandCoins className="w-3 h-3" />
                                                            Log
                                                        </button>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer with totals */}
                    <div className="flex items-center justify-between px-4 py-3 bg-background-tertiary border-t border-border text-sm font-medium">
                        <span className="text-text-secondary">Total</span>
                        <div className="flex items-center gap-6">
                            <span className="text-text-secondary">
                                Expected: <span className="text-text-primary">₹{formatAmount(data?.total_expected || 0)}</span>
                            </span>
                            <span className="text-text-secondary">
                                Collected: <span className="text-accent">₹{formatAmount(data?.total_collected || 0)}</span>
                            </span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default MonthMemberBreakdown;

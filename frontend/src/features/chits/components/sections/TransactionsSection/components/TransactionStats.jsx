// frontend/src/features/chits/components/sections/TransactionsSection/components/TransactionStats.jsx

import { useMemo } from "react";
import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";
import StatsCard from "../../../../../../components/ui/StatsCard";
import StatsCarousel from "../../../../../../components/ui/StatsCarousel";
import FormattedCurrency from "../../../../../../components/ui/FormattedCurrency";

/**
 * TransactionStats - displays chit-specific financial summary
 * Shows: Total Collected, Total Paid Out, Net Balance
 */
const TransactionStats = ({ collections = [], payouts = [], isLoading = false }) => {
    const stats = useMemo(() => {
        // Total collected from all collections
        const totalCollected = collections.reduce(
            (sum, c) => sum + (c.amount_paid || 0),
            0
        );

        // Total paid out (only paid payouts)
        const totalPaidOut = payouts.reduce(
            (sum, p) => sum + (p.amount || 0),
            0
        );

        // Net balance
        const netBalance = totalCollected - totalPaidOut;

        return {
            totalCollected,
            totalPaidOut,
            netBalance,
            collectionsCount: collections.length,
            payoutsCount: payouts.filter((p) => p.amount > 0).length,
        };
    }, [collections, payouts]);

    if (isLoading) {
        return <StatsCarousel isLoading className="mb-6" />;
    }

    return (
        <StatsCarousel className="mb-6">
            <StatsCard
                icon={ArrowDownLeft}
                label="Total Collected"
                value={<FormattedCurrency amount={stats.totalCollected} />}
                subtext={`${stats.collectionsCount} transactions`}
                color="accent"
            />
            <StatsCard
                icon={ArrowUpRight}
                label="Total Paid Out"
                value={<FormattedCurrency amount={stats.totalPaidOut} />}
                subtext={`${stats.payoutsCount} payouts`}
                color="accent"
            />
            <StatsCard
                icon={Scale}
                label="Net Balance"
                value={<FormattedCurrency amount={Math.abs(stats.netBalance)} />}
                subtext={stats.netBalance >= 0 ? "Surplus" : "Deficit"}
                color="accent"
            />
        </StatsCarousel>
    );
};

export default TransactionStats;

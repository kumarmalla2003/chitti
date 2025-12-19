// frontend/src/components/skeletons/DashboardSkeleton.jsx

import Skeleton from "../ui/Skeleton";
import StatsCarousel from "../ui/StatsCarousel";

/**
 * Full page skeleton for DashboardPage - used as Suspense fallback
 */
const DashboardSkeleton = () => {
    const shimmerClass = "animate-pulse bg-background-tertiary";

    return (
        <div className="w-full space-y-8">
            {/* Page Header Skeleton */}
            <Skeleton.PageHeader showAction={false} />

            <hr className="border-border" />

            {/* Metrics Skeleton */}
            <StatsCarousel isLoading className="mb-8" />

            {/* Quick Actions Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="bg-background-secondary rounded-lg p-4 border border-border"
                    >
                        <div className={`w-10 h-10 rounded-full ${shimmerClass} mb-3`} />
                        <div className={`h-4 w-20 rounded ${shimmerClass}`} />
                    </div>
                ))}
            </div>

            {/* Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Collections Card */}
                <div className="bg-background-secondary rounded-lg p-6 border border-border">
                    <div className={`h-6 w-40 rounded ${shimmerClass} mb-4`} />
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="flex justify-between items-center py-2 border-b border-border last:border-b-0"
                            >
                                <div className={`h-4 w-32 rounded ${shimmerClass}`} />
                                <div className={`h-4 w-20 rounded ${shimmerClass}`} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming Payouts Card */}
                <div className="bg-background-secondary rounded-lg p-6 border border-border">
                    <div className={`h-6 w-40 rounded ${shimmerClass} mb-4`} />
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="flex justify-between items-center py-2 border-b border-border last:border-b-0"
                            >
                                <div className={`h-4 w-32 rounded ${shimmerClass}`} />
                                <div className={`h-4 w-20 rounded ${shimmerClass}`} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeleton;

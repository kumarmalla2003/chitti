// frontend/src/features/payouts/components/cards/PayoutCardSkeleton.jsx

/**
 * PayoutCardSkeleton - Skeleton placeholder matching PayoutCard layout
 */
const PayoutCardSkeleton = () => {
    const shimmerClass = "animate-pulse bg-background-tertiary";

    return (
        <div className="bg-background-secondary rounded-lg shadow-sm border border-border p-4 flex flex-col justify-between h-full">
            {/* Top Section */}
            <div>
                {/* Member name and badge */}
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${shimmerClass}`} />
                        <div className={`w-28 h-5 rounded ${shimmerClass}`} />
                    </div>
                    <div className={`w-16 h-6 rounded-full ${shimmerClass}`} />
                </div>

                {/* Chit name */}
                <div className="flex items-center gap-2 mb-3">
                    <div className={`w-4 h-4 rounded ${shimmerClass}`} />
                    <div className={`w-24 h-4 rounded ${shimmerClass}`} />
                </div>

                {/* Amount */}
                <div className="flex items-center gap-1 mb-1">
                    <div className={`w-5 h-7 rounded ${shimmerClass}`} />
                    <div className={`w-24 h-7 rounded ${shimmerClass}`} />
                </div>

                {/* Method */}
                <div className={`w-16 h-3 rounded ${shimmerClass} mb-4`} />
            </div>

            {/* Bottom Section */}
            <div className="pt-3 border-t border-border flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${shimmerClass}`} />
                    <div className={`w-20 h-4 rounded ${shimmerClass}`} />
                </div>
                <div className="flex gap-2">
                    {/* 2 action buttons: p-2 + w-4, visible ~16px */}
                    <div className={`w-5 h-5 rounded-full ${shimmerClass}`} />
                    <div className={`w-5 h-5 rounded-full ${shimmerClass}`} />
                </div>
            </div>
        </div>
    );
};

export default PayoutCardSkeleton;

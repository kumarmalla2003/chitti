// frontend/src/features/chits/components/cards/ChitCardSkeleton.jsx

/**
 * ChitCardSkeleton - Skeleton placeholder matching ChitCard layout
 */
const ChitCardSkeleton = () => {
    const shimmerClass = "animate-pulse bg-background-tertiary";

    return (
        <div className="rounded-lg p-4 shadow-md bg-background-secondary">
            {/* Top Row: Name and Actions */}
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${shimmerClass}`} />
                    <div className={`w-32 h-5 rounded ${shimmerClass}`} />
                </div>
                <div className="flex items-center gap-1">
                    <div className={`w-9 h-9 rounded-full ${shimmerClass}`} />
                    <div className={`w-9 h-9 rounded-full ${shimmerClass}`} />
                    <div className={`w-9 h-9 rounded-full ${shimmerClass}`} />
                </div>
            </div>

            {/* Middle Row: Values */}
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded ${shimmerClass}`} />
                    <div className={`w-24 h-5 rounded ${shimmerClass}`} />
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded ${shimmerClass}`} />
                    <div className={`w-20 h-5 rounded ${shimmerClass}`} />
                </div>
            </div>

            {/* Bottom Separator */}
            <hr className="border-border mb-3" />

            {/* Bottom Row: Dates and Cycle */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${shimmerClass}`} />
                    <div className={`w-28 h-4 rounded ${shimmerClass}`} />
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${shimmerClass}`} />
                    <div className={`w-16 h-4 rounded ${shimmerClass}`} />
                </div>
            </div>
        </div>
    );
};

export default ChitCardSkeleton;

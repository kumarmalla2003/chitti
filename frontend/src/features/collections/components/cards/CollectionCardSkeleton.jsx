// frontend/src/features/collections/components/cards/CollectionCardSkeleton.jsx

/**
 * CollectionCardSkeleton - Skeleton placeholder matching CollectionCard layout
 */
const CollectionCardSkeleton = () => {
    const shimmerClass = "animate-pulse bg-background-tertiary";

    return (
        <div className="rounded-lg p-4 shadow-md bg-background-secondary">
            {/* Top Row: Name and Actions */}
            <div className="flex justify-between items-center mb-3">
            <div className={`w-32 h-6 rounded ${shimmerClass}`} />
                <div className="flex items-center gap-2">
                    {/* 2 action buttons: p-2 + w-5, visible ~24px */}
                    <div className={`w-6 h-6 rounded-full ${shimmerClass}`} />
                    <div className={`w-6 h-6 rounded-full ${shimmerClass}`} />
                </div>
            </div>

            {/* Middle Row: Amount and Chit */}
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

            {/* Bottom Row: Date and Method */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${shimmerClass}`} />
                    <div className={`w-24 h-4 rounded ${shimmerClass}`} />
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${shimmerClass}`} />
                    <div className={`w-16 h-4 rounded ${shimmerClass}`} />
                </div>
            </div>
        </div>
    );
};

export default CollectionCardSkeleton;

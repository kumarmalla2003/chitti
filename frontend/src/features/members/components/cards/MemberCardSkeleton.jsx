// frontend/src/features/members/components/cards/MemberCardSkeleton.jsx

/**
 * MemberCardSkeleton - Skeleton placeholder matching MemberCard layout
 */
const MemberCardSkeleton = () => {
    const shimmerClass = "animate-pulse bg-background-tertiary";

    return (
        <div className="rounded-lg p-4 shadow-md bg-background-secondary">
            {/* Top Row: Name and Actions */}
            <div className="flex justify-between items-center mb-3">
            <div className={`w-32 h-6 rounded ${shimmerClass}`} />
                <div className="flex items-center gap-2">
                    {/* 3 action buttons: p-2 + w-5, visible ~24px */}
                    <div className={`w-6 h-6 rounded-full ${shimmerClass}`} />
                    <div className={`w-6 h-6 rounded-full ${shimmerClass}`} />
                    <div className={`w-6 h-6 rounded-full ${shimmerClass}`} />
                </div>
            </div>

            {/* Separator */}
            <hr className="border-border mb-3" />

            {/* Bottom Row: Phone and Active count */}
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

export default MemberCardSkeleton;

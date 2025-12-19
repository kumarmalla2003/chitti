// frontend/src/components/skeletons/CollectionsPageSkeleton.jsx

import Skeleton from "../ui/Skeleton";
import StatsCarousel from "../ui/StatsCarousel";
import CollectionCardSkeleton from "../../features/collections/components/cards/CollectionCardSkeleton";

const ITEMS_PER_PAGE = 10;

/**
 * Full page skeleton for CollectionsPage - used as Suspense fallback
 */
const CollectionsPageSkeleton = () => {
    return (
        <div className="w-full space-y-8">
            {/* Page Header Skeleton */}
            <Skeleton.PageHeader showAction={true} />

            <hr className="border-border" />

            {/* Metrics Skeleton */}
            <StatsCarousel isLoading className="mb-8" />

            {/* SearchToolbar Skeleton */}
            <Skeleton.SearchToolbar />

            {/* Table Skeleton (desktop default) */}
            <div className="hidden md:block">
                <Skeleton.Table
                    rows={ITEMS_PER_PAGE}
                    columnWidths={[
                        "w-16",  // S.No
                        "w-1/5", // Member
                        "w-1/5", // Chit
                        "w-1/6", // Amount
                        "w-1/6", // Date
                        "w-24",  // Status
                        "w-32",  // Actions
                    ]}
                    serialColumnIndex={0}
                    statusColumnIndex={5}
                    actionColumnIndex={6}
                />
            </div>

            {/* Card Skeleton (mobile) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {[...Array(6)].map((_, i) => (
                    <CollectionCardSkeleton key={i} />
                ))}
            </div>

            {/* Pagination Skeleton */}
            <Skeleton.Pagination />
        </div>
    );
};

export default CollectionsPageSkeleton;

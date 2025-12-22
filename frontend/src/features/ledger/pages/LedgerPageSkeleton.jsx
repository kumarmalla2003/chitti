// frontend/src/features/ledger/pages/LedgerPageSkeleton.jsx

import Skeleton from "../../../components/ui/Skeleton";
import StatsCarousel from "../../../components/ui/StatsCarousel";

const ITEMS_PER_PAGE = 10;

const LedgerPageSkeleton = () => {
    return (
        <div className="w-full space-y-8">
            {/* Page Header Skeleton */}
            <Skeleton.PageHeader showAction={true} />

            <hr className="border-border" />

            {/* Tab Bar Skeleton */}
            <div className="flex items-center gap-4 border-b border-border pb-2">
                <Skeleton.Text width="w-24" height="h-8" />
                <Skeleton.Text width="w-20" height="h-8" />
                <Skeleton.Text width="w-12" height="h-8" />
            </div>

            {/* Metrics Carousel Skeleton */}
            <StatsCarousel isLoading className="mb-8" />

            {/* Search Toolbar Skeleton */}
            <Skeleton.SearchToolbar />

            {/* Table Skeleton */}
            <Skeleton.Table
                rows={ITEMS_PER_PAGE}
                columnWidths={[
                    "w-16",   // S.No
                    "w-1/6",  // Date
                    "w-1/5",  // Member
                    "w-1/5",  // Chit
                    "w-1/6",  // Amount
                    "w-24",   // Status
                    "w-28",   // Actions
                ]}
                serialColumnIndex={0}
                statusColumnIndex={5}
                actionColumnIndex={6}
            />

            {/* Pagination Skeleton */}
            <Skeleton.Pagination />
        </div>
    );
};

export default LedgerPageSkeleton;

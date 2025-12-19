// frontend/src/components/skeletons/ChitsPageSkeleton.jsx

import Skeleton from "../ui/Skeleton";
import StatsCarousel from "../ui/StatsCarousel";
import ChitCardSkeleton from "../../features/chits/components/cards/ChitCardSkeleton";

const ITEMS_PER_PAGE = 10;

/**
 * Full page skeleton for ChitsPage - used as Suspense fallback
 * Matches the exact layout of the loaded ChitsPage
 */
const ChitsPageSkeleton = () => {
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
            "w-16", // S.No
            "w-1/4", // Chit Name
            "w-1/6", // Chit Value
            "w-1/6", // Installment
            "w-1/6", // Chit Cycle
            "w-24", // Status
            "w-32", // Actions
          ]}
          serialColumnIndex={0}
          statusColumnIndex={5}
          actionColumnIndex={6}
        />
      </div>

      {/* Card Skeleton (mobile) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {[...Array(6)].map((_, i) => (
          <ChitCardSkeleton key={i} />
        ))}
      </div>

      {/* Pagination Skeleton */}
      <Skeleton.Pagination />
    </div>
  );
};

export default ChitsPageSkeleton;

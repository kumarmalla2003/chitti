// frontend/src/components/skeletons/MembersPageSkeleton.jsx

import Skeleton from "../ui/Skeleton";
import StatsCarousel from "../ui/StatsCarousel";
import MemberCardSkeleton from "../../features/members/components/cards/MemberCardSkeleton";

const ITEMS_PER_PAGE = 10;

/**
 * Full page skeleton for MembersPage - used as Suspense fallback
 */
const MembersPageSkeleton = () => {
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
                        "w-1/4", // Name
                        "w-1/6", // Phone
                        "w-1/6", // Total Chits
                        "w-24",  // Status
                        "w-32",  // Actions
                    ]}
                    serialColumnIndex={0}
                    statusColumnIndex={4}
                    actionColumnIndex={5}
                />
            </div>

            {/* Card Skeleton (mobile) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {[...Array(6)].map((_, i) => (
                    <MemberCardSkeleton key={i} />
                ))}
            </div>

            {/* Pagination Skeleton */}
            <Skeleton.Pagination />
        </div>
    );
};

export default MembersPageSkeleton;

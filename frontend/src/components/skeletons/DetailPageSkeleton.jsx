// frontend/src/components/skeletons/DetailPageSkeleton.jsx

import Skeleton from "../ui/Skeleton";

/**
 * Generic detail page skeleton for create/edit/view pages
 * Used as Suspense fallback for ChitDetailPage, MemberDetailPage, etc.
 */
const DetailPageSkeleton = () => {
    const shimmerClass = "animate-pulse bg-background-tertiary";

    return (
        <div className="w-full space-y-6">
            {/* Page Header with Back Button */}
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full ${shimmerClass}`} />
                <div className={`h-8 w-48 rounded ${shimmerClass}`} />
            </div>

            <hr className="border-border" />

            {/* Form Card */}
            <div className="bg-background-secondary rounded-lg p-6 border border-border">
                {/* Section Title */}
                <div className="flex justify-center mb-4">
                    <div className={`h-6 w-32 rounded ${shimmerClass}`} />
                </div>
                <hr className="border-border mb-6" />

                {/* Form Fields */}
                <div className="space-y-6">
                    {/* Row 1: Two fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <div className={`h-5 w-24 rounded ${shimmerClass}`} />
                            <div className={`h-12 w-full rounded ${shimmerClass}`} />
                        </div>
                        <div className="space-y-2">
                            <div className={`h-5 w-28 rounded ${shimmerClass}`} />
                            <div className={`h-12 w-full rounded ${shimmerClass}`} />
                        </div>
                    </div>

                    {/* Row 2: Two fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <div className={`h-5 w-20 rounded ${shimmerClass}`} />
                            <div className={`h-12 w-full rounded ${shimmerClass}`} />
                        </div>
                        <div className="space-y-2">
                            <div className={`h-5 w-32 rounded ${shimmerClass}`} />
                            <div className={`h-12 w-full rounded ${shimmerClass}`} />
                        </div>
                    </div>

                    {/* Row 3: Two fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <div className={`h-5 w-24 rounded ${shimmerClass}`} />
                            <div className={`h-12 w-full rounded ${shimmerClass}`} />
                        </div>
                        <div className="space-y-2">
                            <div className={`h-5 w-20 rounded ${shimmerClass}`} />
                            <div className={`h-12 w-full rounded ${shimmerClass}`} />
                        </div>
                    </div>

                    {/* Notes Field */}
                    <div className="space-y-2">
                        <div className={`h-5 w-16 rounded ${shimmerClass}`} />
                        <div className={`h-24 w-full rounded ${shimmerClass}`} />
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
                <div className={`h-12 w-40 rounded-lg ${shimmerClass}`} />
            </div>
        </div>
    );
};

export default DetailPageSkeleton;

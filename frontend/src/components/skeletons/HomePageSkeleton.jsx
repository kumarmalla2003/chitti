// frontend/src/components/skeletons/HomePageSkeleton.jsx

/**
 * Skeleton for HomePage - minimal loading state for public landing page
 */
const HomePageSkeleton = () => {
    const shimmerClass = "animate-pulse bg-background-tertiary";

    return (
        <div className="min-h-screen flex flex-col">
            {/* Hero Section */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
                {/* Logo */}
                <div className={`w-24 h-24 rounded-full ${shimmerClass}`} />

                {/* Title */}
                <div className={`h-10 w-64 rounded ${shimmerClass}`} />

                {/* Subtitle */}
                <div className={`h-6 w-80 rounded ${shimmerClass}`} />

                {/* CTA Button */}
                <div className={`h-12 w-40 rounded-lg ${shimmerClass} mt-4`} />
            </div>

            {/* Footer */}
            <div className="p-4 flex justify-center">
                <div className={`h-4 w-48 rounded ${shimmerClass}`} />
            </div>
        </div>
    );
};

export default HomePageSkeleton;

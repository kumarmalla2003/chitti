// frontend/src/components/ui/PageLoader.jsx

/**
 * Generic page loader skeleton shown during route code chunk loading.
 * This is used as a Suspense fallback to provide instant visual feedback.
 */
const PageLoader = () => {
    return (
        <div className="w-full animate-pulse">
            {/* Title skeleton */}
            <div className="flex justify-center mb-4">
                <div className="h-8 bg-background-tertiary rounded w-1/3"></div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border my-4"></div>

            {/* Content skeletons */}
            <div className="space-y-6">
                {/* Card skeleton 1 */}
                <div className="bg-background-secondary rounded-lg p-6 border border-border">
                    <div className="h-6 bg-background-tertiary rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-background-tertiary rounded w-full"></div>
                        <div className="h-4 bg-background-tertiary rounded w-3/4"></div>
                        <div className="h-4 bg-background-tertiary rounded w-1/2"></div>
                    </div>
                </div>

                {/* Card skeleton 2 */}
                <div className="bg-background-secondary rounded-lg p-6 border border-border">
                    <div className="h-6 bg-background-tertiary rounded w-1/4 mb-4"></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-24 bg-background-tertiary rounded"></div>
                        <div className="h-24 bg-background-tertiary rounded"></div>
                    </div>
                </div>

                {/* Card skeleton 3 */}
                <div className="bg-background-secondary rounded-lg p-6 border border-border">
                    <div className="h-6 bg-background-tertiary rounded w-1/4 mb-4"></div>
                    <div className="space-y-2">
                        <div className="h-10 bg-background-tertiary rounded w-full"></div>
                        <div className="h-10 bg-background-tertiary rounded w-full"></div>
                        <div className="h-10 bg-background-tertiary rounded w-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PageLoader;

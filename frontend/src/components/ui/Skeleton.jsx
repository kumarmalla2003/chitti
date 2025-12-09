// frontend/src/components/ui/Skeleton.jsx

/**
 * Skeleton - Reusable loading placeholder components with shimmer animation
 */

const shimmerClass = "animate-pulse bg-background-tertiary";

// Base skeleton element
const Skeleton = ({ className = "", ...props }) => {
    return (
        <div
            className={`${shimmerClass} rounded ${className}`}
            {...props}
        />
    );
};

// Text line skeleton
Skeleton.Text = ({ width = "w-full", height = "h-4", className = "" }) => (
    <div className={`${shimmerClass} rounded ${width} ${height} ${className}`} />
);

// Circle skeleton (for avatars)
Skeleton.Circle = ({ size = "w-10 h-10", className = "" }) => (
    <div className={`${shimmerClass} rounded-full ${size} ${className}`} />
);

// Card skeleton
Skeleton.Card = ({ className = "" }) => (
    <div className={`bg-background-secondary rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
            <Skeleton.Circle size="w-10 h-10" />
            <div className="flex-1 space-y-2">
                <Skeleton.Text width="w-3/4" height="h-4" />
                <Skeleton.Text width="w-1/2" height="h-3" />
            </div>
        </div>
        <div className="space-y-3">
            <Skeleton.Text width="w-full" height="h-3" />
            <Skeleton.Text width="w-5/6" height="h-3" />
            <Skeleton.Text width="w-4/6" height="h-3" />
        </div>
    </div>
);

// Table row skeleton
Skeleton.TableRow = ({ columns = 5, className = "" }) => (
    <tr className={className}>
        {[...Array(columns)].map((_, i) => (
            <td key={i} className="px-4 py-3">
                <Skeleton.Text width={i === 0 ? "w-8" : "w-full"} height="h-4" />
            </td>
        ))}
    </tr>
);

// Table skeleton
Skeleton.Table = ({ rows = 5, columns = 5, className = "" }) => (
    <div className={`overflow-hidden rounded-lg border border-border ${className}`}>
        <table className="w-full">
            <thead>
                <tr className="bg-background-tertiary">
                    {[...Array(columns)].map((_, i) => (
                        <th key={i} className="px-4 py-3">
                            <Skeleton.Text width="w-20" height="h-4" />
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="bg-background-secondary">
                {[...Array(rows)].map((_, i) => (
                    <Skeleton.TableRow key={i} columns={columns} />
                ))}
            </tbody>
        </table>
    </div>
);

export default Skeleton;

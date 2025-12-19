// frontend/src/components/ui/Skeleton.jsx

/**
 * Skeleton - Reusable loading placeholder components with shimmer animation
 */

const shimmerClass = "animate-pulse bg-background-tertiary";

// Base skeleton element
const Skeleton = ({ className = "", ...props }) => {
  return <div className={`${shimmerClass} rounded ${className}`} {...props} />;
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
Skeleton.TableRow = ({ columns = 5, columnWidths = [], actionColumnIndex = -1, serialColumnIndex = -1, statusColumnIndex = -1, className = "" }) => (
  <tr className={className}>
    {columnWidths.length > 0
      ? columnWidths.map((width, i) => (
        <td key={i} className={`px-4 py-3 ${width}`}>
          {i === actionColumnIndex ? (
            // Render action icon placeholders
            // Real ActionButton: p-2 + w-5 icon = 36px, visible area ~24px
            // Using w-6 (24px) + gap-2 (8px) to match visible icons with spacing
            <div className="flex items-center justify-center gap-2">
              <div className={`${shimmerClass} rounded-full w-6 h-6`} />
              <div className={`${shimmerClass} rounded-full w-6 h-6`} />
              <div className={`${shimmerClass} rounded-full w-6 h-6`} />
            </div>
          ) : i === serialColumnIndex ? (
            // Render small centered placeholder for serial numbers
            <Skeleton.Text width="w-6" height="h-4" className="mx-auto" />
          ) : i === statusColumnIndex ? (
            // Render badge-like placeholder for status columns
            <div className={`${shimmerClass} rounded-full w-16 h-5 mx-auto`} />
          ) : (
            <Skeleton.Text width="w-full" height="h-4" />
          )}
        </td>
      ))
      : [...Array(columns)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton.Text width={i === 0 ? "w-8" : "w-full"} height="h-4" />
        </td>
      ))}
  </tr>
);

// Table skeleton
Skeleton.Table = ({
  rows = 5,
  columns = 5,
  columnWidths = [],
  actionColumnIndex = -1,
  serialColumnIndex = -1,
  statusColumnIndex = -1,
  className = "",
}) => (
  <div
    className={`overflow-hidden rounded-lg border border-border shadow-card ${className}`}
    role="status"
    aria-label="Loading table data"
  >
    <table className="w-full">
      <thead>
        <tr className="bg-background-secondary">
          {columnWidths.length > 0
            ? columnWidths.map((width, i) => (
              <th key={i} className={`px-4 py-4 border-b-2 border-border ${width}`}>
                <Skeleton.Text
                  width="w-1/2"
                  height="h-4"
                  className="mx-auto"
                />
              </th>
            ))
            : [...Array(columns)].map((_, i) => (
              <th key={i} className="px-4 py-4 border-b-2 border-border">
                <Skeleton.Text width="w-1/2" height="h-4" className="mx-auto" />
              </th>
            ))}
        </tr>
      </thead>
      <tbody className="bg-background-secondary">
        {[...Array(rows)].map((_, i) => (
          <Skeleton.TableRow
            key={i}
            columns={columns}
            columnWidths={columnWidths}
            actionColumnIndex={actionColumnIndex}
            serialColumnIndex={serialColumnIndex}
            statusColumnIndex={statusColumnIndex}
            className=""
          />
        ))}
      </tbody>
    </table>
  </div>
);

// Search Toolbar skeleton
Skeleton.SearchToolbar = ({ className = "" }) => (
  <div
    className={`mb-6 flex flex-row items-center bg-background-secondary border border-border rounded-md shadow-sm h-12 ${className}`}
    role="status"
    aria-label="Loading toolbar"
  >
    {/* Search Input Placeholder */}
    <div className="flex-1 flex items-center pl-3">
      {/* Icon */}
      <div className={`${shimmerClass} rounded w-5 h-5`} />
      {/* Internal Divider (matches absolute left-10) */}
      <div className="h-6 w-px bg-border ml-2 mr-2" />
      {/* Search Text */}
      <div className={`${shimmerClass} rounded h-4 w-full max-w-[12rem]`} />
    </div>

    {/* Divider */}
    <div className="h-6 w-px bg-border" />

    {/* Actions Placeholder (Filter & Sort) */}
    {/* Real buttons: p-3 + w-5 = 44px, visible with hover ~32px */}
    {/* Using w-8 (32px) to represent visible area with hover background */}
    <div className="flex items-center">
      <div className={`${shimmerClass} rounded-full w-8 h-8 mx-1`} />
      <div className="h-6 w-px bg-border" />
      <div className={`${shimmerClass} rounded-full w-8 h-8 mx-1`} />
    </div>

    {/* View Toggle Placeholder */}
    <div className="h-6 w-px bg-border md:hidden" />
    <div className="flex items-center md:hidden">
      <div className={`${shimmerClass} rounded-full w-8 h-8 mx-1`} />
    </div>
  </div>
);

// Stats Card Skeleton
Skeleton.StatsCard = ({ className = "" }) => (
  <div
    className={`rounded-xl p-5 md:p-6 flex items-center justify-between shadow-card bg-background-secondary ${className}`}
  >
    <div className="flex flex-col">
      {/* Label - text-xs (12px) = h-3 + mb-2 */}
      <Skeleton.Text width="w-20" height="h-3" className="mb-2" />
      {/* Value - text-2xl/3xl */}
      <Skeleton.Text width="w-32" height="h-8" />
      {/* Subtext - text-xs + mt-2 */}
      <Skeleton.Text width="w-24" height="h-3" className="mt-2" />
    </div>

    {/* Icon Placeholder - w-7(28px) + p-3(12px*2) = 52px */}
    <div className={`${shimmerClass} w-[52px] h-[52px] rounded-2xl`} />
  </div>
);

// Input field skeleton (for forms)
Skeleton.Input = ({ className = "" }) => (
  <div className={`${shimmerClass} rounded-md h-10 w-full ${className}`} />
);

// Page Header Skeleton
Skeleton.PageHeader = ({ showAction = true, className = "" }) => (
  <div
    className={`relative flex justify-center items-center mb-4 ${className}`}
    role="status"
    aria-label="Loading header"
  >
    {/* Title placeholder - text-2xl/3xl */}
    <div className={`${shimmerClass} rounded h-7 md:h-8 w-32`} />

    {/* Action button placeholder - w-6 icon + visible hover area ~32px */}
    {showAction && (
      <div className="absolute right-0">
        <div className={`${shimmerClass} rounded-full w-8 h-8`} />
      </div>
    )}
  </div>
);

// Pagination Skeleton
Skeleton.Pagination = ({ className = "" }) => (
  <div
    className={`flex justify-between items-center mt-4 w-full px-2 ${className}`}
    role="status"
    aria-label="Loading pagination"
  >
    {/* Previous button - p-2 + w-5 = 36px, visible ~24px */}
    <div className={`${shimmerClass} rounded-full w-6 h-6`} />

    {/* Page info text - text-sm (14px) = h-3.5 */}
    <div className={`${shimmerClass} rounded h-3.5 w-24`} />

    {/* Next button */}
    <div className={`${shimmerClass} rounded-full w-6 h-6`} />
  </div>
);

export default Skeleton;

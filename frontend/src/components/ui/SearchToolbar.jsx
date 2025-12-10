// frontend/src/components/ui/SearchToolbar.jsx

import { useState, useRef, useEffect } from "react";
import { Search, X, ArrowUpDown, Filter, LayoutGrid, List, Check } from "lucide-react";

/**
 * SearchToolbar - Unified search bar with integrated sort, filter, and view toggle.
 *
 * @param {string} searchPlaceholder - Placeholder for search input
 * @param {string} searchValue - Current search value
 * @param {function} onSearchChange - Search change handler
 * @param {Array} sortOptions - Array of {value, label} for sort dropdown
 * @param {string} sortValue - Current sort value
 * @param {function} onSortChange - Sort change handler
 * @param {Array} filterOptions - Array of {value, label} for filter dropdown
 * @param {string|null} filterValue - Current filter value (null = All)
 * @param {function} onFilterChange - Filter change handler
 * @param {string} viewMode - Current view mode ("table" | "card")
 * @param {function} onViewChange - View change handler
 * @param {boolean} showViewToggle - Whether to show view toggle (default: true)
 */
const SearchToolbar = ({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  sortOptions = [],
  sortValue,
  onSortChange,
  filterOptions = [],
  filterValue,
  onFilterChange,
  viewMode,
  onViewChange,
  showViewToggle = true,
}) => {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const sortRef = useRef(null);
  const filterRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    onSearchChange("");
    inputRef.current?.blur();
  };

  const handleViewToggle = () => {
    onViewChange(viewMode === "table" ? "card" : "table");
  };

  const selectedSort = sortOptions.find((o) => o.value === sortValue);
  const selectedFilter = filterOptions.find((o) => o.value === filterValue);

  const iconButtonClass =
    "p-3 text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded-full transition-colors duration-200 flex items-center justify-center cursor-pointer";

  return (
    <div className="mb-6 flex flex-row items-center gap-0 bg-background-secondary border border-border rounded-md">
      {/* Search Input */}
      <div className="flex-1 relative flex items-center">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="w-5 h-5 text-text-secondary" />
        </span>
        <div className="absolute left-10 h-6 w-px bg-border"></div>
        <input
          ref={inputRef}
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full pl-12 pr-10 py-3 bg-transparent border-0 focus:outline-none focus:ring-0"
        />
        {searchValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            title="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-border"></div>

      {/* Filter Dropdown */}
      {filterOptions.length > 0 && (
        <div ref={filterRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setIsFilterOpen(!isFilterOpen);
              setIsSortOpen(false);
            }}
            className={iconButtonClass}
            title={`Filter: ${selectedFilter?.label || "All"}`}
          >
            <Filter className={`w-5 h-5 ${filterValue ? "text-accent" : ""}`} />
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-background-primary border border-border rounded-md shadow-floating z-50">
              <button
                type="button"
                onClick={() => {
                  onFilterChange(null);
                  setIsFilterOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2 text-sm text-text-primary hover:bg-background-secondary transition-colors cursor-pointer rounded-t-md"
              >
                <span>All</span>
                {filterValue === null && <Check className="w-4 h-4 text-accent" />}
              </button>
              {filterOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onFilterChange(option.value);
                    setIsFilterOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm text-text-primary hover:bg-background-secondary transition-colors cursor-pointer ${
                    index === filterOptions.length - 1 ? "rounded-b-md" : ""
                  }`}
                >
                  <span>{option.label}</span>
                  {filterValue === option.value && (
                    <Check className="w-4 h-4 text-accent" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="h-6 w-px bg-border"></div>

      {/* Sort Dropdown */}
      {sortOptions.length > 0 && (
        <div ref={sortRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setIsSortOpen(!isSortOpen);
              setIsFilterOpen(false);
            }}
            className={iconButtonClass}
            title={`Sort: ${selectedSort?.label || "Default"}`}
          >
            <ArrowUpDown className="w-5 h-5" />
          </button>

          {isSortOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-background-primary border border-border rounded-md shadow-floating z-50">
              {sortOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onSortChange(option.value);
                    setIsSortOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm text-text-primary hover:bg-background-secondary transition-colors cursor-pointer ${
                    index === 0 ? "rounded-t-md" : ""
                  } ${index === sortOptions.length - 1 ? "rounded-b-md" : ""}`}
                >
                  <span>{option.label}</span>
                  {sortValue === option.value && (
                    <Check className="w-4 h-4 text-accent" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View Toggle (mobile only) */}
      {showViewToggle && (
        <>
          <div className="h-6 w-px bg-border md:hidden"></div>
          <button
            onClick={handleViewToggle}
            className={`md:hidden ${iconButtonClass}`}
            title={viewMode === "table" ? "Switch to Card View" : "Switch to Table View"}
          >
            {viewMode === "table" ? (
              <LayoutGrid className="w-5 h-5" />
            ) : (
              <List className="w-5 h-5" />
            )}
          </button>
        </>
      )}
    </div>
  );
};

export default SearchToolbar;

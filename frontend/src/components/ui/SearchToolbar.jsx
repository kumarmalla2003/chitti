import { useState, useRef, useEffect } from "react";
import { Search, X, ArrowUpDown, LayoutGrid, List, Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * SearchToolbar - Unified search bar with integrated sort, filter chips, and view toggle.
 *
 * @param {string} searchPlaceholder - Placeholder for search input
 * @param {string} searchValue - Current search value
 * @param {function} onSearchChange - Search change handler
 * @param {Array} sortOptions - Array of {value, label} for sort dropdown
 * @param {string} sortValue - Current sort value
 * @param {function} onSortChange - Sort change handler
 * @param {Array} filterOptions - Array of {value, label} for filter chips
 * @param {string|null} filterValue - Current filter value (null = All)
 * @param {function} onFilterChange - Filter change handler
 * @param {string} viewMode - Current view mode ("table" | "card")
 * @param {function} onViewChange - View change handler
 * @param {boolean} showViewToggle - Whether to show view toggle (default: true)
 * @param {Array} dropdownFilters - Array of {id, value, options, onChange, placeholder, icon} for dropdown filters
 * @param {React.ReactNode} customFilterElement - Custom filter element to render in filter row
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
  dropdownFilters = [],
  customFilterElement = null,
}) => {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
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

  const iconButtonClass =
    "p-3 text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded-full transition-colors duration-200 flex items-center justify-center cursor-pointer";

  const dropdownAnimations = {
    initial: { opacity: 0, y: -10, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.95 },
    transition: { duration: 0.2, ease: "easeOut" },
  };

  // Chip styles
  const chipBaseClass =
    "px-2.5 py-1 rounded-full text-xs font-medium transition-colors duration-200 cursor-pointer";
  const chipSelectedClass = "bg-accent text-white";
  const chipUnselectedClass =
    "bg-background-tertiary text-text-secondary hover:bg-background-secondary hover:text-text-primary border border-border";

  // Dropdown select styles (consistent with chip styles)
  const selectBaseClass =
    "appearance-none pl-7 pr-6 py-1 text-xs font-medium rounded-full border transition-colors duration-200 cursor-pointer bg-background-tertiary text-text-secondary hover:bg-background-secondary hover:text-text-primary border-border focus:outline-none focus:ring-1 focus:ring-accent";
  const selectActiveClass =
    "appearance-none pl-7 pr-6 py-1 text-xs font-medium rounded-full border transition-colors duration-200 cursor-pointer bg-accent/10 text-accent border-accent focus:outline-none focus:ring-1 focus:ring-accent";

  return (
    <div className="mb-3 flex flex-col gap-3">
      {/* Main Toolbar Row */}
      <div className="flex flex-row items-center gap-0 bg-background-secondary border border-border rounded-md shadow-sm">
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
            className="w-full pl-12 pr-2 py-3 bg-transparent border-0 focus:outline-none focus:ring-0 text-text-primary placeholder-text-secondary placeholder-opacity-70"
          />
          {searchValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 flex items-center pr-3 pl-1 text-text-secondary hover:text-text-primary transition-colors cursor-pointer bg-transparent"
              title="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-border"></div>

        {/* Sort Dropdown */}
        {sortOptions.length > 0 && (
          <div ref={sortRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsSortOpen(!isSortOpen);
              }}
              className={`${iconButtonClass} ${isSortOpen ? "text-accent bg-accent/10" : ""}`}
              title={`Sort: ${selectedSort?.label || "Default"}`}
            >
              <ArrowUpDown className={`w-5 h-5 ${isSortOpen ? "text-accent" : ""}`} />
            </button>

            <AnimatePresence>
              {isSortOpen && (
                <motion.div
                  {...dropdownAnimations}
                  className="absolute right-0 mt-2 w-56 bg-background-primary border border-border rounded-lg shadow-xl z-50 overflow-hidden ring-1 ring-black/5"
                >
                  <div className="p-1">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          onSortChange(option.value);
                          setIsSortOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors cursor-pointer rounded-md ${sortValue === option.value
                          ? "bg-accent/10 text-accent font-medium"
                          : "text-text-secondary hover:bg-background-secondary hover:text-text-primary"
                          }`}
                      >
                        <span>{option.label}</span>
                        {sortValue === option.value && (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* View Toggle (mobile only) */}
        {showViewToggle && (
          <>
            <div className="h-6 w-px bg-border"></div>
            <button
              onClick={handleViewToggle}
              className={`${iconButtonClass}`}
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

      {/* Filter Row: Custom Filters + Dropdown Filters + Chips */}
      {(filterOptions.length > 0 || dropdownFilters.length > 0 || customFilterElement) && (
        <div className="flex overflow-x-auto gap-2 no-scrollbar items-center">
          {/* Custom Filter Element */}
          {customFilterElement}
          {/* Dropdown Filters */}
          {dropdownFilters.map((dropdown) => {
            const Icon = dropdown.icon;
            const hasValue = dropdown.value !== null && dropdown.value !== "";
            return (
              <div key={dropdown.id} className="relative flex-shrink-0">
                {Icon && (
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                    <Icon className={`w-3 h-3 ${hasValue ? "text-accent" : "text-text-secondary"}`} />
                  </span>
                )}
                <select
                  value={dropdown.value || ""}
                  onChange={(e) => dropdown.onChange(e.target.value || null)}
                  className={hasValue ? selectActiveClass : selectBaseClass}
                >
                  <option value="">{dropdown.placeholder}</option>
                  {dropdown.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 flex items-center pr-1.5 pointer-events-none">
                  <ChevronDown className={`w-3 h-3 ${hasValue ? "text-accent" : "text-text-secondary"}`} />
                </span>
              </div>
            );
          })}

          {/* Divider between dropdowns and chips */}
          {dropdownFilters.length > 0 && filterOptions.length > 0 && (
            <div className="h-4 w-px bg-border flex-shrink-0"></div>
          )}

          {/* Filter Chips */}
          {filterOptions.length > 0 && (
            <>
              {/* All Chip */}
              <button
                type="button"
                onClick={() => onFilterChange(null)}
                className={`${chipBaseClass} ${filterValue === null ? chipSelectedClass : chipUnselectedClass
                  }`}
              >
                All
              </button>
              {/* Filter Option Chips */}
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onFilterChange(option.value)}
                  className={`${chipBaseClass} ${filterValue === option.value ? chipSelectedClass : chipUnselectedClass
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchToolbar;


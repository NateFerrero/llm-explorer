"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

interface SearchFilterProps {
  placeholder: string;
  onFilterChange: (value: string) => void;
  totalResults?: number;
  filteredResults?: number;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  placeholder,
  onFilterChange,
  totalResults,
  filteredResults,
}) => {
  const [filterValue, setFilterValue] = useState("");

  // Update parent component when filter value changes
  useEffect(() => {
    onFilterChange(filterValue);
  }, [filterValue, onFilterChange]);

  const handleClearFilter = () => {
    setFilterValue("");
  };

  return (
    <div className="border-b border-slate-700 bg-slate-800 px-4 py-2">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
          className="block w-full rounded-md border-transparent bg-slate-700 py-2 pl-10 pr-10 text-sm text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-0"
          placeholder={placeholder}
        />
        {filterValue && (
          <button
            onClick={handleClearFilter}
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            aria-label="Clear filter"
          >
            <X className="h-4 w-4 text-slate-400 hover:text-slate-300" />
          </button>
        )}
      </div>

      {/* Show result count when filtering */}
      {filterValue &&
        totalResults !== undefined &&
        filteredResults !== undefined && (
          <div className="mt-2 text-xs text-slate-400">
            Showing {filteredResults} of {totalResults} results
          </div>
        )}
    </div>
  );
};

export default SearchFilter;

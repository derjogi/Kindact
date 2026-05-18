"use client";

import { useState } from "react";

interface DiscussionSearchProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  isActive: boolean;
}

export default function DiscussionSearch({ onSearch, onClear, isActive }: DiscussionSearchProps) {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery("");
    onClear();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") handleClear();
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="relative flex-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search discussions…"
          className="input-line w-full pl-8 pr-3 py-2 text-sm focus:outline-none"
        />
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs">
          🔍
        </span>
      </div>
      {isActive ? (
        <button
          onClick={handleClear}
          className="px-3 py-2 text-sm text-on-surface-variant hover:text-primary-dim transition-colors"
        >
          Clear
        </button>
      ) : (
        <button
          onClick={handleSearch}
          className="btn-primary px-3 py-2 text-sm rounded-md transition-colors"
        >
          Search
        </button>
      )}
    </div>
  );
}

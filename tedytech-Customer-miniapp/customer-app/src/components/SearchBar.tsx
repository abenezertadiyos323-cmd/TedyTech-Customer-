import { useState, useRef, useEffect } from "react";
import { Search, X, Menu, Clock, TrendingUp, Flame, Star } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useSearchPanelData, useLogSearch, useSearchProducts, type SearchProductResult } from "@/hooks/useSearch";
import { useDebounce } from "@/hooks/useDebounce";
import { SearchResultsDropdown } from "./SearchResultsDropdown";
import type { Phone } from "@/types/phone";

interface SearchBarProps {
  onOpenFilters: () => void;
  onSelectPhone: (phone: Phone) => void;
}

export function SearchBar({ onOpenFilters, onSelectPhone }: SearchBarProps) {
  const { searchQuery, setSearchQuery, sessionId } = useApp();
  const { data: searchPanelData } = useSearchPanelData();
  const logSearch = useLogSearch(sessionId);

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isSearchApplied, setIsSearchApplied] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Debounce the local query for live search (250ms)
  const debouncedQuery = useDebounce(localQuery, 250);

  // Fetch search results based on debounced query
  const { data: searchResults = [], isLoading: isSearching } = useSearchProducts(
    debouncedQuery.length >= 2 ? debouncedQuery : null,
    { limit: 8 }
  );

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("tedytech-recent-searches");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (
        Array.isArray(parsed) &&
        parsed.every((item) => typeof item === "string")
      ) {
        return parsed.slice(0, 5);
      }
    } catch {
      // Invalid JSON in localStorage, return empty array
    }
    return [];
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hotSearches =
    searchPanelData?.hot_searches?.map((h) => h.label || h.term) || [];
  const topSearches = searchPanelData?.top_searches?.map((t) => t.term) || [];
  const trendingSearches =
    searchPanelData?.trending_searches?.map((t) => t.term) || [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
        setShowSearchResults(false);
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (value: string) => {
    setLocalQuery(value);
    setShowSuggestions(false);
    setShowSearchResults(value.length >= 2);
    setIsSearchApplied(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && localQuery.trim()) {
      e.preventDefault();
      executeSearch(localQuery);
    }
  };

  const executeSearch = (term: string) => {
    setSearchQuery(term);
    setShowSuggestions(false);
    setShowSearchResults(false);
    setIsSearchApplied(true);
    addToRecentSearches(term);
    logSearch.mutate(term);
    inputRef.current?.blur();
  };

  const handleSelectSearchResult = (result: SearchProductResult) => {
    setShowSearchResults(false);
    setShowSuggestions(false);

    // Convert SearchResult to Phone
    const phone: Phone = {
      id: result._id,
      brand: result.brand || "",
      model: result.model || "",
      ram: null,
      storage_gb: result.storage || null,
      price_birr: result.price,
      old_price_birr: null,
      condition: result.condition || "used",
      main_image_url: result.mainImageUrl || "/placeholder.svg",
      description: null,
      color: null,
      in_stock: true,
      stock_count: null,
      is_new_arrival: false,
      is_popular: false,
      is_premium: false,
      is_accessory: false,
      exchange_available: result.exchange_available ?? false,
      negotiable: null,
      key_highlights: null,
      key_specs: null,
      created_at: null,
      updated_at: null,
    };

    onSelectPhone(phone);
  };

  const addToRecentSearches = (term: string) => {
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(
      0,
      5,
    );
    setRecentSearches(updated);
    localStorage.setItem("tedytech-recent-searches", JSON.stringify(updated));
  };

  const handleSearchTermClick = (term: string) => {
    setLocalQuery(term);
    executeSearch(term);
  };

  const handleClear = () => {
    setLocalQuery("");
    setSearchQuery("");
    setIsSearchApplied(false);
    setShowSuggestions(false);
    setShowSearchResults(false);
  };

  const showFocusScreen = isFocused && !localQuery.trim();

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-5 h-5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search phones..."
          value={localQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          className="w-full h-12 pl-12 pr-20 bg-card rounded-2xl border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {localQuery && (
            <button
              onClick={handleClear}
              aria-label="Clear search"
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={onOpenFilters}
            aria-label="Open filters"
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Search Results Dropdown - Live search while typing */}
      {showSearchResults && (
        <SearchResultsDropdown
          results={searchResults}
          isLoading={isSearching}
          query={localQuery}
          onSelectResult={handleSelectSearchResult}
        />
      )}

      {/* Focus screen - Recent/Hot/Top/Trending */}
      {showFocusScreen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl border border-border shadow-lg z-50 overflow-hidden animate-fade-in max-h-[70vh] overflow-y-auto">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold text-foreground">
                  Recent Searches
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearchTermClick(term)}
                    className="px-3 py-1.5 bg-muted rounded-full text-sm text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Hot Searches */}
          {hotSearches.length > 0 && (
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-destructive" />
                <h4 className="text-sm font-semibold text-foreground">
                  Hot Searches
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {hotSearches.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearchTermClick(term)}
                    className="px-3 py-1.5 bg-destructive/10 text-destructive rounded-full text-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Top Searches */}
          {topSearches.length > 0 && (
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-yellow-500" />
                <h4 className="text-sm font-semibold text-foreground">
                  Top Searches
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {topSearches.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearchTermClick(term)}
                    className="px-3 py-1.5 bg-yellow-500/10 text-yellow-600 rounded-full text-sm hover:bg-yellow-500 hover:text-white transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending */}
          {trendingSearches.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">
                  Trending
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearchTermClick(term)}
                    className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fallback if no data */}
          {hotSearches.length === 0 &&
            topSearches.length === 0 &&
            trendingSearches.length === 0 &&
            recentSearches.length === 0 && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Start typing to search for phones...
              </div>
            )}
        </div>
      )}
    </div>
  );
}

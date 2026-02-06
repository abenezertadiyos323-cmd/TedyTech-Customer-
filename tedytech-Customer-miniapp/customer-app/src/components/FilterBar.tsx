import { Tag, SlidersHorizontal, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  onOpenBrandFilter: () => void;
  onOpenBudgetFilter: () => void;
  onOpenAllFilters: () => void;
  isSticky?: boolean;
}

export function FilterBar({ onOpenBrandFilter, onOpenBudgetFilter, onOpenAllFilters }: FilterBarProps) {
  const { 
    selectedBrands, 
    selectedBudget, 
    selectedStorageFilters,
    selectedConditions,
    setSelectedBrands, 
    setSelectedBudget,
    setSelectedStorageFilters,
    setSelectedConditions,
    clearFilters,
    hasActiveFilters 
  } = useApp();

  const budgetLabel = selectedBudget 
    ? selectedBudget.max === Infinity 
      ? "150k+" 
      : selectedBudget.min === 0 
        ? `≤ ${selectedBudget.max / 1000}k`
        : `${selectedBudget.min / 1000}k – ${selectedBudget.max / 1000}k`
    : null;

  return (
    <div className="space-y-2 bg-surface-section rounded-2xl p-3 border border-border/50">
      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={onOpenBrandFilter}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap",
            selectedBrands.length > 0
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-foreground hover:bg-muted"
          )}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Brand</span>
          {selectedBrands.length > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 bg-primary-foreground/20 rounded-full text-xs">
              {selectedBrands.length}
            </span>
          )}
        </button>

        <button
          onClick={onOpenBudgetFilter}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap",
            selectedBudget
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-foreground hover:bg-muted"
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Budget</span>
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto text-sm text-primary font-medium hover:underline whitespace-nowrap"
          >
            Clear
          </button>
        )}
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {selectedBrands.map(brand => (
            <span
              key={brand}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-light text-primary rounded-full text-xs font-medium"
            >
              {brand}
              <button
                onClick={() => setSelectedBrands(selectedBrands.filter(b => b !== brand))}
                className="hover:bg-primary/10 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {budgetLabel && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-light text-primary rounded-full text-xs font-medium">
              {budgetLabel}
              <button
                onClick={() => setSelectedBudget(null)}
                className="hover:bg-primary/10 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedStorageFilters.map(storage => (
            <span
              key={storage}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-light text-primary rounded-full text-xs font-medium"
            >
              {storage}
              <button
                onClick={() => setSelectedStorageFilters(selectedStorageFilters.filter(s => s !== storage))}
                className="hover:bg-primary/10 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {selectedConditions.map(condition => (
            <span
              key={condition}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-light text-primary rounded-full text-xs font-medium"
            >
              {condition}
              <button
                onClick={() => setSelectedConditions(selectedConditions.filter(c => c !== condition))}
                className="hover:bg-primary/10 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

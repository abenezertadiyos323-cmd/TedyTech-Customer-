import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import type { SortOption } from '@/types/phone';

interface AllFiltersSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

// Locked UI brand options with mapping to DB values
const brandOptions = [
  { label: 'iPhones', dbBrands: ['Apple'], modelPatterns: ['iPhone'] },
  { label: 'Samsung', dbBrands: ['Samsung'], modelPatterns: [] },
  { label: 'Tecno', dbBrands: ['Tecno'], modelPatterns: [] },
  { label: 'Infinix', dbBrands: ['Infinix'], modelPatterns: [] },
  { label: 'Xiaomi', dbBrands: ['Xiaomi', 'Redmi', 'Poco'], modelPatterns: [] },
  { label: 'Other Android', dbBrands: ['__OTHER__'], modelPatterns: [] },
];

// Locked UI budget options
const budgetRanges = [
  { label: 'Up to 15k', key: 'under_15k', min: 0, max: 15000 },
  { label: '15k – 50k', key: '15k_50k', min: 15000, max: 50000 },
  { label: '50k – 100k', key: '50k_100k', min: 50000, max: 100000 },
  { label: '100k – 150k', key: '100k_150k', min: 100000, max: 150000 },
  { label: '150k+', key: '150k_plus', min: 150000, max: Infinity },
];

// Locked UI storage options (in GB)
const storageOptions = [64, 128, 256, 512];

const conditionOptions = [
  { label: 'New',       value: 'New',       description: 'Sealed box, never used' },
  { label: 'Like New',  value: 'Like New',  description: 'Opened but mint, no marks' },
  { label: 'Excellent', value: 'Excellent', description: 'Barely used, minimal wear' },
  { label: 'Good',      value: 'Good',      description: 'Light wear, fully functional' },
  { label: 'Fair',      value: 'Fair',      description: 'Visible wear, all features work' },
  { label: 'Poor',      value: 'Poor',      description: 'Heavy wear or minor issues' },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low → High' },
  { value: 'price-high', label: 'Price: High → Low' },
];

export function AllFiltersSheet({ isOpen, onClose }: AllFiltersSheetProps) {
  const { 
    selectedBrands, 
    setSelectedBrands, 
    selectedBudget, 
    setSelectedBudget,
    selectedStorageFilters,
    setSelectedStorageFilters,
    selectedConditions,
    setSelectedConditions,
    sortOption,
    setSortOption,
    clearFilters
  } = useApp();

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBrandToggle = (brandLabel: string) => {
    if (selectedBrands.includes(brandLabel)) {
      setSelectedBrands(selectedBrands.filter(b => b !== brandLabel));
    } else {
      setSelectedBrands([...selectedBrands, brandLabel]);
    }
  };

  const handleBudgetSelect = (budget: { min: number; max: number; key: string }) => {
    if (selectedBudget?.min === budget.min && selectedBudget?.max === budget.max) {
      setSelectedBudget(null);
    } else {
      setSelectedBudget({ min: budget.min, max: budget.max });
    }
  };

  const handleStorageToggle = (storage: number) => {
    if (selectedStorageFilters.includes(storage)) {
      setSelectedStorageFilters(selectedStorageFilters.filter(s => s !== storage));
    } else {
      setSelectedStorageFilters([...selectedStorageFilters, storage]);
    }
  };

  const handleConditionSelect = (conditionLabel: string) => {
    if (selectedConditions.includes(conditionLabel)) {
      setSelectedConditions([]);
    } else {
      setSelectedConditions([conditionLabel]);
    }
  };

  const handleReset = () => {
    clearFilters();
  };

  const handleApply = () => {
    onClose();
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-[100] animate-fade-in"
        onClick={onClose}
      />
      
      {/* Full-height Sheet */}
      <div className="fixed inset-0 bg-card z-[110] animate-slide-up flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">All Filters</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-all duration-200 press-effect"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
        
        {/* Content - scrollable with mobile-friendly behavior */}
        <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] p-4 pb-8 space-y-6">
          {/* Sort */}
          <div className="animate-fade-in" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-center gap-2 mb-3">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold text-foreground">Sort By</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortOption(option.value)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 press-effect",
                    sortOption === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Brands - locked UI list */}
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h4 className="text-sm font-semibold text-foreground mb-3">Brand</h4>
            <div className="flex flex-wrap gap-2">
              {brandOptions.map((brand) => (
                <button
                  key={brand.label}
                  onClick={() => handleBrandToggle(brand.label)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 press-effect",
                    selectedBrands.includes(brand.label)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  )}
                >
                  {brand.label}
                  {selectedBrands.includes(brand.label) && (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Budget - locked UI list */}
          <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <h4 className="text-sm font-semibold text-foreground mb-3">Budget</h4>
            <div className="flex flex-wrap gap-2">
              {budgetRanges.map((range) => (
                <button
                  key={range.key}
                  onClick={() => handleBudgetSelect(range)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 press-effect",
                    selectedBudget?.min === range.min && selectedBudget?.max === range.max
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Storage - locked UI list */}
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h4 className="text-sm font-semibold text-foreground mb-3">Storage</h4>
            <div className="flex flex-wrap gap-2">
              {storageOptions.map((storage) => (
                <button
                  key={storage}
                  onClick={() => handleStorageToggle(storage)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 press-effect",
                    selectedStorageFilters.includes(storage)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  )}
                >
                  {storage}GB
                  {selectedStorageFilters.includes(storage) && (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div className="animate-fade-in" style={{ animationDelay: '0.25s' }}>
            <h4 className="text-sm font-semibold text-foreground mb-3">Condition</h4>
            <div className="grid grid-cols-2 gap-2">
              {conditionOptions.map((opt) => {
                const isSelected = selectedConditions.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleConditionSelect(opt.value)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all duration-200 press-effect",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/40 hover:bg-muted/70"
                    )}
                  >
                    <p className={cn(
                      "text-xs font-semibold leading-tight",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {opt.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer - pinned at bottom */}
        <div
          className="flex-shrink-0 p-4 pt-3 border-t border-border flex gap-3 bg-card z-[120]"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <button
            onClick={handleReset}
            className="flex-1 py-3 bg-muted text-foreground font-medium rounded-2xl hover:bg-muted/80 transition-all duration-300 press-effect"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3 bg-primary text-primary-foreground font-semibold rounded-2xl hover:bg-primary/90 transition-all duration-300 press-effect shadow-button"
          >
            Apply
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

// Export brand/condition mappings for use in filtering hooks
export const BRAND_MAPPING = brandOptions;
export const CONDITION_MAPPING = conditionOptions;

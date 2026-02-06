import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { brands, budgetRanges } from '@/data/products';
import { useApp } from '@/contexts/AppContext';

interface FilterSheetProps {
  type: 'brand' | 'budget';
  isOpen: boolean;
  onClose: () => void;
}

export function FilterSheet({ type, isOpen, onClose }: FilterSheetProps) {
  const { 
    selectedBrands, 
    setSelectedBrands, 
    selectedBudget, 
    setSelectedBudget 
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

  const handleBrandToggle = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter(b => b !== brand));
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
  };

  const handleBudgetSelect = (budget: { min: number; max: number }) => {
    if (selectedBudget?.min === budget.min && selectedBudget?.max === budget.max) {
      setSelectedBudget(null);
    } else {
      setSelectedBudget(budget);
    }
    onClose();
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-[100] animate-fade-in-fast"
        onClick={onClose}
      />
      
      {/* Full-height Sheet */}
      <div className="fixed inset-0 bg-card z-[110] animate-slide-up flex flex-col">
        <div className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              {type === 'brand' ? 'Select Brand' : 'Select Budget'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-all duration-200 press-effect"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
          {type === 'brand' ? (
            <div className="grid grid-cols-2 gap-3">
              {brands.map((brand, index) => (
                <button
                  key={brand}
                  onClick={() => handleBrandToggle(brand)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 press-effect opacity-0 animate-fade-in",
                    selectedBrands.includes(brand)
                      ? "border-primary bg-blue-light scale-[1.02]"
                      : "border-border hover:border-muted-foreground hover:scale-[1.02]"
                  )}
                  style={{ animationDelay: `${index * 0.03}s`, animationFillMode: 'forwards' }}
                >
                  <span className="font-medium text-foreground">{brand}</span>
                  {selectedBrands.includes(brand) && (
                    <Check className="w-5 h-5 text-primary animate-scale-in" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {budgetRanges.map((range, index) => (
                <button
                  key={range.label}
                  onClick={() => handleBudgetSelect(range)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 press-effect opacity-0 animate-fade-in",
                    selectedBudget?.min === range.min && selectedBudget?.max === range.max
                      ? "border-primary bg-blue-light scale-[1.02]"
                      : "border-border hover:border-muted-foreground hover:scale-[1.02]"
                  )}
                  style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'forwards' }}
                >
                  <span className="font-medium text-foreground">{range.label}</span>
                  {selectedBudget?.min === range.min && selectedBudget?.max === range.max && (
                    <Check className="w-5 h-5 text-primary animate-scale-in" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {type === 'brand' && (
          <div 
            className="flex-shrink-0 p-4 border-t border-border animate-slide-up z-[120]" 
            style={{ animationDelay: '0.1s', paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <button
              onClick={onClose}
              className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-2xl hover:bg-primary/90 transition-all duration-300 press-effect shadow-button"
            >
              Apply Filters
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}

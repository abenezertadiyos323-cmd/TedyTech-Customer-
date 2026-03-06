import { Phone } from '@/types/phone';
import { ProductCard } from './ProductCard';
import { useApp } from '@/contexts/AppContext';
import { Package, Loader2 } from 'lucide-react';
import { mapToProductVM } from '@/lib/mapProduct';

interface ProductGridProps {
  newArrivals?: Phone[];
  premiumPicks?: Phone[];
  accessories?: Phone[];
  allPhones?: Phone[];
  isLoading?: boolean;
  onProductClick: (phone: Phone) => void;
}

export function ProductGrid({
  newArrivals = [],
  premiumPicks = [],
  accessories = [],
  allPhones = [],
  isLoading = false,
  onProductClick
}: ProductGridProps) {
  const { quickPickMode } = useApp();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in min-h-[600px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Loading phones...</p>
      </div>
    );
  }

  // Determine which phones to display based on mode
  let displayPhones: Phone[] = [];
  let sectionTitle = 'Phones';

  switch (quickPickMode) {
    case 'arrivals':
      displayPhones = newArrivals;
      sectionTitle = 'New Arrivals';
      break;
    case 'premium':
      displayPhones = premiumPicks;
      sectionTitle = 'Premium Picks';
      break;
    case 'accessories':
      displayPhones = accessories;
      sectionTitle = 'Accessories';
      break;
    case 'all':
    case 'home':
    default:
      displayPhones = allPhones;
      sectionTitle = 'All Phones';
      break;
  }

  if (displayPhones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 animate-float">
          <Package className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground mb-1">No phones found</h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or search query
        </p>
      </div>
    );
  }

  // Single section mode
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-foreground animate-slide-in-left">{sectionTitle}</h3>
      <div className="grid grid-cols-2 gap-3">
        {displayPhones.map((phone, index) => (
          <ProductCard 
            key={phone.id} 
            product={mapToProductVM(phone as unknown as Record<string, unknown>)}
            onClick={() => onProductClick(phone)}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

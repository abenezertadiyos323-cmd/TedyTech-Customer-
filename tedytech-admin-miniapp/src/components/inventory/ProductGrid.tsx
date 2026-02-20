import { ProductCard } from "@/components/inventory/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";
import { AlertCircle, Package } from "lucide-react";

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  error?: string | null;
  onProductClick?: (product: Product) => void;
  className?: string;
}

function ProductCardSkeleton() {
  return (
    <div className="admin-card overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function ProductGrid({
  products,
  isLoading = false,
  error = null,
  onProductClick,
  className,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-2 gap-3", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-destructive/10 p-4 mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <p className="font-semibold">Failed to load products</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="font-semibold">No products found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your filters or add new products
        </p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {products.map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          onClick={() => onProductClick?.(product)}
        />
      ))}
    </div>
  );
}

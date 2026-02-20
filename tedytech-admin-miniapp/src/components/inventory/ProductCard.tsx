import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { cn, formatPrice } from "@/lib/utils";
import type { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  className?: string;
}

export function ProductCard({ product, onClick, className }: ProductCardProps) {
  const imageSrc = product.images?.[0] || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400";

  return (
    <Card
      className={cn("admin-card-interactive overflow-hidden", className)}
      onClick={onClick}
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        <img
          src={imageSrc}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <StatusBadge status={product.status} variant="product" />
        </div>
        {/* Featured Badge */}
        {product.isFeatured && (
          <div className="absolute top-2 left-2">
            <div className="bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded">
              Featured
            </div>
          </div>
        )}
      </div>

      {/* Product Info */}
      <CardContent className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
        <p className="text-lg font-bold text-primary mt-1">{formatPrice(product.price)}</p>
        {product.category && (
          <p className="text-xs text-muted-foreground mt-1">{product.category}</p>
        )}
        {product.inStock === false && (
          <p className="text-xs text-destructive mt-1">Out of stock</p>
        )}
      </CardContent>
    </Card>
  );
}

import { Heart } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import type { ProductVM } from "@/lib/mapProduct";

interface ProductCardProps {
  product: ProductVM;
  onClick: () => void;
  index?: number;
}

export function ProductCard({ product, onClick, index = 0 }: ProductCardProps) {
  const { toggleSaved, isSaved } = useApp();
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  const saved = isSaved(product.id);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHeartAnimating(true);
    toggleSaved(product.id);
    setTimeout(() => setIsHeartAnimating(false), 400);
  };

  return (
    <div
      className={cn(
        "bg-card rounded-2xl overflow-hidden card-shadow hover-lift cursor-pointer group opacity-0 animate-fade-in",
        `stagger-${Math.min(index + 1, 6)}`,
      )}
      style={{ animationFillMode: "forwards" }}
      onClick={onClick}
    >
      <div className="relative aspect-square bg-muted overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover img-zoom"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg";
          }}
        />

        <button
          onClick={handleSave}
          aria-label={saved ? "Remove from saved items" : "Save item"}
          className={cn(
            "absolute top-2 right-2 p-2 rounded-full transition-all duration-300 press-effect",
            saved
              ? "bg-destructive text-destructive-foreground"
              : "bg-card/80 backdrop-blur-sm text-muted-foreground hover:bg-card hover:text-destructive",
            isHeartAnimating && "animate-heart-pop",
          )}
        >
          <Heart
            className="w-4 h-4 transition-transform"
            fill={saved ? "currentColor" : "none"}
          />
        </button>
      </div>

      <div className="p-3">
        <h3 className="font-medium text-foreground text-xs leading-tight mb-2 line-clamp-2">
          {product.title}
        </h3>
        <div className="space-y-1.5 mb-2">
          {product.storageGb && (
            <div className="inline-block">
              <span className="text-xs bg-muted/60 text-muted-foreground px-2 py-1 rounded-md font-medium">
                {product.storageGb}GB
              </span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {product.condition}
          </p>
        </div>
        <p className="text-foreground text-base font-bold">
          {product.priceBirr.toLocaleString()} Birr
        </p>
      </div>
    </div>
  );
}

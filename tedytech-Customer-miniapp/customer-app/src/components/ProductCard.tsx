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
        "bg-card rounded-2xl card-shadow hover-lift cursor-pointer group opacity-0 animate-fade-in flex flex-col",
        `stagger-${Math.min(index + 1, 6)}`,
      )}
      style={{ animationFillMode: "forwards" }}
      onClick={onClick}
    >
      {/* Image section — overflow-hidden scoped here only, for zoom effect + rounding */}
      <div className="relative aspect-square bg-muted overflow-hidden rounded-t-2xl shrink-0">
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

      {/* Content section — no overflow-hidden so price is never clipped */}
      <div className="p-3 flex flex-col gap-1 rounded-b-2xl">
        <h3 className="font-medium text-foreground text-xs leading-tight line-clamp-2">
          {product.title}
        </h3>
        {(product.storageLabel || product.storageGb) && (
          <span className="inline-block text-xs bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-md font-medium w-fit">
            {product.storageLabel || `${product.storageGb}GB`}
          </span>
        )}
        <p className="text-xs text-muted-foreground">{product.condition}</p>
        <p className="text-foreground text-sm font-bold pt-0.5">
          {product.priceBirr.toLocaleString()} Birr
        </p>
      </div>
    </div>
  );
}

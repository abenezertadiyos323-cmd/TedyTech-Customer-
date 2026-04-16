import { useMemo, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { ProductCard } from "../ProductCard";
import { ProductDetail } from "../ProductDetail";
import { useApp } from "@/contexts/AppContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useProductsByIds } from "@/hooks/usePhones";
import { mapToProductVM, type ProductVM } from "@/lib/mapProduct";

interface SavedTabProps {
  onNavigateToExchange: () => void;
}

export function SavedTab({ onNavigateToExchange }: SavedTabProps) {
  const { sessionId } = useApp();
  const { data: favorites = [], isLoading: favoritesLoading } = useFavorites(sessionId);
  const favoriteIds = useMemo(
    () => favorites.map((favorite) => favorite.phoneId),
    [favorites],
  );
  const { data: products = [], isLoading: productsLoading } = useProductsByIds(favoriteIds);

  const productsById = useMemo(
    () =>
      new Map(
        products.map((product) => [
          product.id,
          mapToProductVM(product as unknown as Record<string, unknown>),
        ]),
      ),
    [products],
  );

  const savedProducts = useMemo(
    () =>
      favoriteIds.map((id) => {
        const mapped = productsById.get(id);
        return (
          mapped ?? {
            id,
            title: "Saved Item",
            priceBirr: 0,
            imageUrl: "/placeholder.svg",
            inStock: true,
            condition: "Used",
            brand: "Phone",
            model: "Item",
          }
        );
      }),
    [favoriteIds, productsById],
  );

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductVM | null>(null);

  const handleProductClick = (product: ProductVM) => {
    setSelectedProduct(product);
    setSelectedProductId(product.id);
  };

  if (selectedProductId) {
    return (
      <ProductDetail
        phoneId={selectedProductId}
        product={selectedProduct || undefined}
        onBack={() => {
          setSelectedProductId(null);
          setSelectedProduct(null);
        }}
        onExchange={onNavigateToExchange}
        sourceTab="saved"
      />
    );
  }

  const isLoading = favoritesLoading || productsLoading;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="p-4 pb-6">
          <h1 className="text-xl font-bold text-foreground">Saved Phones</h1>
          <p className="text-sm text-muted-foreground">
            {savedProducts.length} {savedProducts.length === 1 ? "item" : "items"} saved
          </p>
        </div>
      </header>

      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : savedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground text-lg mb-2">No saved phones yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Tap the heart icon on any phone to save it here for later
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {savedProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => handleProductClick(product)}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

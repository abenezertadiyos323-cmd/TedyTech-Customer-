import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { Heart } from "lucide-react";
import { SearchBar } from "../SearchBar";
import { FilterBar } from "../FilterBar";
import { QuickPicks } from "../QuickPicks";
import { HeroBanner } from "../HeroBanner";
import { ProductGrid } from "../ProductGrid";
import { useApp } from "@/contexts/AppContext";
import {
  useNewArrivals,
  usePopularPhones,
  usePremiumPicks,
  useAccessories,
  useBrowsePhones,
} from "@/hooks/usePhones";
import { useFavorites } from "@/hooks/useFavorites";
import { useSession } from "@/hooks/useSession";
import type { Phone } from "@/types/phone";
import tedMobileLogo from "@/assets/ted-mobile-logo-88.webp";

const ProductDetail = lazy(() =>
  import("../ProductDetail").then((m) => ({ default: m.ProductDetail })),
);
const FilterSheet = lazy(() =>
  import("../FilterSheet").then((m) => ({ default: m.FilterSheet })),
);
const AllFiltersSheet = lazy(() =>
  import("../AllFiltersSheet").then((m) => ({ default: m.AllFiltersSheet })),
);

interface HomeTabProps {
  onNavigateToExchange: () => void;
  onNavigateToAbout: () => void;
  onNavigateToSaved: () => void;
}

export function HomeTab({
  onNavigateToExchange,
  onNavigateToAbout,
  onNavigateToSaved,
}: HomeTabProps) {
  const {
    quickPickMode,
    searchQuery,
    selectedBrands,
    selectedBudget,
    selectedStorageFilters,
    selectedConditions,
    sortOption,
  } = useApp();
  const { sessionId } = useSession();
  const { data: favorites = [] } = useFavorites(sessionId);
  const { data: newArrivals = [], isLoading: loadingNew } = useNewArrivals(10);
  const { data: popularPhones = [], isLoading: loadingPopular } =
    usePopularPhones(10);
  const { data: premiumPicks = [], isLoading: loadingPremium } =
    usePremiumPicks(10);
  const { data: accessories = [], isLoading: loadingAccessories } =
    useAccessories(20);

  // Pass all filters from AppContext to useBrowsePhones
  const { data: allPhones = [], isLoading: loadingAll } = useBrowsePhones({
    search: searchQuery,
    brands: selectedBrands,
    storage: selectedStorageFilters,
    conditions: selectedConditions,
    budget: selectedBudget,
    sort: sortOption,
  });

  const [selectedPhoneId, setSelectedPhoneId] = useState<string | null>(null);
  const [selectedPhone, setSelectedPhone] = useState<Phone | null>(null);
  const [filterSheet, setFilterSheet] = useState<"brand" | "budget" | null>(
    null,
  );
  const [allFiltersOpen, setAllFiltersOpen] = useState(false);
  const [isFilterBarSticky, setIsFilterBarSticky] = useState(false);
  const productGridRef = useRef<HTMLDivElement>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (filterBarRef.current) {
        const rect = filterBarRef.current.getBoundingClientRect();
        setIsFilterBarSticky(rect.top <= 73);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleShopNow = () => {
    productGridRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePhoneClick = (phone: Phone) => {
    setSelectedPhone(phone);
    setSelectedPhoneId(phone.id);
  };

  if (selectedPhoneId) {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        }
      >
        <ProductDetail
          phoneId={selectedPhoneId}
          phone={selectedPhone || undefined}
          onBack={() => {
            setSelectedPhoneId(null);
            setSelectedPhone(null);
          }}
          onExchange={onNavigateToExchange}
        />
      </Suspense>
    );
  }

  return (
    <div>
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">TEDYTECH™</h1>
            <p className="text-xs text-muted-foreground">
              We sell, buy and exchange.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Saved/Wishlist Button */}
            <button
              onClick={onNavigateToSaved}
              aria-label="View saved items"
              className="w-10 h-10 rounded-full flex items-center justify-center bg-muted/50 transition-all duration-200 hover:bg-muted hover:scale-110 active:scale-95 relative"
            >
              <Heart className="w-5 h-5 text-foreground" />
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {favorites.length > 9 ? "9+" : favorites.length}
                </span>
              )}
            </button>
            {/* Logo Button */}
            <button
              onClick={onNavigateToAbout}
              className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center bg-transparent transition-transform duration-200 hover:scale-110 active:scale-95"
            >
              <img
                src={tedMobileLogo}
                alt="TED MOBILE"
                width={44}
                height={44}
                className="w-full h-full object-contain bg-transparent"
              />
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-5 pt-20">
        <SearchBar
          onOpenFilters={() => setAllFiltersOpen(true)}
          onSelectPhone={(phone: Phone) => handlePhoneClick(phone)}
        />
        <HeroBanner onShopNow={handleShopNow} />
        <div ref={filterBarRef}>
          <FilterBar
            onOpenBrandFilter={() => setFilterSheet("brand")}
            onOpenBudgetFilter={() => setFilterSheet("budget")}
            onOpenAllFilters={() => setAllFiltersOpen(true)}
            isSticky={isFilterBarSticky}
          />
        </div>
        <QuickPicks />
        <div ref={productGridRef}>
          <ProductGrid
            newArrivals={newArrivals}
            popularPhones={popularPhones}
            premiumPicks={premiumPicks}
            accessories={accessories}
            allPhones={allPhones}
            isLoading={loadingAll}
            onProductClick={handlePhoneClick}
          />
        </div>
      </main>

      <Suspense fallback={null}>
        <FilterSheet
          type="brand"
          isOpen={filterSheet === "brand"}
          onClose={() => setFilterSheet(null)}
        />
        <FilterSheet
          type="budget"
          isOpen={filterSheet === "budget"}
          onClose={() => setFilterSheet(null)}
        />
        <AllFiltersSheet
          isOpen={allFiltersOpen}
          onClose={() => setAllFiltersOpen(false)}
        />
      </Suspense>
    </div>
  );
}

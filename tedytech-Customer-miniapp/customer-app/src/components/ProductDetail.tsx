import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Heart, ShoppingBag, RefreshCw, Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { usePhoneDetail } from '@/hooks/usePhones';
import { useCreatePhoneAction, type LeadSourceTab } from '@/hooks/usePhoneActions';
import { cn } from '@/lib/utils';
import type { Phone } from '@/types/phone';
import { formatPrice, getConditionLabel } from '@/types/phone';
import { storeConfig } from '@/config/storeConfig';
import { mapToProductVM, productVMToPhone, type ProductVM } from '@/lib/mapProduct';

interface ProductDetailProps {
  phoneId: string;
  product?: ProductVM; // Optional initial data for faster display
  onBack: () => void;
  onExchange: () => void;
  sourceTab?: LeadSourceTab; // Which tab opened this detail view
}

export function ProductDetail({ phoneId, product: initialProduct, onBack, onExchange, sourceTab = 'product_detail' }: ProductDetailProps) {
  const { toggleSaved, isSaved, setTargetExchangePhone, sessionId } = useApp();
  const { data: phoneDetail, isLoading } = usePhoneDetail(phoneId);
  const createPhoneAction = useCreatePhoneAction(sessionId);

  const rawPhone: Phone | null =
    phoneDetail?.phone ??
    (initialProduct ? productVMToPhone(initialProduct) : null);
  const product: ProductVM | null = rawPhone
    ? mapToProductVM(rawPhone as unknown as Record<string, unknown>)
    : initialProduct ?? null;
  const images = phoneDetail?.images || [];
  const variants = phoneDetail?.variants || [];

  // Get unique colors and storage options from variants
  const uniqueColors = useMemo(() => {
    const colors = [...new Set(variants.map(v => v.color))];
    return colors.length > 0 ? colors : (rawPhone?.color ? [rawPhone.color] : ['Default']);
  }, [variants, rawPhone?.color]);

  const uniqueStorages = useMemo(() => {
    const storages = [...new Set(variants.map(v => v.storage_gb))].sort((a, b) => a - b);
    return storages.length > 0 ? storages : (rawPhone?.storage_gb ? [rawPhone.storage_gb] : []);
  }, [variants, rawPhone?.storage_gb]);

  const [selectedColor, setSelectedColor] = useState(uniqueColors[0] || 'Default');
  const [selectedStorage, setSelectedStorage] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  const [imageDirection, setImageDirection] = useState<'left' | 'right'>('right');

  // Set default storage when variants load
  useEffect(() => {
    if (uniqueStorages.length > 0 && selectedStorage === null) {
      const defaultVariant = variants.find(v => v.is_default);
      setSelectedStorage(defaultVariant?.storage_gb || uniqueStorages[0]);
    }
  }, [uniqueStorages, variants, selectedStorage]);

  const saved = product ? isSaved(product.id) : false;

  // Find current variant based on selection
  const currentVariant = useMemo(() => {
    return variants.find(v =>
      v.color === selectedColor && v.storage_gb === selectedStorage
    ) || variants.find(v => v.storage_gb === selectedStorage) || variants[0];
  }, [variants, selectedColor, selectedStorage]);

  // Calculate current price
  const currentPrice = useMemo(() => {
    if (currentVariant?.price_birr) return currentVariant.price_birr;
    return product?.priceBirr || 0;
  }, [currentVariant, product?.priceBirr]);

  // Image gallery - use detail images or fallback to main image
  const imageUrls = useMemo(() => {
    if (images.length > 0) {
      return images.map(img => img.image_url);
    }
    return product?.imageUrl ? [product.imageUrl] : [];
  }, [images, product?.imageUrl]);

  const nextImage = () => {
    if (imageUrls.length <= 1) return;
    setImageDirection('right');
    setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
  };

  const prevImage = () => {
    if (imageUrls.length <= 1) return;
    setImageDirection('left');
    setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
  };

  const handleSave = () => {
    if (!product) return;
    setIsHeartAnimating(true);
    toggleSaved(product.id);
    setTimeout(() => setIsHeartAnimating(false), 400);
  };

  const handleExchange = () => {
    if (!product) return;
    setTargetExchangePhone(rawPhone ?? productVMToPhone(product));
    onExchange();
  };

  // Generate dynamic item ID for Telegram deep link
  const generateItemId = (item: ProductVM, storage: number | null): string => {
    const brand = item.brand.toLowerCase().replace(/\s+/g, '_');
    const model = item.model.toLowerCase().replace(/\s+/g, '_');
    const storageStr = storage ? `_${storage}gb` : '';
    return `${brand}_${model}${storageStr}`;
  };

  /**
   * P0: Log the lead action FIRST, then redirect to Telegram.
   * The Convex document ID is used as the start param so the bot
   * can look up the lead immediately on message receipt.
   */
  const handleStartInquiry = async () => {
    if (!product) return;

    try {
      const leadId = await createPhoneAction.mutate({
        actionType: 'inquiry',
        sourceTab,
        sourceProductId: product.id,
        timestamp: Date.now(),
      });

      const deepLink = `https://t.me/${storeConfig.botUsername}?start=${storeConfig.telegramStartPrefix}${leadId}`;
      window.open(deepLink, '_blank');
    } catch {
      // Error already toasted inside useCreatePhoneAction — nothing to do here.
      // Fallback: open bot without a start param so the user isn't blocked.
      const itemId = generateItemId(product, selectedStorage);
      window.open(`https://t.me/${storeConfig.botUsername}?start=item_${itemId}`, '_blank');
    }
  };

  if (!product && isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Phone not found</p>
        <button onClick={onBack} className="text-primary">Go back</button>
      </div>
    );
  }

  const displayName = product.title;
  const highlights = rawPhone?.key_highlights || [];
  const specs = rawPhone?.key_specs as Record<string, string> | null;

  return (
    <div className="min-h-screen bg-background pb-64 animate-slide-in-right">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-muted rounded-full transition-all duration-200 press-effect"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-semibold text-foreground animate-fade-in">Details</h1>
          <button
            onClick={handleSave}
            className={cn(
              "p-2 -mr-2 rounded-full transition-all duration-200 press-effect",
              saved ? "text-destructive" : "text-muted-foreground hover:text-destructive",
              isHeartAnimating && "animate-heart-pop"
            )}
          >
            <Heart className="w-5 h-5" fill={saved ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {imageUrls.length > 0 && (
          <img
            key={currentImageIndex}
            src={imageUrls[currentImageIndex]}
            alt={displayName}
            className={cn(
              "w-full h-full object-cover",
              imageDirection === 'right' ? "animate-slide-in-left" : "animate-slide-in-right"
            )}
          />
        )}

        {/* Navigation Arrows */}
        {imageUrls.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-card/80 backdrop-blur-sm rounded-full shadow-md press-effect hover:bg-card transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-card/80 backdrop-blur-sm rounded-full shadow-md press-effect hover:bg-card transition-all"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </>
        )}

        {/* Image Indicators */}
        {imageUrls.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {imageUrls.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setImageDirection(index > currentImageIndex ? 'right' : 'left');
                  setCurrentImageIndex(index);
                }}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === currentImageIndex
                    ? "bg-primary w-6"
                    : "bg-card/60 w-2 hover:bg-card/80"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Title & Price */}
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-foreground">{displayName}</h2>
            <span className={cn(
              "text-xs px-2 py-1 rounded-lg",
              product.condition.toLowerCase() === 'new' ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
            )}>
              {getConditionLabel(product.condition)}
            </span>
          </div>
          <p className="text-2xl font-bold text-primary mb-2">{formatPrice(currentPrice)}</p>
          {rawPhone?.old_price_birr && rawPhone.old_price_birr > currentPrice && (
            <p className="text-sm text-muted-foreground line-through">
              {formatPrice(rawPhone.old_price_birr)}
            </p>
          )}
        </div>

        {/* Color Selector */}
        {uniqueColors.length > 1 && (
          <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <h3 className="text-sm font-semibold text-foreground mb-3">Color</h3>
            <div className="flex flex-wrap gap-2">
              {uniqueColors.map(color => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 press-effect",
                    selectedColor === color
                      ? "bg-primary text-primary-foreground shadow-button scale-105"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  )}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Storage Selector */}
        {uniqueStorages.length > 0 && (
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-sm font-semibold text-foreground mb-3">Storage</h3>
            <div className="flex flex-wrap gap-2">
              {uniqueStorages.map(storage => {
                const variant = variants.find(v => v.storage_gb === storage);
                const inStock = variant?.in_stock !== false;
                return (
                  <button
                    key={storage}
                    onClick={() => setSelectedStorage(storage)}
                    disabled={!inStock}
                    className={cn(
                      "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 press-effect",
                      selectedStorage === storage
                        ? "bg-primary text-primary-foreground shadow-button scale-105"
                        : inStock
                          ? "bg-muted text-foreground hover:bg-muted/80"
                          : "bg-muted/50 text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    {storage}GB
                    {!inStock && " (Out)"}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* RAM */}
        {rawPhone?.ram && (
          <div className="animate-fade-in" style={{ animationDelay: '0.25s' }}>
            <h3 className="text-sm font-semibold text-foreground mb-3">RAM</h3>
            <div className="flex flex-wrap gap-2">
              <button
                disabled
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                  "bg-muted text-foreground cursor-default"
                )}
              >
                {rawPhone.ram}
              </button>
            </div>
          </div>
        )}

        {/* Storage Specs */}
        {rawPhone?.storage_gb && !uniqueStorages.length && (
          <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-sm font-semibold text-foreground mb-3">Storage</h3>
            <div className="flex flex-wrap gap-2">
              <button
                disabled
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                  "bg-muted text-foreground cursor-default"
                )}
              >
                {rawPhone.storage_gb}GB
              </button>
            </div>
          </div>
        )}

        {/* Specifications */}
        {rawPhone && (
          (() => {
            const specs = [
              { label: 'Screen Size', value: (rawPhone as any)?.screenSize },
              { label: 'Battery', value: (rawPhone as any)?.battery },
              { label: 'Main Camera', value: (rawPhone as any)?.mainCamera },
              { label: 'Selfie Camera', value: (rawPhone as any)?.selfieCamera },
              { label: 'SIM Type', value: (rawPhone as any)?.simType },
              { label: 'Color', value: (rawPhone as any)?.color },
              { label: 'Operating System', value: (rawPhone as any)?.operatingSystem },
            ];
            const hasSpecs = specs.some(spec => spec.value);

            return hasSpecs && (
              <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <h3 className="text-sm font-semibold text-foreground mb-3">Specifications</h3>
                <div className="grid grid-cols-2 gap-4">
                  {specs.map(spec => spec.value && (
                    <div key={spec.label}>
                      <p className="text-xs text-muted-foreground font-medium">{spec.label}</p>
                      <p className="text-sm text-foreground mt-1">{spec.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()
        )}

        {/* Condition */}
        {product.condition && (
          <div className="animate-fade-in" style={{ animationDelay: '0.35s' }}>
            <h3 className="text-sm font-semibold text-foreground mb-3">Condition</h3>
            <div className="flex flex-wrap gap-2">
              <button
                disabled
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                  "bg-muted text-foreground cursor-default"
                )}
              >
                {getConditionLabel(product.condition)}
              </button>
            </div>
          </div>
        )}

        {/* Exchange Available */}
        {rawPhone?.exchange_available !== undefined && rawPhone?.exchange_available !== null && (
          <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <h3 className="text-sm font-semibold text-foreground mb-3">Exchange Available</h3>
            <div className="flex flex-wrap gap-2">
              <button
                disabled
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                  "bg-muted text-foreground cursor-default"
                )}
              >
                {rawPhone.exchange_available ? 'Yes' : 'No'}
              </button>
            </div>
          </div>
        )}

        {/* Key Highlights */}
        {highlights.length > 0 && (
          <div className="bg-surface-section rounded-2xl p-4 border border-border animate-fade-in hover-lift" style={{ animationDelay: '0.25s' }}>
            <h3 className="font-semibold text-foreground mb-1">Key Highlights</h3>
            <p className="text-xs text-muted-foreground mb-3">Updated by our team for this phone</p>
            <ul className="space-y-2">
              {highlights.map((highlight, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 opacity-0 animate-fade-in"
                  style={{ animationDelay: `${0.3 + index * 0.05}s`, animationFillMode: 'forwards' }}
                >
                  <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Specs */}
        {specs && Object.keys(specs).length > 0 && (
          <div className="animate-fade-in" style={{ animationDelay: '0.35s' }}>
            <h3 className="font-semibold text-foreground mb-3">Key Specs</h3>
            <ul className="space-y-2">
              {Object.entries(specs).map(([key, value], index) => (
                <li
                  key={key}
                  className="flex items-start gap-2 opacity-0 animate-fade-in"
                  style={{ animationDelay: `${0.4 + index * 0.05}s`, animationFillMode: 'forwards' }}
                >
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{key}:</span> {value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Features */}
        {(rawPhone as any)?.features && (
          <div className="animate-fade-in" style={{ animationDelay: '0.45s' }}>
            <h3 className="font-semibold text-foreground mb-2">Features</h3>
            <p className="text-sm text-muted-foreground">{(rawPhone as any).features}</p>
          </div>
        )}

        {/* Description */}
        {rawPhone?.description && (
          <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <h3 className="font-semibold text-foreground mb-2">Description</h3>
            <p className="text-sm text-muted-foreground">{rawPhone.description}</p>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="fixed left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border p-4 pb-5 space-y-2 animate-slide-up z-40" style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' }}>
        <button
          onClick={handleStartInquiry}
          disabled={createPhoneAction.isPending}
          className="w-full py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all duration-300 shadow-button press-effect hover-glow disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {createPhoneAction.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ShoppingBag className="w-4 h-4" />
          )}
          <span>ጠይቀው ይዘዙ</span>
        </button>

        {rawPhone?.exchange_available && (
          <button
            onClick={handleExchange}
            className="w-full py-2 bg-muted text-foreground font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-muted/80 transition-all duration-300 press-effect"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Exchange</span>
          </button>
        )}

        {rawPhone?.exchange_available && (
          <p className="text-center text-[10px] text-muted-foreground">
            Exchange available. Final offer confirmed after inspection.
          </p>
        )}
      </div>
    </div>
  );
}

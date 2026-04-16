import { useState, useMemo, useEffect, useRef } from 'react';
import { ArrowLeft, Heart, ShoppingBag, RefreshCw, Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { usePhoneDetail } from '@/hooks/usePhones';
import {
  useCreatePhoneAction,
  useTelegramStartLinkBuilder,
  type LeadSourceTab,
} from '@/hooks/usePhoneActions';
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
  const { openStartLink } = useTelegramStartLinkBuilder();

  // Extend Phone to accept any new dynamic properties
  const rawPhone = (
    phoneDetail?.phone ??
    (initialProduct ? productVMToPhone(initialProduct) : null)
  ) as Phone & Record<string, any> | null;
  
  const product: ProductVM | null = rawPhone
    ? mapToProductVM(rawPhone as unknown as Record<string, unknown>)
    : initialProduct ?? null;
    
  const images = phoneDetail?.images || [];
  const variants = phoneDetail?.variants || [];

  const uniqueStorages = useMemo(() => {
    const storages = [...new Set(variants.map((v: any) => v.storage))].filter(Boolean) as string[];
    return storages.length > 0 ? storages : (rawPhone?.storage_gb ? [`${rawPhone.storage_gb}GB`] : []);
  }, [variants, rawPhone?.storage_gb]);

  const [selectedStorage, setSelectedStorage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  const [isOpeningTelegram, setIsOpeningTelegram] = useState(false);
  const [imageDirection, setImageDirection] = useState<'left' | 'right'>('right');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (uniqueStorages.length > 0 && selectedStorage === null) {
      setSelectedStorage(uniqueStorages[0]);
    }
  }, [uniqueStorages, selectedStorage]);

  const saved = product ? isSaved(product.id) : false;

  const currentVariant = useMemo(() => {
    return variants.find((v: any) => v.storage === selectedStorage) || variants[0];
  }, [variants, selectedStorage]);

  const currentPrice = useMemo(() => {
    if (currentVariant?.price) return currentVariant.price;
    return product?.priceBirr || 0;
  }, [currentVariant, product?.priceBirr]);

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

  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return; 
    if (delta > 0) prevImage();
    else nextImage();
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

  const generateItemId = (item: ProductVM, storage: string | null): string => {
    const brand = item.brand.toLowerCase().replace(/\s+/g, '_');
    const model = item.model.toLowerCase().replace(/\s+/g, '_');
    const storageStr = storage ? `_${storage.toLowerCase()}` : '';
    return `${brand}_${model}${storageStr}`;
  };

  const handleContextualStartInquiry = async () => {
    if (!product || isOpeningTelegram) return;

    const productLabel = [
      product.brand,
      product.model,
      selectedStorage,
    ]
      .filter(Boolean)
      .join(' ');

    setIsOpeningTelegram(true);

    try {
      await createPhoneAction.mutate({
        actionType: 'inquiry',
        sourceTab,
        sourceProductId: product.id,
        timestamp: Date.now(),
        showErrorToast: false,
      });
    } catch {
      // Analytics offline
    }

    await openStartLink({
      actionType: 'ask',
      productId: product.id,
      productLabel,
    });

    setTimeout(() => setIsOpeningTelegram(false), 500);
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

  return (
    <div className="min-h-screen bg-background pb-48 animate-slide-in-right">
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
      <div
        className="relative aspect-square bg-muted overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          key={currentImageIndex}
          src={imageUrls.length > 0 ? imageUrls[currentImageIndex] : "/placeholder.svg"}
          alt={displayName}
          className={cn(
            "w-full h-full object-cover",
            imageUrls.length > 0 && (imageDirection === 'right' ? "animate-slide-in-left" : "animate-slide-in-right")
          )}
          onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
        />

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
      <div className="p-4 space-y-5">
        
        {/* 1. Phone Name + Price (Auto-Updates with Variant!) */}
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl font-bold text-foreground mb-1">{displayName}</h2>
          <p className="text-2xl font-bold text-primary">{formatPrice(currentPrice)}</p>
          {rawPhone?.old_price_birr && rawPhone.old_price_birr > currentPrice && (
            <p className="text-sm text-muted-foreground line-through mt-0.5">
              {formatPrice(rawPhone.old_price_birr)}
            </p>
          )}
        </div>
        
        {/* 2. Dynamic Storage Variant Picker */}
        {uniqueStorages.length > 1 && (
          <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
             <h3 className="text-sm font-semibold mb-2">Select Storage Capacity</h3>
             <div className="flex flex-wrap gap-2">
               {uniqueStorages.map(storage => (
                 <button
                   key={storage}
                   onClick={() => setSelectedStorage(storage)}
                   className={cn(
                     "px-4 py-2 rounded-xl text-sm font-semibold transition-all border",
                     selectedStorage === storage 
                       ? "bg-primary text-primary-foreground border-primary" 
                       : "bg-surface-2 border-border text-foreground hover:bg-surface-3"
                   )}
                 >
                   {storage}
                 </button>
               ))}
             </div>
          </div>
        )}

        {/* 4. Exchange Availability */}
        {rawPhone?.exchange_available === true && (
          <p className="text-sm text-success font-medium animate-fade-in" style={{ animationDelay: '0.25s' }}>
            Exchange available
          </p>
        )}

        {/* 5. Specifications */}
        {rawPhone && (
          (() => {
            const isIphone = rawPhone.brand?.toLowerCase() === 'apple' || rawPhone.brand?.toLowerCase() === 'iphone';
            const isSamsung = rawPhone.brand?.toLowerCase() === 'samsung';
            const currentRam = currentVariant?.ram || rawPhone.ram;
            
            const specsRows = [
              { label: 'Condition', value: product.condition ? getConditionLabel(product.condition) : undefined },
              { label: 'Storage', value: selectedStorage || (rawPhone.storage_gb ? `${rawPhone.storage_gb}GB` : undefined) },
              isSamsung ? { label: 'RAM', value: currentRam } : null,
              isIphone ? { label: 'Battery Health', value: rawPhone.batteryHealth } : null,
              isIphone ? { label: 'Model Origin', value: rawPhone.modelOrigin } : null,
              isSamsung ? { label: 'Network', value: rawPhone.network } : null,
              { label: 'SIM Type', value: rawPhone.simType },
            ].filter((s): s is {label: string, value: string} => Boolean(s && s.value));

            return specsRows.length > 0 && (
              <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <h3 className="text-sm font-semibold text-foreground mb-2">Specifications</h3>
                <div className="divide-y divide-border/50">
                  {specsRows.map(spec => (
                    <div key={spec.label} className="flex items-center justify-between py-2.5">
                      <span className="text-sm text-muted-foreground">{spec.label}</span>
                      <span className="text-sm font-medium text-foreground text-right max-w-[55%]">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()
        )}

        {/* Key Highlights */}
        {highlights.length > 0 && (
          <div className="bg-surface-section rounded-2xl p-4 border border-border animate-fade-in hover-lift" style={{ animationDelay: '0.5s' }}>
            <h3 className="font-semibold text-foreground mb-1">Key Highlights</h3>
            <p className="text-xs text-muted-foreground mb-3">Updated by our team for this phone</p>
            <ul className="space-y-2">
              {highlights.map((highlight, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 opacity-0 animate-fade-in"
                  style={{ animationDelay: `${0.55 + index * 0.05}s`, animationFillMode: 'forwards' }}
                >
                  <span className="w-4 h-4 text-success mt-0.5 flex-shrink-0">
                    <Check className="w-full h-full" />
                  </span>
                  <span className="text-sm text-foreground">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Description */}
        {rawPhone?.description && (() => {
          const lines = rawPhone.description
            .split('\n')
            .map(l => l.trim())
            .filter(Boolean);
          const isList = lines.length > 1 && lines.every(l => /^[-•*]/.test(l));
          const cleanLines = isList
            ? lines.map(l => l.replace(/^[-•*]\s*/, ''))
            : lines;
          return (
            <div className="animate-fade-in" style={{ animationDelay: '0.65s' }}>
              <h3 className="font-semibold text-foreground mb-2">Notes</h3>
              {isList ? (
                <ul className="space-y-1.5 list-none">
                  {cleanLines.map((line, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full mt-2 flex-shrink-0" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {cleanLines.join(' ')}
                </p>
              )}
            </div>
          );
        })()}
      </div>

      {/* Bottom Actions */}
      <div className="fixed left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border p-4 pb-5 space-y-2 animate-slide-up z-40" style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' }}>
        <button
          onClick={handleContextualStartInquiry}
          disabled={createPhoneAction.isPending || isOpeningTelegram}
          className="w-full py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all duration-300 shadow-button press-effect hover-glow disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {createPhoneAction.isPending || isOpeningTelegram ? (
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
      </div>
    </div>
  );
}

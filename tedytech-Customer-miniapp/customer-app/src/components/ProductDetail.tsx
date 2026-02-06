import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Heart, ShoppingBag, RefreshCw, Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { usePhoneDetail } from '@/hooks/usePhones';
import { cn } from '@/lib/utils';
import type { Phone, PhoneVariant } from '@/types/phone';
import { formatPrice, getPhoneDisplayName, getConditionLabel } from '@/types/phone';

interface ProductDetailProps {
  phoneId: string;
  phone?: Phone; // Optional initial data for faster display
  onBack: () => void;
  onExchange: () => void;
}

export function ProductDetail({ phoneId, phone: initialPhone, onBack, onExchange }: ProductDetailProps) {
  const { toggleSaved, isSaved, setTargetExchangePhone } = useApp();
  const { data: phoneDetail, isLoading } = usePhoneDetail(phoneId);

  const phone = phoneDetail?.phone || initialPhone;
  const images = phoneDetail?.images || [];
  const variants = phoneDetail?.variants || [];

  // Get unique colors and storage options from variants
  const uniqueColors = useMemo(() => {
    const colors = [...new Set(variants.map(v => v.color))];
    return colors.length > 0 ? colors : (phone?.color ? [phone.color] : ['Default']);
  }, [variants, phone?.color]);

  const uniqueStorages = useMemo(() => {
    const storages = [...new Set(variants.map(v => v.storage_gb))].sort((a, b) => a - b);
    return storages.length > 0 ? storages : (phone?.storage_gb ? [phone.storage_gb] : []);
  }, [variants, phone?.storage_gb]);

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

  const saved = phone ? isSaved(phone.id) : false;

  // Find current variant based on selection
  const currentVariant = useMemo(() => {
    return variants.find(v => 
      v.color === selectedColor && v.storage_gb === selectedStorage
    ) || variants.find(v => v.storage_gb === selectedStorage) || variants[0];
  }, [variants, selectedColor, selectedStorage]);

  // Calculate current price
  const currentPrice = useMemo(() => {
    if (currentVariant?.price_birr) return currentVariant.price_birr;
    return phone?.price_birr || 0;
  }, [currentVariant, phone?.price_birr]);

  // Image gallery - use detail images or fallback to main image
  const imageUrls = useMemo(() => {
    if (images.length > 0) {
      return images.map(img => img.image_url);
    }
    return phone?.main_image_url ? [phone.main_image_url] : [];
  }, [images, phone?.main_image_url]);

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
    if (!phone) return;
    setIsHeartAnimating(true);
    toggleSaved(phone.id);
    setTimeout(() => setIsHeartAnimating(false), 400);
  };

  const handleExchange = () => {
    if (!phone) return;
    setTargetExchangePhone(phone);
    onExchange();
  };

  // Generate dynamic item ID for Telegram deep link
  const generateItemId = (phone: Phone, storage: number | null): string => {
    const brand = phone.brand.toLowerCase().replace(/\s+/g, '_');
    const model = phone.model.toLowerCase().replace(/\s+/g, '_');
    const storageStr = storage ? `_${storage}gb` : '';
    return `${brand}_${model}${storageStr}`;
  };

  const handleStartInquiry = () => {
    if (!phone) return;
    const itemId = generateItemId(phone, selectedStorage);
    const botUsername = 'YOUR_BOT_USERNAME'; // Placeholder - replace with actual bot username
    const deepLink = `https://t.me/${botUsername}?start=item_${itemId}`;
    window.open(deepLink, '_blank');
  };

  if (!phone && isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!phone) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">Phone not found</p>
        <button onClick={onBack} className="text-primary">Go back</button>
      </div>
    );
  }

  const displayName = getPhoneDisplayName(phone);
  const highlights = phone.key_highlights || [];
  const specs = phone.key_specs as Record<string, string> | null;

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
              phone.condition === 'new' ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
            )}>
              {getConditionLabel(phone.condition)}
            </span>
          </div>
          <p className="text-2xl font-bold text-primary mb-2">{formatPrice(currentPrice)}</p>
          {phone.old_price_birr && phone.old_price_birr > currentPrice && (
            <p className="text-sm text-muted-foreground line-through">
              {formatPrice(phone.old_price_birr)}
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

        {/* Description */}
        {phone.description && (
          <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <h3 className="font-semibold text-foreground mb-2">Description</h3>
            <p className="text-sm text-muted-foreground">{phone.description}</p>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="fixed left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border p-4 pb-5 space-y-2 animate-slide-up z-40" style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' }}>
        <button 
          onClick={handleStartInquiry}
          className="w-full py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all duration-300 shadow-button press-effect hover-glow"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>ጠይቀው ይዘዙ</span>
        </button>
        
        {phone.exchange_available && (
          <button 
            onClick={handleExchange}
            className="w-full py-2 bg-muted text-foreground font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-muted/80 transition-all duration-300 press-effect"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Exchange</span>
          </button>
        )}
        
        {phone.exchange_available && (
          <p className="text-center text-[10px] text-muted-foreground">
            Exchange available. Final offer confirmed after inspection.
          </p>
        )}
      </div>
    </div>
  );
}

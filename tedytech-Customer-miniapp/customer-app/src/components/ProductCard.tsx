import { Heart } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { Phone } from '@/types/phone';
import { formatPrice, getPhoneDisplayName, getConditionLabel } from '@/types/phone';

interface ProductCardProps {
  phone: Phone;
  onClick: () => void;
  index?: number;
}

export function ProductCard({ phone, onClick, index = 0 }: ProductCardProps) {
  const { toggleSaved, isSaved } = useApp();
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  const saved = isSaved(phone.id);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHeartAnimating(true);
    toggleSaved(phone.id);
    setTimeout(() => setIsHeartAnimating(false), 400);
  };

  const displayName = getPhoneDisplayName(phone);
  const storageLabel = phone.storage_gb ? `${phone.storage_gb}GB` : null;
  const colorLabel = phone.color || null;
  const highlights = phone.key_highlights || [];
  const conditionLabel = getConditionLabel(phone.condition);

  return (
    <div 
      className={cn(
        "bg-card rounded-2xl overflow-hidden card-shadow hover-lift cursor-pointer group opacity-0 animate-fade-in",
        `stagger-${Math.min(index + 1, 6)}`
      )}
      style={{ animationFillMode: 'forwards' }}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        <img
          src={phone.main_image_url}
          alt={displayName}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover img-zoom"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        
        {/* New Arrival Badge */}
        {phone.is_new_arrival && (
          <span className="absolute top-2 left-2 px-2 py-1 bg-success text-white text-xs font-semibold rounded-lg animate-slide-in-left">
            New
          </span>
        )}
        
        {/* Heart Button */}
        <button
          onClick={handleSave}
          aria-label={saved ? "Remove from saved items" : "Save item"}
          className={cn(
            "absolute top-2 right-2 p-2 rounded-full transition-all duration-300 press-effect",
            saved 
              ? "bg-destructive text-destructive-foreground" 
              : "bg-card/80 backdrop-blur-sm text-muted-foreground hover:bg-card hover:text-destructive",
            isHeartAnimating && "animate-heart-pop"
          )}
        >
          <Heart className="w-4 h-4 transition-transform" fill={saved ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-foreground text-sm leading-tight mb-1 line-clamp-1">
          {displayName}
        </h3>
        
        {/* Storage, Color, Condition */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {storageLabel && (
            <span className="text-xs text-muted-foreground">{storageLabel}</span>
          )}
          {colorLabel && (
            <>
              {storageLabel && <span className="text-xs text-muted-foreground">•</span>}
              <span className="text-xs text-muted-foreground">{colorLabel}</span>
            </>
          )}
          {(storageLabel || colorLabel) && <span className="text-xs text-muted-foreground">•</span>}
          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded font-medium",
            phone.condition === 'new' ? "bg-success/25 text-[hsl(145_70%_45%)]" : "bg-muted text-muted-foreground"
          )}>
            {conditionLabel}
          </span>
        </div>
        
        {/* Key Highlights */}
        {highlights.length > 0 && (
          <ul className="text-[10px] text-muted-foreground mb-2 space-y-0.5">
            {highlights.slice(0, 3).map((highlight, i) => (
              <li key={i} className="flex items-start gap-1">
                <span className="text-primary mt-0.5">•</span>
                <span className="line-clamp-1">{highlight}</span>
              </li>
            ))}
          </ul>
        )}
        
        {/* Price */}
        <p className="text-price text-base mb-1">
          {formatPrice(phone.price_birr)}
        </p>
        
        {/* Exchange badge */}
        {phone.exchange_available && (
          <p className="text-[10px] text-success font-medium">
            Exchange Available
          </p>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { ArrowLeft, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { Accessory, formatPrice } from '@/data/products';
import { cn } from '@/lib/utils';

interface AccessoryDetailProps {
  accessory: Accessory;
  onBack: () => void;
}

export function AccessoryDetail({ accessory, onBack }: AccessoryDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageDirection, setImageDirection] = useState<'left' | 'right'>('right');
  
  const images = accessory.images.length > 0 ? accessory.images : [accessory.image];

  const nextImage = () => {
    setImageDirection('right');
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setImageDirection('left');
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

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
          <div className="w-9" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Image Gallery */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        <img
          key={currentImageIndex}
          src={images[currentImageIndex]}
          alt={accessory.name}
          className={cn(
            "w-full h-full object-cover",
            imageDirection === 'right' ? "animate-slide-in-left" : "animate-slide-in-right"
          )}
        />
        
        {/* Navigation Arrows */}
        {images.length > 1 && (
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
        
        {/* Category Badge */}
        <span className="absolute top-4 left-4 px-3 py-1.5 bg-secondary text-secondary-foreground text-sm font-medium rounded-lg">
          {accessory.category}
        </span>
        
        {/* Image Indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, index) => (
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
          <h2 className="text-2xl font-bold text-foreground mb-1">{accessory.name}</h2>
          <p className="text-2xl font-bold text-primary mb-4">{formatPrice(accessory.price)}</p>
          <p className="text-muted-foreground">{accessory.description}</p>
        </div>
      </div>

      {/* Bottom Actions - fixed above bottom nav with same styling as ProductDetail */}
      <div className="fixed left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border p-4 pb-5 space-y-2 animate-slide-up z-40" style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))' }}>
        <button className="w-full py-3.5 bg-primary text-primary-foreground font-semibold rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all duration-300 shadow-button press-effect hover-glow">
          <ShoppingBag className="w-5 h-5" />
          <span>ጠይቀው ይዘዙ</span>
        </button>
      </div>
    </div>
  );
}